/**
 * scripts/aggregate-data.ts (Story 2.0 T5).
 *
 * Build-Time-CLI: lädt MANIFEST.json + GeoJSONs via Node-FS, iteriert über
 * 12 Bezirke + 143 LOR-Bezirksregionen, ruft die Aggregat-Submodule auf und
 * upsertet die Resultate via Drizzle in `bezirk_stats` + `kiez_stats`.
 *
 * Run: `pnpm data:aggregate`.
 *
 * Idempotent: zweimal ausführen liefert identische Werte (modulo `computedAt`,
 * das per Default `now()` schreibt).
 */

import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Feature, FeatureCollection, Polygon, MultiPolygon } from 'geojson';
import turfArea from '@turf/area';

import type { Manifest, LayerEntry } from './lib/types.js';
import { normalizeSlug } from '../src/lib/data/internal/slug.js';
import { sql } from 'drizzle-orm';
import { getDb, closeDb } from '../src/lib/server/db/index.js';
import { bezirkStats, kiezStats } from '../src/lib/server/db/schema/index.js';

import { computeLaermAggregate } from './aggregate/laerm.js';
import { computeLuftAggregate } from './aggregate/luft.js';
import { computeGruenAggregate } from './aggregate/gruen.js';
import { computeKlimaAggregate } from './aggregate/klima.js';
import { computeWohnenAggregate } from './aggregate/wohnen.js';
import { computeOepnvAggregate } from './aggregate/oepnv.js';
import { computeBildungAggregate } from './aggregate/bildung.js';
import { computeHeritageAggregate } from './aggregate/heritage.js';
import type { BezirkAggregateRow, KiezAggregateRow } from './aggregate/types.js';

const LAYERS_DIR = 'static/layers';
const MANIFEST_PATH = `${LAYERS_DIR}/MANIFEST.json`;

const SLUG_BEZIRKE = 'bezirke';
const SLUG_BZR = 'lor-bezirksregion';
// klima-pet-2022 ist PMTiles (Story 10.10). PET-Werte kommen aus dem abgeleiteten
// Punkt-Set (Centroids mit pet14h), nicht aus dem binären Tile-Layer.
const PET_POINTS = 'static/data/klima-pet-points.geojson';

interface LoadedLayer {
	readonly slug: string;
	readonly features: Feature[];
	readonly sourceUpdatedAt: string;
}

async function readJson<T>(path: string): Promise<T> {
	return JSON.parse(await readFile(path, 'utf-8')) as T;
}

async function loadLayer(manifest: Manifest, slug: string): Promise<LoadedLayer | null> {
	const entry = manifest.layers.find((l: LayerEntry) => l.slug === slug);
	if (!entry) return null;
	const fc = await readJson<FeatureCollection>(join(LAYERS_DIR, entry.filename));
	return {
		slug,
		features: (fc.features ?? []) as Feature[],
		sourceUpdatedAt: entry.sourceUpdatedAt ?? entry.fetchedAt
	};
}

async function loadLayerOrThrow(manifest: Manifest, slug: string): Promise<LoadedLayer> {
	const l = await loadLayer(manifest, slug);
	if (!l) throw new Error(`Layer ${slug} fehlt im Manifest. Lauf zuerst pnpm data:fetch ${slug}.`);
	return l;
}

async function loadLayerOptional(manifest: Manifest, slug: string): Promise<LoadedLayer> {
	const l = await loadLayer(manifest, slug);
	return l ?? { slug, features: [], sourceUpdatedAt: new Date(0).toISOString() };
}

async function loadPetPoints(manifest: Manifest): Promise<LoadedLayer> {
	const entry = manifest.layers.find((l: LayerEntry) => l.slug === 'klima-pet-2022');
	const fc = await readJson<FeatureCollection>(PET_POINTS).catch(() => null);
	if (!fc) throw new Error(`${PET_POINTS} fehlt. Lauf zuerst pnpm data:pet-points.`);
	return {
		slug: 'klima-pet-2022',
		features: (fc.features ?? []) as Feature[],
		sourceUpdatedAt: entry?.sourceUpdatedAt ?? entry?.fetchedAt ?? new Date(0).toISOString()
	};
}

