import { readFile, writeFile, mkdir, unlink, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fetchSbbGeoZip, extractShapefilePack } from './wahlen/lib/sbb-geo-fetcher.js';
import { shapefileToGeoJSON } from './wahlen/lib/sbb-geo-pipeline.js';
import { GEO_SOURCES, type GeoSource } from './wahlen/lib/sbb-geo-sources.js';
import { hashedFilename, sha256Hex } from './lib/hash.js';
import { ManifestSchema, validateManifest } from './lib/manifest.js';
import type { LayerEntry, Manifest } from './lib/types.js';

const LAYERS_DIR = join(process.cwd(), 'static', 'layers');
const MANIFEST_PATH = join(LAYERS_DIR, 'MANIFEST.json');

function manifestSlugFor(source: GeoSource): string {
	return `wahlbezirke-${source.slug}`;
}

async function buildOne(source: GeoSource): Promise<LayerEntry> {
	const t0 = Date.now();
	const tag = `[build-wahl-geo] ${source.slug}`;
	console.log(`${tag} fetch ${source.download}`);
	const zip = await fetchSbbGeoZip(source.download);
	console.log(`${tag} zip bytes=${zip.byteLength}`);

	const pack = extractShapefilePack(zip);
	console.log(`${tag} shapefile baseName=${pack.baseName}`);

	const geojsonStr = await shapefileToGeoJSON(pack);
	const content = Buffer.from(geojsonStr, 'utf-8');

	const slug = manifestSlugFor(source);
	const filename = hashedFilename(slug, content, 'geojson');
	const outPath = join(LAYERS_DIR, filename);
	await mkdir(LAYERS_DIR, { recursive: true });

	const existing = (await readdir(LAYERS_DIR)).filter(
		(f) => f.startsWith(`${slug}.`) && f.endsWith('.geojson')
	);
	for (const old of existing) {
		if (old !== filename) {
			await unlink(join(LAYERS_DIR, old));
			console.log(`${tag} removed stale ${old}`);
		}
	}

	await writeFile(outPath, content);
	console.log(`${tag} wrote ${filename} bytes=${content.byteLength}`);

	const fc = JSON.parse(geojsonStr) as { features?: unknown[] };
	const featureCount = fc.features?.length ?? 0;

	const entry: LayerEntry = {
		slug,
		filename,
		sourceUrl: source.live,
		fetchedAt: new Date().toISOString(),
		license: 'dl-de/by-2-0',
		sha256: sha256Hex(content),
		bundleGroup: 'H: Wahldaten',
		zoomThresholds: { min: 13, max: 17 },
		geometryType: 'Polygon',
		featureCount,
		inspectorRelevant: true,
		mapRelevant: false
	};

	const dt = ((Date.now() - t0) / 1000).toFixed(1);
	console.log(`${tag} done in ${dt}s features=${featureCount}`);
	return entry;
}

async function loadManifest(): Promise<Manifest> {
	if (!existsSync(MANIFEST_PATH)) {
		return { schemaVersion: 1, generatedAt: new Date().toISOString(), layers: [] };
	}
	const raw = await readFile(MANIFEST_PATH, 'utf-8');
	return ManifestSchema.parse(JSON.parse(raw));
}

async function saveManifest(m: Manifest): Promise<void> {
	validateManifest(m);
	await writeFile(MANIFEST_PATH, JSON.stringify(m, null, 2) + '\n');
}

function upsertLayer(manifest: Manifest, entry: LayerEntry): Manifest {
	const layers = manifest.layers.filter((l) => l.slug !== entry.slug);
	layers.push(entry);
	return {
		schemaVersion: 1,
		generatedAt: new Date().toISOString(),
		layers
	};
}

function parseArgs(argv: readonly string[]): { only?: string } {
	for (const arg of argv) {
		if (arg.startsWith('--only=')) return { only: arg.slice('--only='.length) };
	}
	return {};
}

async function main(): Promise<void> {
	const args = parseArgs(process.argv.slice(2));
	const targets = args.only ? GEO_SOURCES.filter((g) => g.slug === args.only) : GEO_SOURCES;

	if (targets.length === 0) {
		console.error(
			`No geo matches --only=${args.only}. Known: ${GEO_SOURCES.map((g) => g.slug).join(', ')}`
		);
		process.exit(2);
	}

	let manifest = await loadManifest();
	for (const source of targets) {
		const entry = await buildOne(source);
		manifest = upsertLayer(manifest, entry);
	}
	await saveManifest(manifest);
	console.log(`[build-wahl-geo] manifest updated: ${MANIFEST_PATH}`);
}

main().catch((err) => {
	console.error(err);
	process.exitCode = 1;
});
