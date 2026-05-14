import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { FeatureCollection } from 'geojson';
import { buildOepnvStopIndex, type OepnvStopIndex, type Modus } from './lib/oepnv-stop-index.js';

const LAYERS_DIR = 'static/layers';
const MANIFEST_PATH = join(LAYERS_DIR, 'MANIFEST.json');
const OUT_PATH = 'static/oepnv-stops-index.json';

const SLUG_BY_MODUS: Record<Modus, string> = {
	ubahn: 'ubahn-stationen',
	sbahn: 'sbahn-stationen',
	tram: 'tram-haltestellen',
	bus: 'bus-haltestellen'
};

interface ManifestEntry {
	slug: string;
	filename: string;
}
interface Manifest {
	layers: ManifestEntry[];
}

async function loadFeatureCollection(slug: string, manifest: Manifest): Promise<FeatureCollection> {
	const entry = manifest.layers.find((l) => l.slug === slug);
	if (!entry) throw new Error(`Slug not in MANIFEST: ${slug}`);
	const raw = await readFile(join(LAYERS_DIR, entry.filename), 'utf-8');
	return JSON.parse(raw) as FeatureCollection;
}

async function main(): Promise<void> {
	const manifest = JSON.parse(await readFile(MANIFEST_PATH, 'utf-8')) as Manifest;
	const [ubahn, sbahn, tram, bus] = await Promise.all([
		loadFeatureCollection(SLUG_BY_MODUS.ubahn, manifest),
		loadFeatureCollection(SLUG_BY_MODUS.sbahn, manifest),
		loadFeatureCollection(SLUG_BY_MODUS.tram, manifest),
		loadFeatureCollection(SLUG_BY_MODUS.bus, manifest)
	]);
	const index: OepnvStopIndex = buildOepnvStopIndex({ ubahn, sbahn, tram, bus });
	await writeFile(OUT_PATH, JSON.stringify(index));
	console.log(
		`[oepnv-index] wrote ${OUT_PATH}: ubahn=${index.ubahn.length} sbahn=${index.sbahn.length} tram=${index.tram.length} bus=${index.bus.length}`
	);
}

main().catch((err) => {
	console.error('[oepnv-index] FAILED:', err);
	process.exit(1);
});