function getBezirkSlug(feature: Feature): string {
	const name = feature.properties?.Gemeinde_name;
	if (typeof name !== 'string') throw new Error('bezirke-Feature ohne Gemeinde_name');
	return normalizeSlug(name);
}

function getBezirksregionSlug(feature: Feature): string {
	const name = feature.properties?.BZR_NAME;
	if (typeof name !== 'string') throw new Error('lor-bezirksregion-Feature ohne BZR_NAME');
	return normalizeSlug(name);
}

function getBezirksregionParentBezirkCode(feature: Feature): string {
	// Property `BEZ` ist 2-stellig (z.B. '12'). Mapping zu Bezirks-Slug nicht trivial;
	// kommt aus Iteration über Bezirke (BEZ-Code = letzte zwei Stellen Schluessel_gesamt).
	const bez = feature.properties?.BEZ;
	if (typeof bez !== 'string') throw new Error('lor-bezirksregion-Feature ohne BEZ');
	return bez;
}

function bezirkCodeOf(feature: Feature): string {
	const total = feature.properties?.Schluessel_gesamt;
	if (typeof total !== 'string') throw new Error('bezirke-Feature ohne Schluessel_gesamt');
	return total.slice(-2);
}

interface AllSources {
	readonly laerm: LoadedLayer;
	readonly luft: LoadedLayer;
	readonly gruenversorgung: LoadedLayer;
	readonly gruenanlagen: LoadedLayer;
	readonly spielplaetze: LoadedLayer;
	readonly klima: LoadedLayer;
	readonly wohnlagen: LoadedLayer;
	readonly mss: LoadedLayer;
	readonly ubahn: LoadedLayer;
	readonly sbahn: LoadedLayer;
	readonly tram: LoadedLayer;
	readonly bus: LoadedLayer;
	readonly kitas: LoadedLayer;
	readonly schulen: LoadedLayer;
	readonly denkmal: LoadedLayer;
	readonly stolpersteine: LoadedLayer;
}

async function loadAllSources(manifest: Manifest): Promise<AllSources> {
	const [
		laerm,
		luft,
		gruenversorgung,
		gruenanlagen,
		spielplaetze,
		klima,
		wohnlagen,
		mss,
		ubahn,
		sbahn,
		tram,
		bus,
		kitas,
		schulen,
		denkmal,
		stolpersteine
	] = await Promise.all([
		loadLayerOrThrow(manifest, 'laerm-2023'),
		loadLayerOrThrow(manifest, 'luft-2023'),
		loadLayerOrThrow(manifest, 'gruenversorgung-2023'),
		loadLayerOrThrow(manifest, 'gruenanlagen'),
		loadLayerOrThrow(manifest, 'spielplaetze'),
		loadPetPoints(manifest),
		loadLayerOptional(manifest, 'wohnlagen-2024'),
		loadLayerOrThrow(manifest, 'mss-gesamtindex-2025'),
		loadLayerOrThrow(manifest, 'ubahn-stationen'),
		loadLayerOrThrow(manifest, 'sbahn-stationen'),
		loadLayerOrThrow(manifest, 'tram-haltestellen'),
		loadLayerOrThrow(manifest, 'bus-haltestellen'),
		loadLayerOrThrow(manifest, 'kitas-2024'),
		loadLayerOrThrow(manifest, 'schulen-2024'),
		loadLayerOrThrow(manifest, 'denkmal-2024'),
		loadLayerOrThrow(manifest, 'stolpersteine')
	]);
	return {
		laerm,
		luft,
		gruenversorgung,
		gruenanlagen,
		spielplaetze,
		klima,
		wohnlagen,
		mss,
		ubahn,
		sbahn,
		tram,
		bus,
		kitas,
		schulen,
		denkmal,
		stolpersteine
	};
}

