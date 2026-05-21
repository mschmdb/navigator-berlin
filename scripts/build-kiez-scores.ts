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
import { validateKiezScoreOutput } from './lib/kiez-score/output-schema.js';

interface EinwohnerRecord {
	plrId: string;
	kinder0bis6: number;
}

const STATIC = 'static';
const LAYERS_DIR = `${STATIC}/layers`;
const MANIFEST = `${LAYERS_DIR}/MANIFEST.json`;
const OEPNV_INDEX = `${STATIC}/oepnv-stops-index.json`;
const PET_POINTS = `${STATIC}/data/klima-pet-points.geojson`;
const EINWOHNER = `${STATIC}/data/einwohner-lor.json`;
const OUT = `${STATIC}/kiez-scores/kiez-scores.json`;

// ADR-015: MSS + Umweltgerechtigkeit sind keine Score-Inputs mehr. klima-pet (Grün & Hitze)
// + Milieuschutz (Wohnschutz, presence via Punkt-in-Polygon am LOR-Centroid) neu.
const POLYGON_SCORE_LAYERS = [
	'laerm-2023',
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

const POI_LAYERS = [
	'kitas-2024',
	'schulen-2024',
	'krankenhaeuser-plan',
	'spielplaetze',
	'gruenanlagen'
];

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
 * Story 10.1: pro LOR ein synthetischer `kitas-pro-kind`-Hit (Plätze pro Kind 0-6).
 * Σ e_platz der Kitas im LOR ÷ Kinder 0-6 aus dem Einwohner-Join (Story 10.0).
 */
async function buildKitaProKindHits(
	lorFeatures: readonly Feature[],
	poiLayers: readonly BuildLayerSpec[]
): Promise<Record<string, readonly LayerHitLike[]>> {
	const kitaFeatures = poiLayers.find((l) => l.slug === 'kitas-2024')?.features ?? [];
	const einwohner = await readJson<{ records: EinwohnerRecord[] }>(EINWOHNER).catch(() => null);
	if (!einwohner) throw new Error(`${EINWOHNER} fehlt. Lauf zuerst pnpm fetch:einwohner.`);
	const kinderByPlr = new Map(einwohner.records.map((r) => [r.plrId, r.kinder0bis6]));
	const plaetzeByLor = aggregateKitaPlaetzeByLor(lorFeatures, kitaFeatures, (f) => defaultLorIdFor(f) ?? '');

	const out: Record<string, readonly LayerHitLike[]> = {};
	for (const lor of lorFeatures) {
		const lorId = defaultLorIdFor(lor);
		if (!lorId) continue;
		const proKind = plaetzeProKind(plaetzeByLor[lorId] ?? 0, kinderByPlr.get(lorId) ?? null);
		if (proKind === null) continue;
		out[lorId] = [{ layer: 'kitas-pro-kind', value: { plaetzeProKind: proKind } }];
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

	const oepnvIndex = await readJson<OepnvStopIndexShape>(OEPNV_INDEX);

	// Story 10.1: Kita-Plätze pro Kind 0-6 pro LOR (Σ e_platz im LOR ÷ Kinder 0-6 aus 10.0).
	const perLorHits = await buildKitaProKindHits(lorFeatures, poiLayers);

	const pointValueLayers: BuildLayerSpec[] = [];
	for (const slug of POINT_VALUE_LAYERS) {
		const fc = await readJson<FeatureCollection>(PET_POINTS).catch(() => null);
		if (!fc) throw new Error(`${slug}: ${PET_POINTS} fehlt. Lauf zuerst pnpm data:pet-points.`);
		pointValueLayers.push({ slug, features: fc.features ?? [] });
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
