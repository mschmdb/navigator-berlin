import { readFile, writeFile, mkdir, readdir, unlink } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import type { Feature, FeatureCollection } from 'geojson';
import type { LayerEntry, Manifest } from './lib/types.js';
import {
	buildKiezScoresFromInput,
	buildDerivedLayerGeojsons
} from './lib/kiez-score/pipeline.js';
import type { BuildLayerSpec } from './lib/kiez-score/build-helpers.js';
import type { LayerHitLike } from './lib/kiez-score/types.js';
import type { OepnvStopIndexShape } from './lib/kiez-score/nearest-stops.js';
import { defaultLorIdFor } from './lib/kiez-score/pipeline.js';
import { aggregateKitaPlaetzeByLor, plaetzeProKind } from './lib/kiez-score/kita-supply.js';
import { splitSchulenByArt } from './lib/kiez-score/schul-supply.js';
import { validateKiezScoreOutput } from './lib/kiez-score/output-schema.js';

interface EinwohnerRecord {
	plrId: string;
	kinder0bis6: number;
}

interface LaermDbRecord {
	plrId: string;
	dbDenMean: number;
}

interface KriminalitaetRecord {
	plrId: string;
	index: number | null;
}

const STATIC = 'static';
const LAYERS_DIR = `${STATIC}/layers`;
const MANIFEST = `${LAYERS_DIR}/MANIFEST.json`;
const OEPNV_INDEX = `${STATIC}/oepnv-stops-index.json`;
const PET_POINTS = `${STATIC}/data/klima-pet-points.geojson`;
const EINWOHNER = `${STATIC}/data/einwohner-lor.json`;
const LAERM_DB = `${STATIC}/data/laerm-db-lor.json`;
const KRIMINALITAET = `${STATIC}/data/kriminalitaet-lor.json`;
const OUT = `${STATIC}/kiez-scores/kiez-scores.json`;

// ADR-015: MSS + Umweltgerechtigkeit sind keine Score-Inputs mehr. klima-pet (Grün & Hitze)
// + Milieuschutz (Wohnschutz, presence via Punkt-in-Polygon am LOR-Centroid) neu.
const POLYGON_SCORE_LAYERS = [
	// laerm-2023 (3-Stufen) ist seit Story 10.6b kein Score-Input mehr (jetzt dB-Mittel via
	// laerm-db perLorHits), bleibt aber Map-Layer. luft-2023 weiter ordinal.
	'luft-2023',
	'bioklima-2023',
	'gruenversorgung-2023',
	'klima-kaltlufteinwirkbereich-2022',
	'klima-leitbahnkorridor-2022',
	'milieuschutz-erhaltungsmiete',
	'milieuschutz-staedtebau'
];

// klima-pet-2022 ist als PMTiles publiziert (Story 10.10). Der Score liest den PET-Wert
// aus dem abgeleiteten Punkt-Set (nächster Centroid am LOR-Centroid) statt Point-in-Polygon.
const POINT_VALUE_LAYERS = ['klima-pet-2022'];

const PRESENCE_LAYERS = ['radverkehrsnetz-2025', 'fahrradstrassen-2024'];

// Epic 12 (Story 12.0): Nahversorgungs-POIs in den PoiIndex aufnehmen. Reine Vorverdrahtung —
// ein Score-Effekt entsteht erst mit einem poi-density-LayerWeight in VERSORGUNG_CONFIG (Story 12.1/12.2).
const POI_LAYERS = [
	'kitas-2024',
	'spielplaetze',
	'gruenanlagen',
	'nahversorgung-lebensmittel',
	'nahversorgung-apotheke',
	'nahversorgung-post',
	// Epic 13 (Story 13.0): Kultur-POIs in den PoiIndex. Vorverdrahtung — Score-Effekt erst mit
	// KULTUR_CONFIG (Story 13.1). Kein Effekt auf den Versorgungs-/Composite-Score bis dahin.
	'kultur-museum',
	'kultur-galerie',
	'kultur-kunst-im-raum',
	'kultur-theater',
	'kultur-bibliothek',
	'kultur-kino',
	'kultur-soziokultur',
	'kultur-club'
];

// Story 10.2: krankenhaeuser-plan als Point-Value-Layer (nächstes Haus + betten_insgesamt
// + distanceM) statt reiner POI-Distanz, damit die Kapazitätsgewichtung greift.
const POINT_VALUE_MANIFEST_LAYERS = ['krankenhaeuser-plan'];

async function readJson<T>(path: string): Promise<T> {
	return JSON.parse(await readFile(path, 'utf-8')) as T;
}

