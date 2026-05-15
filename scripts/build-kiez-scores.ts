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
import type { OepnvStopIndexShape } from './lib/kiez-score/nearest-stops.js';
import { validateKiezScoreOutput } from './lib/kiez-score/output-schema.js';

const STATIC = 'static';
const LAYERS_DIR = `${STATIC}/layers`;
const MANIFEST = `${LAYERS_DIR}/MANIFEST.json`;
const OEPNV_INDEX = `${STATIC}/oepnv-stops-index.json`;
const OUT = `${STATIC}/kiez-scores/kiez-scores.json`;

const POLYGON_SCORE_LAYERS = [
	'laerm-2023',
	'luft-2023',
	'bioklima-2023',
	'gruenversorgung-2023',
	'klima-kaltlufteinwirkbereich-2022',
	'klima-leitbahnkorridor-2022',
	'umweltgerechtigkeit-2023',
	'mss-gesamtindex-2025'
];

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

	const output = buildKiezScoresFromInput(
		{
			lorFeatures,
			polygonLayers,
			presenceLayers: presenceLayersAvailable,
			poiLayers,
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
