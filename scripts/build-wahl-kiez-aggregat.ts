import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { sql, eq, and } from 'drizzle-orm';
import { closeDb, getDb } from '../src/lib/server/db/index.js';
import {
	wahl as wahlTable,
	wahlAggregatKiez
} from '../src/lib/server/db/schema/index.js';
import { ManifestSchema } from './lib/manifest.js';
import { GEO_SOURCES, WAHL_TO_GEO } from './wahlen/lib/sbb-geo-sources.js';
import { WAHL_SOURCES } from './wahlen/lib/sources.js';
import { buildKiezMappings } from './wahlen/lib/kiez-mapper.js';
import type { Manifest } from './lib/types.js';

const LAYERS_DIR = join(process.cwd(), 'static', 'layers');
const MANIFEST_PATH = join(LAYERS_DIR, 'MANIFEST.json');

async function loadManifest(): Promise<Manifest> {
	if (!existsSync(MANIFEST_PATH)) throw new Error('static/layers/MANIFEST.json not found');
	const raw = await readFile(MANIFEST_PATH, 'utf-8');
	return ManifestSchema.parse(JSON.parse(raw));
}

async function loadFc(filename: string): Promise<{ features: unknown[] }> {
	const raw = await readFile(join(LAYERS_DIR, filename), 'utf-8');
	return JSON.parse(raw);
}

async function processOneWahl(wahlSlug: string): Promise<void> {
	const wahlSource = WAHL_SOURCES.find((w) => w.slug === wahlSlug);
	if (!wahlSource) throw new Error(`unknown wahl-slug: ${wahlSlug}`);

	const geoSlug = WAHL_TO_GEO.get(wahlSlug);
	if (!geoSlug) {
		console.log(`[kiez-aggregat] ${wahlSlug} skipped: no geometry available (pre-2017 wahl)`);
		return;
	}

	const geoSource = GEO_SOURCES.find((g) => g.slug === geoSlug);
	if (!geoSource) throw new Error(`unknown geo-slug: ${geoSlug}`);

	const manifest = await loadManifest();
	const geoLayer = manifest.layers.find((l) => l.slug === `wahlbezirke-${geoSlug}`);
	const lorLayer = manifest.layers.find((l) => l.slug === 'lor-bezirksregion');
	if (!geoLayer) throw new Error(`manifest missing wahlbezirke-${geoSlug}`);
	if (!lorLayer) throw new Error('manifest missing lor-bezirksregion');

	const [geoFc, lorFc] = await Promise.all([loadFc(geoLayer.filename), loadFc(lorLayer.filename)]);
	console.log(
		`[kiez-aggregat] ${wahlSlug} geo=${geoFc.features.length} features, lor=${lorFc.features.length} BR`
	);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const mappings = buildKiezMappings(geoFc as any, lorFc as any, wahlSlug);
	console.log(`[kiez-aggregat] ${wahlSlug} mappings=${mappings.length}`);

	const db = getDb();

	const stimmtypen: ('erststimme' | 'zweitstimme' | 'einstimme')[] =
		wahlSource.wahl === 'bvv' ? ['einstimme'] : ['erststimme', 'zweitstimme'];

	for (const stimmtyp of stimmtypen) {
		const wahlRow = await db
			.select({ id: wahlTable.id })
			.from(wahlTable)
			.where(
				and(
					eq(wahlTable.jahr, wahlSource.jahr),
					eq(wahlTable.typ, wahlSource.wahl),
					eq(wahlTable.stimmtyp, stimmtyp)
				)
			)
			.limit(1);
		if (wahlRow.length === 0) {
			console.log(`[kiez-aggregat] ${wahlSlug}/${stimmtyp} no wahl row in DB, skip`);
			continue;
		}
		const wahlId = wahlRow[0].id;

		await db.delete(wahlAggregatKiez).where(eq(wahlAggregatKiez.wahlId, wahlId));

		const mappingsJson = JSON.stringify(
			mappings.map((m) => ({ uwb_id: m.dbUwbId, kiez_slug: m.kiezSlug }))
		);

		await db.execute(sql`
			WITH mapping AS (
				SELECT * FROM jsonb_to_recordset(${mappingsJson}::jsonb) AS x(uwb_id TEXT, kiez_slug TEXT)
			),
			summed AS (
				SELECT
					e.wahl_id,
					m.kiez_slug,
					e.partei_id,
					SUM(e.stimmen)::int AS stimmen
				FROM ergebnis e
				JOIN mapping m ON m.uwb_id = e.uwb_id
				WHERE e.wahl_id = ${wahlId} AND e.ist_briefwahl_aggregat = false
				GROUP BY e.wahl_id, m.kiez_slug, e.partei_id
			)
			INSERT INTO wahl_aggregat_kiez (wahl_id, kiez_slug, partei_id, stimmen, anteil, computed_at)
			SELECT
				wahl_id,
				kiez_slug,
				partei_id,
				stimmen,
				(stimmen::float / NULLIF(SUM(stimmen) OVER (PARTITION BY wahl_id, kiez_slug), 0))::real AS anteil,
				now() AS computed_at
			FROM summed
		`);

		const counted = await db
			.select({ count: sql<number>`count(*)::int` })
			.from(wahlAggregatKiez)
			.where(eq(wahlAggregatKiez.wahlId, wahlId));

		console.log(
			`[kiez-aggregat] ${wahlSlug}/${stimmtyp} wahlId=${wahlId} kiez-rows=${counted[0]?.count ?? 0}`
		);
	}
}

function parseArgs(argv: readonly string[]): { only?: string } {
	for (const arg of argv) {
		if (arg.startsWith('--only=')) return { only: arg.slice('--only='.length) };
	}
	return {};
}

async function main(): Promise<void> {
	const args = parseArgs(process.argv.slice(2));
	const wahlSlugs = args.only
		? [args.only]
		: WAHL_SOURCES.filter((w) => WAHL_TO_GEO.has(w.slug)).map((w) => w.slug);

	try {
		for (const slug of wahlSlugs) {
			await processOneWahl(slug);
		}
	} finally {
		await closeDb();
	}
}

main().catch((err) => {
	console.error(err);
	process.exitCode = 1;
});
