import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { sql, eq, and } from 'drizzle-orm';
import { closeDb, getDb } from '../src/lib/server/db/index.js';
import {
	wahl as wahlTable,
	wahlAggregatKiez,
	wahlStimmbezirkGruppe
} from '../src/lib/server/db/schema/index.js';
import { ManifestSchema } from './lib/manifest.js';
import { GEO_SOURCES, WAHL_TO_GEO } from './wahlen/lib/sbb-geo-sources.js';
import { WAHL_SOURCES } from './wahlen/lib/sources.js';
import { buildKiezMappings } from './wahlen/lib/kiez-mapper.js';
import { buildGruppeMappings } from './wahlen/lib/gruppe-mapper.js';
import { buildKiezAggregatPlan } from './wahlen/lib/kiez-aggregat-plan.js';
import type { ErgebnisRow } from './wahlen/lib/briefwahl-split.js';
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

/**
 * Preflight (Boundary "kein stilles Weglassen"): wirft, sobald eine
 * Urnen-Fläche keine Gruppen-ID auflösen konnte (leere BWB-Spalte oder
 * unbekanntes Schema) -- ein Geometrie-/Schema-Fehler, kein Datenfehler
 * einer einzelnen Wahl, deshalb pro Geo-Slug (nicht pro Wahl) geprüft,
 * bevor die Wahl-Schleife überhaupt startet.
 *
 * Kein "Gruppen über Bezirksgrenzen"-Check mehr (Review-Fund, entfernt):
 * strukturell wirkungslos, siehe Kommentar in `gruppe-preflight.ts`.
 */
function preflightGeometrie(
	geoSlug: string,
	wahlSlug: string,
	gruppeResult: ReturnType<typeof buildGruppeMappings>
): void {
	if (gruppeResult.unresolvedFeatureCount > 0) {
		throw new Error(
			`[kiez-aggregat] ${wahlSlug} (geo=${geoSlug}): ${gruppeResult.unresolvedFeatureCount} Urnen-Feature(s) ohne auflösbare Gruppen-ID (leere BWB-Spalte oder unbekanntes Schema) -- Build-Abbruch`
		);
	}
}

/**
 * Ordnet jeder DB-`stimmbezirk`-Row (Urne oder Briefwahl) ihren
 * `ist_briefwahl_aggregat`-Status zu (Ground-Truth statt Bezirksart-Raten:
 * die Konvention unterscheidet sich zwischen BTW `'0'` und AGH/BVV `'W'`
 * für Urnen, `ergebnis.ist_briefwahl_aggregat` ist bereits korrekt
 * berechnet).
 */
async function loadStimmbezirkKlassifikation(
	wahlId: number
): Promise<{
	dbUrneUwbIds: string[];
	dbBriefUwbIds: string[];
	wahlberechtigteByUwbId: Map<string, number | null>;
}> {
	const db = getDb();
	const rows = await db.execute<{
		uwb_id: string;
		wahlberechtigte: number | null;
		ist_brief: boolean;
	}>(sql`
		SELECT
			s.uwb_id,
			s.wahlberechtigte,
			COALESCE(bool_or(e.ist_briefwahl_aggregat), false) AS ist_brief
		FROM stimmbezirk s
		LEFT JOIN ergebnis e ON e.wahl_id = s.wahl_id AND e.uwb_id = s.uwb_id
		WHERE s.wahl_id = ${wahlId}
		GROUP BY s.uwb_id, s.wahlberechtigte
	`);

	const dbUrneUwbIds: string[] = [];
	const dbBriefUwbIds: string[] = [];
	const wahlberechtigteByUwbId = new Map<string, number | null>();
	for (const r of rows) {
		wahlberechtigteByUwbId.set(r.uwb_id, r.wahlberechtigte);
		if (r.ist_brief) dbBriefUwbIds.push(r.uwb_id);
		else dbUrneUwbIds.push(r.uwb_id);
	}
	return { dbUrneUwbIds, dbBriefUwbIds, wahlberechtigteByUwbId };
}

async function loadErgebnisRows(wahlId: number): Promise<ErgebnisRow[]> {
	const db = getDb();
	const rows = await db.execute<{ uwb_id: string; partei_id: number; stimmen: number }>(sql`
		SELECT uwb_id, partei_id, stimmen FROM ergebnis WHERE wahl_id = ${wahlId}
	`);
	return rows.map((r) => ({ uwbId: r.uwb_id, parteiId: r.partei_id, stimmen: r.stimmen }));
}

/**
 * Amtliche Berlin-Summe für den Summen-Check, unabhängig von `ergebnisRows`
 * geladen (Review-Fund: gegen dieselben Rows zu prüfen, aus denen auch die
 * Gruppen-Summe gebildet wird, ist keine unabhängige Kontrolle). Liest
 * `wahl_aggregat_berlin` (gebaut von `buildAggregates` während
 * `data:wahl-fetch`, unverändert -- Never-Boundary).
 */