async function loadLayerFeatures(
	slug: string,
	manifest: Manifest
): Promise<readonly Feature[] | null> {
	const entry = manifest.layers.find((l) => l.slug === slug);
	if (!entry) return null;
	const fc = await readJson<FeatureCollection>(join(LAYERS_DIR, entry.filename));
	return fc.features ?? null;
}

/**
 * Vorberechnete Per-LOR-Hits (Stories 10.1 + 10.6b):
 * - `kitas-pro-kind`: Σ e_platz der Kitas im LOR ÷ Kinder 0-6 (Einwohner-Join 10.0)
 * - `laerm-db`: dB-Mittel (L_DEN) pro LOR aus den Fassadenpunkten (10.6b)
 */
async function buildPerLorHits(
	lorFeatures: readonly Feature[],
	poiLayers: readonly BuildLayerSpec[]
): Promise<Record<string, LayerHitLike[]>> {
	const kitaFeatures = poiLayers.find((l) => l.slug === 'kitas-2024')?.features ?? [];
	const einwohner = await readJson<{ records: EinwohnerRecord[] }>(EINWOHNER).catch(() => null);
	if (!einwohner) throw new Error(`${EINWOHNER} fehlt. Lauf zuerst pnpm fetch:einwohner.`);
	const kinderByPlr = new Map(einwohner.records.map((r) => [r.plrId, r.kinder0bis6]));
	const plaetzeByLor = aggregateKitaPlaetzeByLor(lorFeatures, kitaFeatures, (f) => defaultLorIdFor(f) ?? '');

	const laerm = await readJson<{ records: LaermDbRecord[] }>(LAERM_DB).catch(() => null);
	if (!laerm) throw new Error(`${LAERM_DB} fehlt. Lauf zuerst pnpm data:laerm-db.`);
	const dbByPlr = new Map(laerm.records.map((r) => [r.plrId, r.dbDenMean]));

	// Story 14.3: Kriminalitäts-Index pro PLR (BR-nativ, auf PLR gespiegelt in 14.0).
	const krimi = await readJson<{ records: KriminalitaetRecord[] }>(KRIMINALITAET).catch(() => null);
	if (!krimi) throw new Error(`${KRIMINALITAET} fehlt. Lauf zuerst pnpm data:kriminalitaet.`);
	const krimiByPlr = new Map(krimi.records.map((r) => [r.plrId, r.index]));

	const out: Record<string, LayerHitLike[]> = {};
	const push = (lorId: string, hit: LayerHitLike) => {
		(out[lorId] = out[lorId] ?? []).push(hit);
	};
	for (const lor of lorFeatures) {
		const lorId = defaultLorIdFor(lor);
		if (!lorId) continue;
		const proKind = plaetzeProKind(plaetzeByLor[lorId] ?? 0, kinderByPlr.get(lorId) ?? null);
		if (proKind !== null) push(lorId, { layer: 'kitas-pro-kind', value: { plaetzeProKind: proKind } });
		const db = dbByPlr.get(lorId);
		if (db !== undefined) push(lorId, { layer: 'laerm-db', value: { ges_den: db } });
		const krimiIndex = krimiByPlr.get(lorId);
		if (typeof krimiIndex === 'number') push(lorId, { layer: 'kriminalitaet', value: { index: krimiIndex } });
	}
	return out;
}