function computeAggregate(
	target: Feature<Polygon | MultiPolygon>,
	areaM2: number,
	src: AllSources
): Omit<BezirkAggregateRow, 'slug'> {
	return {
		laerm: computeLaermAggregate(
			{ features: src.laerm.features, sourceUpdatedAt: src.laerm.sourceUpdatedAt },
			target
		),
		luft: computeLuftAggregate(
			{ features: src.luft.features, sourceUpdatedAt: src.luft.sourceUpdatedAt },
			target
		),
		gruen: computeGruenAggregate(
			{
				versorgungFeatures: src.gruenversorgung.features,
				versorgungSourceUpdatedAt: src.gruenversorgung.sourceUpdatedAt,
				gruenanlagenFeatures: src.gruenanlagen.features,
				gruenanlagenSourceUpdatedAt: src.gruenanlagen.sourceUpdatedAt,
				spielplaetzeFeatures: src.spielplaetze.features,
				spielplaetzeSourceUpdatedAt: src.spielplaetze.sourceUpdatedAt
			},
			target
		),
		klima: computeKlimaAggregate(
			{ features: src.klima.features, sourceUpdatedAt: src.klima.sourceUpdatedAt },
			target
		),
		wohnen: computeWohnenAggregate(
			{
				wohnlagenFeatures: src.wohnlagen.features,
				wohnlagenSourceUpdatedAt: src.wohnlagen.sourceUpdatedAt,
				mssFeatures: src.mss.features,
				mssSourceUpdatedAt: src.mss.sourceUpdatedAt
			},
			target
		),
		oepnv: computeOepnvAggregate(
			{
				ubahnFeatures: src.ubahn.features,
				ubahnSourceUpdatedAt: src.ubahn.sourceUpdatedAt,
				sbahnFeatures: src.sbahn.features,
				sbahnSourceUpdatedAt: src.sbahn.sourceUpdatedAt,
				tramFeatures: src.tram.features,
				tramSourceUpdatedAt: src.tram.sourceUpdatedAt,
				busFeatures: src.bus.features,
				busSourceUpdatedAt: src.bus.sourceUpdatedAt
			},
			target,
			areaM2
		),
		bildung: computeBildungAggregate(
			{
				kitasFeatures: src.kitas.features,
				kitasSourceUpdatedAt: src.kitas.sourceUpdatedAt,
				schulenFeatures: src.schulen.features,
				schulenSourceUpdatedAt: src.schulen.sourceUpdatedAt
			},
			target,
			areaM2
		),
		heritage: computeHeritageAggregate(
			{
				denkmalFeatures: src.denkmal.features,
				denkmalSourceUpdatedAt: src.denkmal.sourceUpdatedAt,
				stolpersteineFeatures: src.stolpersteine.features,
				stolpersteineSourceUpdatedAt: src.stolpersteine.sourceUpdatedAt
			},
			target,
			areaM2
		)
	};
}

export async function aggregateAll(): Promise<{
	bezirke: BezirkAggregateRow[];
	kieze: KiezAggregateRow[];
}> {
	console.log('[aggregate] loading manifest…');
	const manifest = await readJson<Manifest>(MANIFEST_PATH);
	const bezirkLayer = await loadLayerOrThrow(manifest, SLUG_BEZIRKE);
	const bzrLayer = await loadLayerOrThrow(manifest, SLUG_BZR);
	console.log(
		`[aggregate] ${bezirkLayer.features.length} bezirke, ${bzrLayer.features.length} bezirksregionen`
	);

	const sources = await loadAllSources(manifest);

	// Bezirk-Code → Slug-Map (für FK-Resolution kiez_stats.bezirk_slug)
	const bezirkCodeToSlug = new Map<string, string>();
	for (const b of bezirkLayer.features) {
		bezirkCodeToSlug.set(bezirkCodeOf(b), getBezirkSlug(b));
	}

	const bezirkRows: BezirkAggregateRow[] = [];
	for (const f of bezirkLayer.features) {
		const slug = getBezirkSlug(f);
		const target = f as Feature<Polygon | MultiPolygon>;
		const areaM2 = turfArea(target);
		const agg = computeAggregate(target, areaM2, sources);
		bezirkRows.push({ slug, ...agg });
		console.log(`[aggregate] bezirk ${slug} done (area=${(areaM2 / 1_000_000).toFixed(1)}km²)`);
	}

	// Disambiguation: 2 BZRs heißen "Heerstraße" (Charlottenburg-Wilmersdorf
	// + Spandau). Bei Kollision wird der Bezirks-Slug als Suffix angehängt
	// (`heerstrasse-spandau`). Eindeutige Slugs bleiben unverändert.
	const slugCounts = new Map<string, number>();
	for (const f of bzrLayer.features) {
		const baseSlug = getBezirksregionSlug(f);
		slugCounts.set(baseSlug, (slugCounts.get(baseSlug) ?? 0) + 1);
	}

	const kiezRows: KiezAggregateRow[] = [];
	for (const f of bzrLayer.features) {
		const baseSlug = getBezirksregionSlug(f);
		const target = f as Feature<Polygon | MultiPolygon>;
		const areaM2 = turfArea(target);
		const bezCode = getBezirksregionParentBezirkCode(f);
		const bezirkSlug = bezirkCodeToSlug.get(bezCode);
		if (!bezirkSlug) {
			throw new Error(`Kein Bezirk gefunden für BZR ${baseSlug} mit BEZ-Code ${bezCode}`);
		}
		const slug = (slugCounts.get(baseSlug) ?? 0) > 1 ? `${baseSlug}-${bezirkSlug}` : baseSlug;
		const agg = computeAggregate(target, areaM2, sources);
		kiezRows.push({ slug, bezirkSlug, ...agg });
	}
	console.log(`[aggregate] ${kiezRows.length} kieze done`);

	return { bezirke: bezirkRows, kieze: kiezRows };
}

