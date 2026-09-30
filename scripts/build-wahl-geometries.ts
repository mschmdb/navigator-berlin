import { readFile, writeFile, mkdir, unlink, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fetchSbbGeoZip, extractShapefilePack } from './wahlen/lib/sbb-geo-fetcher.js';
import { shapefileToGeoJSON, dissolveGruppen } from './wahlen/lib/sbb-geo-pipeline.js';
import { GEO_SOURCES, type GeoSource } from './wahlen/lib/sbb-geo-sources.js';
import { hashedFilename, sha256Hex } from './lib/hash.js';
import { ManifestSchema, validateManifest } from './lib/manifest.js';
import type { LayerEntry, Manifest } from './lib/types.js';

const LAYERS_DIR = join(process.cwd(), 'static', 'layers');
const MANIFEST_PATH = join(LAYERS_DIR, 'MANIFEST.json');

function manifestSlugFor(source: GeoSource): string {
	return `wahlbezirke-${source.slug}`;
}

/** Story 17: Slug der dissolvierten Briefwahl-Gruppen-Fläche je Geo-Slug. */
function gruppenSlugFor(source: GeoSource): string {
	return `wahlgruppen-${source.slug}`;
}

async function writeLayerFile(
	slug: string,
	content: Buffer,
	tag: string
): Promise<{ filename: string }> {
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
	return { filename };
}

/**
 * Geometrie-Typ aus dem tatsächlichen Feature-Inhalt ableiten statt hart
 * `'Polygon'` anzunehmen (Review-Fund): der Dissolve-Schritt
 * (`dissolveGruppen`) kann aus mehreren Polygon-Urnen eine zusammen-
 * hängende MultiPolygon-Gruppenfläche machen. Prüft ALLE Features (nicht
 * nur das erste), weil Dissolve-Output je Gruppe zwischen Polygon (eine
 * zusammenhängende Fläche) und MultiPolygon (getrennte Teilflächen)
 * wechseln kann.
 */
function detectGeometryType(content: Buffer): 'Polygon' | 'MultiPolygon' {
	try {
		const fc = JSON.parse(content.toString('utf-8')) as {
			features?: { geometry?: { type?: string } | null }[];
		};
		const hasMultiPolygon = (fc.features ?? []).some((f) => f.geometry?.type === 'MultiPolygon');
		return hasMultiPolygon ? 'MultiPolygon' : 'Polygon';
	} catch {
		return 'Polygon';
	}
}

function buildLayerEntry(params: {
	slug: string;
	filename: string;
	content: Buffer;
	featureCount: number;
	source: GeoSource;
}): LayerEntry {
	const { slug, filename, content, featureCount, source } = params;
	return {
		slug,
		filename,
		sourceUrl: source.live,
		fetchedAt: new Date().toISOString(),
		license: 'dl-de/by-2-0',
		sha256: sha256Hex(content),
		bundleGroup: 'H: Wahldaten',
		zoomThresholds: { min: 13, max: 17 },
		geometryType: detectGeometryType(content),
		featureCount,
		// Wahl-Geometrien sind kein generischer Inspector-Layer. wahl-section.svelte
		// konsumiert sie direkt via api/wahl/results-at-point. inspectorRelevant=false
		// hält sie aus getLayersAtPoint-Output (sonst rendern sie als generic Layer-Hit).
		inspectorRelevant: false,
		mapRelevant: false
	};
}

async function buildOne(source: GeoSource): Promise<LayerEntry[]> {
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
	const { filename } = await writeLayerFile(slug, content, tag);
	const fc = JSON.parse(geojsonStr) as { features?: unknown[] };
	const featureCount = fc.features?.length ?? 0;
	const urnenEntry = buildLayerEntry({ slug, filename, content, featureCount, source });

	// Story 17: dissolvierte Briefwahl-Gruppen-Fläche aus derselben (bereits
	// simplifizierten) Urnen-GeoJSON -- kein zweiter Shapefile-Fetch nötig.
	const gruppenSlug = gruppenSlugFor(source);
	const gruppenGeojsonStr = await dissolveGruppen(geojsonStr, source.slug);
	const gruppenContent = Buffer.from(gruppenGeojsonStr, 'utf-8');
	const { filename: gruppenFilename } = await writeLayerFile(gruppenSlug, gruppenContent, tag);
	const gruppenFc = JSON.parse(gruppenGeojsonStr) as { features?: unknown[] };
	const gruppenFeatureCount = gruppenFc.features?.length ?? 0;
	const gruppenEntry = buildLayerEntry({
		slug: gruppenSlug,
		filename: gruppenFilename,
		content: gruppenContent,
		featureCount: gruppenFeatureCount,
		source
	});

	const dt = ((Date.now() - t0) / 1000).toFixed(1);
	console.log(`${tag} done in ${dt}s features=${featureCount} gruppen=${gruppenFeatureCount}`);
	return [urnenEntry, gruppenEntry];
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
		const entries = await buildOne(source);
		for (const entry of entries) manifest = upsertLayer(manifest, entry);
	}
	await saveManifest(manifest);
	console.log(`[build-wahl-geo] manifest updated: ${MANIFEST_PATH}`);
}

main().catch((err) => {
	console.error(err);
	process.exitCode = 1;
});