export async function buildKiezScores(): Promise<{ outPath: string; scoreCount: number }> {
	const manifest = await readJson<Manifest>(MANIFEST);
	const lorFeatures = await loadLayerFeatures('lor-planungsraum', manifest);
	if (!lorFeatures) throw new Error('lor-planungsraum nicht im Manifest gefunden');

	const polygonLayers: BuildLayerSpec[] = [];
	for (const slug of POLYGON_SCORE_LAYERS) {
		const features = await loadLayerFeatures(slug, manifest);
		if (features) polygonLayers.push({ slug, features });
	}
	const presenceLayersAvailable = PRESENCE_LAYERS.filter((slug) =>
		manifest.layers.some((l) => l.slug === slug)
	);

	const poiLayers: BuildLayerSpec[] = [];
	for (const slug of POI_LAYERS) {
		const features = await loadLayerFeatures(slug, manifest);
		if (features) poiLayers.push({ slug, features });
	}

	// Story 10.3: schulen-2024 nach Schulart in zwei virtuelle POI-Layer splitten
	// (eigene Distanz-Schwellen pro Schulart, siehe VERSORGUNG_CONFIG).
	const schulenFeatures = await loadLayerFeatures('schulen-2024', manifest);
	if (schulenFeatures) {
		const { grundschule, weiterfuehrend } = splitSchulenByArt(schulenFeatures);
		poiLayers.push({ slug: 'schulen-grundschule', features: grundschule });
		poiLayers.push({ slug: 'schulen-weiterfuehrend', features: weiterfuehrend });
	}

	const oepnvIndex = await readJson<OepnvStopIndexShape>(OEPNV_INDEX);

	// Stories 10.1 + 10.6b: vorberechnete Per-LOR-Hits (Kita-pro-Kind + Lärm-dB-Mittel).
	const perLorHits = await buildPerLorHits(lorFeatures, poiLayers);

	const pointValueLayers: BuildLayerSpec[] = [];
	for (const slug of POINT_VALUE_LAYERS) {
		const fc = await readJson<FeatureCollection>(PET_POINTS).catch(() => null);
		if (!fc) throw new Error(`${slug}: ${PET_POINTS} fehlt. Lauf zuerst pnpm data:pet-points.`);
		pointValueLayers.push({ slug, features: fc.features ?? [] });
	}
	for (const slug of POINT_VALUE_MANIFEST_LAYERS) {
		const features = await loadLayerFeatures(slug, manifest);
		if (features) pointValueLayers.push({ slug, features });
	}

	const output = buildKiezScoresFromInput(
		{
			lorFeatures,
			polygonLayers,
			presenceLayers: presenceLayersAvailable,
			poiLayers,
			pointValueLayers,
			perLorHits,
			oepnvIndex
		},
		new Date().toISOString()
	);
	validateKiezScoreOutput(output);

	await mkdir(dirname(OUT), { recursive: true });
	await writeFile(OUT, JSON.stringify(output));
	const count = Object.keys(output.scores).length;
	console.log(`[kiez-scores] wrote ${OUT}: ${count} scores`);

	const derived = buildDerivedLayerGeojsons(lorFeatures, output);
	const derivedDir = `${STATIC}/kiez-scores/layers`;
	await mkdir(derivedDir, { recursive: true });
	for (const [slug, fc] of Object.entries(derived)) {
		const path = join(derivedDir, `${slug}.geojson`);
		await writeFile(path, JSON.stringify(fc));
		console.log(`[kiez-scores] wrote ${path}: ${fc.features.length} features`);
	}

	await augmentManifestWithKiezScoreLayers(manifest, derived, output.generatedAt);

	return { outPath: OUT, scoreCount: count };
}

async function augmentManifestWithKiezScoreLayers(
	manifest: Manifest,
	derived: Record<string, FeatureCollection>,
	generatedAt: string
): Promise<void> {
	const newEntries: LayerEntry[] = [];
	for (const [slug, fc] of Object.entries(derived)) {
		const json = JSON.stringify(fc);
		const buf = Buffer.from(json, 'utf-8');
		const sha = createHash('sha256').update(buf).digest('hex');
		const filename = `${slug}.${sha.slice(0, 8)}.geojson`;
		const target = join(LAYERS_DIR, filename);
		await purgeOldHashes(slug);
		await writeFile(target, buf);
		newEntries.push({
			slug,
			filename,
			sourceUrl: `https://navigator.berlin/derived/${slug}`,
			fetchedAt: generatedAt,
			sourceUpdatedAt: generatedAt,
			license: 'dl-de/zero-2-0',
			sha256: sha,
			bundleGroup: 'G: Kiez-Score',
			zoomThresholds: { min: 9, max: 18 },
			geometryType: 'MultiPolygon',
			featureCount: fc.features.length,
			inspectorRelevant: false,
			mapRelevant: true
		});
	}
	const keptSlugs = new Set(newEntries.map((e) => e.slug));
	const merged: LayerEntry[] = [
		...manifest.layers.filter((l) => !keptSlugs.has(l.slug)),
		...newEntries
	];
	const nextManifest: Manifest = {
		schemaVersion: 1,
		generatedAt: manifest.generatedAt,
		layers: merged
	};
	await writeFile(`${LAYERS_DIR}/MANIFEST.json`, JSON.stringify(nextManifest, null, 2));
	console.log(
		`[kiez-scores] augmented MANIFEST.json with ${newEntries.length} kiez-score layers`
	);
}

async function purgeOldHashes(slug: string): Promise<void> {
	const files = await readdir(LAYERS_DIR).catch(() => []);
	const prefix = `${slug}.`;
	for (const f of files) {
		if (f.startsWith(prefix) && f.endsWith('.geojson')) {
			await unlink(join(LAYERS_DIR, f)).catch(() => {});
		}
	}
}

if (import.meta.url === `file://${process.argv[1]}`) {
	buildKiezScores().catch((err) => {
		console.error('[kiez-scores] FAILED:', err);
		process.exit(1);
	});
}