async function upsertAll(rows: {
	bezirke: BezirkAggregateRow[];
	kieze: KiezAggregateRow[];
}): Promise<void> {
	const db = getDb();
	// Full-refresh-Pattern: TRUNCATE vor Insert garantiert Idempotenz auch nach
	// Slug-Renames (z.B. Disambiguation-Wechsel). FK in kiez_stats hat ON DELETE
	// RESTRICT, deshalb kiez_stats zuerst leeren.
	console.log('[aggregate] truncating kiez_stats + bezirk_stats…');
	await db.execute(sql`TRUNCATE TABLE kiez_stats, bezirk_stats RESTART IDENTITY CASCADE`);
	console.log('[aggregate] upserting bezirk_stats…');
	for (const r of rows.bezirke) {
		await db
			.insert(bezirkStats)
			.values({
				slug: r.slug,
				laerm: r.laerm,
				luft: r.luft,
				gruen: r.gruen,
				klima: r.klima,
				wohnen: r.wohnen,
				oepnv: r.oepnv,
				bildung: r.bildung,
				heritage: r.heritage
			})
			.onConflictDoUpdate({
				target: bezirkStats.slug,
				set: {
					laerm: r.laerm,
					luft: r.luft,
					gruen: r.gruen,
					klima: r.klima,
					wohnen: r.wohnen,
					oepnv: r.oepnv,
					bildung: r.bildung,
					heritage: r.heritage,
					computedAt: new Date()
				}
			});
	}
	console.log('[aggregate] upserting kiez_stats…');
	for (const r of rows.kieze) {
		await db
			.insert(kiezStats)
			.values({
				slug: r.slug,
				bezirkSlug: r.bezirkSlug,
				laerm: r.laerm,
				luft: r.luft,
				gruen: r.gruen,
				klima: r.klima,
				wohnen: r.wohnen,
				oepnv: r.oepnv,
				bildung: r.bildung,
				heritage: r.heritage
			})
			.onConflictDoUpdate({
				target: kiezStats.slug,
				set: {
					bezirkSlug: r.bezirkSlug,
					laerm: r.laerm,
					luft: r.luft,
					gruen: r.gruen,
					klima: r.klima,
					wohnen: r.wohnen,
					oepnv: r.oepnv,
					bildung: r.bildung,
					heritage: r.heritage,
					computedAt: new Date()
				}
			});
	}
}

async function main(): Promise<void> {
	const t0 = Date.now();
	const rows = await aggregateAll();
	await upsertAll(rows);
	await closeDb();
	console.log(`[aggregate] done in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
	main().catch((err) => {
		console.error('[aggregate] failed:', err);
		process.exit(1);
	});
}