async function loadBerlinSumme(wahlId: number): Promise<number> {
	const db = getDb();
	const rows = await db.execute<{ summe: number | null }>(sql`
		SELECT SUM(stimmen)::int AS summe FROM wahl_aggregat_berlin WHERE wahl_id = ${wahlId}
	`);
	return rows[0]?.summe ?? 0;
}

/**
 * Schreibt den fertigen Plan (Gruppen-Zuordnung + Kiez-Aggregat) in EINER
 * Transaktion (Review-Fund: Löschen/Schreiben lief vorher als separate,
 * unverbundene Statements -- ein Absturz mittendrin hätte `wahl_stimm-
 * bezirk_gruppe` gelöscht, aber `wahl_aggregat_kiez` noch auf dem alten
 * Stand gelassen, oder umgekehrt).
 */
async function writePlan(
	wahlId: number,
	plan: ReturnType<typeof buildKiezAggregatPlan>
): Promise<void> {
	const db = getDb();
	const CHUNK = 1000;
	await db.transaction(async (tx) => {
		await tx.delete(wahlStimmbezirkGruppe).where(eq(wahlStimmbezirkGruppe.wahlId, wahlId));
		const gruppenValues = plan.gruppenZuordnungValues.map((v) => ({
			wahlId,
			uwbId: v.uwbId,
			gruppeId: v.gruppeId
		}));
		for (let i = 0; i < gruppenValues.length; i += CHUNK) {
			await tx
				.insert(wahlStimmbezirkGruppe)
				.values(gruppenValues.slice(i, i + CHUNK))
				.onConflictDoNothing();
		}

		await tx.delete(wahlAggregatKiez).where(eq(wahlAggregatKiez.wahlId, wahlId));
		const kiezValues = plan.kiezAggregatInsertValues.map((v) => ({
			wahlId,
			kiezSlug: v.kiezSlug,
			parteiId: v.parteiId,
			stimmen: v.stimmen,
			anteil: v.anteil
		}));
		for (let i = 0; i < kiezValues.length; i += CHUNK) {
			await tx.insert(wahlAggregatKiez).values(kiezValues.slice(i, i + CHUNK));
		}
	});
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
	const bezirkeLayer = manifest.layers.find((l) => l.slug === 'bezirke');
	if (!geoLayer) throw new Error(`manifest missing wahlbezirke-${geoSlug}`);
	if (!lorLayer) throw new Error('manifest missing lor-bezirksregion');
	if (!bezirkeLayer) throw new Error('manifest missing bezirke');

	const [geoFc, lorFc, bezirkeFc] = await Promise.all([
		loadFc(geoLayer.filename),
		loadFc(lorLayer.filename),
		loadFc(bezirkeLayer.filename)
	]);
	console.log(
		`[kiez-aggregat] ${wahlSlug} geo=${geoFc.features.length} features, lor=${lorFc.features.length} BR`
	);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const kiezMappings = buildKiezMappings(geoFc as any, lorFc as any, wahlSlug, bezirkeFc as any);
	console.log(`[kiez-aggregat] ${wahlSlug} kiez-mappings=${kiezMappings.length}`);
	const kiezSlugByUwbId = new Map(kiezMappings.map((m) => [m.dbUwbId, m.kiezSlug] as const));

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const gruppeResult = buildGruppeMappings(geoFc as any, wahlSlug);
	preflightGeometrie(geoSlug, wahlSlug, gruppeResult);
	console.log(
		`[kiez-aggregat] ${wahlSlug} gruppe-mappings=${gruppeResult.mappings.length} unresolved=${gruppeResult.unresolvedFeatureCount}`
	);
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

		const { dbUrneUwbIds, dbBriefUwbIds, wahlberechtigteByUwbId } =
			await loadStimmbezirkKlassifikation(wahlId);
		const ergebnisRows = await loadErgebnisRows(wahlId);
		const berlinSumme = await loadBerlinSumme(wahlId);

		// Reiner Rechenkern (alle Gates + Anteil-Berechnung): DB-frei,
		// unit-testbar ohne Postgres (Review-Fund, vorher nur im Real-Build
		// erreichbar). Wirft bei jeder Gate-Verletzung.
		const plan = buildKiezAggregatPlan({
			wahlSlug,
			stimmtyp,
			wahlId,
			geometryMappings: gruppeResult.mappings,
			dbUrneUwbIds,
			dbBriefUwbIds,
			wahlberechtigteByUwbId,
			kiezSlugByUwbId,
			ergebnisRows,
			berlinSumme
		});
		for (const line of plan.logs) console.log(`[kiez-aggregat] ${wahlSlug}/${stimmtyp}: ${line}`);

		await writePlan(wahlId, plan);

		const counted = await db
			.select({ count: sql<number>`count(*)::int` })
			.from(wahlAggregatKiez)
			.where(eq(wahlAggregatKiez.wahlId, wahlId));

		console.log(
			`[kiez-aggregat] ${wahlSlug}/${stimmtyp} wahlId=${wahlId} kiez-rows=${counted[0]?.count ?? 0} gruppen-rows=${plan.gruppenZuordnungValues.length}`
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
