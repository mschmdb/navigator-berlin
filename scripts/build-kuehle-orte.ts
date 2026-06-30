import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { mergeKuehleOrte, type EnrichmentItem, type PlaceItem } from './lib/kuehle-orte/merge.js';

/**
 * Story 15.1: Baut das gemergte Kühle-Orte-GeoJSON als Build-Input (kein Client-Layer).
 * Liest die committeten Daten, filtert ungeeignete/tote Orte mit Logging je Grund,
 * hängt Navi-Deep-Links an und schreibt static/data/kuehle-orte.geojson. Vorbild:
 * scripts/build-klima-pet-points.ts. Pipeline-Integration (kind:'local', MANIFEST) folgt in 15.2.
 */
const IN_DIR = 'static/data/kuehle-orte';
const ENRICHMENT_FILE = join(IN_DIR, 'enrichment.json');
const PLACES_FILE = join(IN_DIR, 'places-osm.json');
const OUT_DIR = 'static/data';
const OUT_FILE = join(OUT_DIR, 'kuehle-orte.geojson');

async function readJson<T>(path: string): Promise<T> {
	return JSON.parse(await readFile(path, 'utf-8')) as T;
}

async function main(): Promise<void> {
	const enrichment = await readJson<EnrichmentItem[]>(ENRICHMENT_FILE);
	const places = await readJson<PlaceItem[]>(PLACES_FILE);

	const { collection, dropped } = mergeKuehleOrte(enrichment, places);

	await mkdir(OUT_DIR, { recursive: true });
	await writeFile(OUT_FILE, JSON.stringify(collection));

	const kept = collection.features.length;
	const droppedTotal = dropped.suitableFalse + dropped.stillExistsNo + dropped.missingGeometry;
	console.log(
		`[kuehle-orte] ${kept} Orte behalten, ${droppedTotal} weggefallen ` +
			`(ungeeignet: ${dropped.suitableFalse}, existiert nicht mehr: ${dropped.stillExistsNo}, ` +
			`ohne Geometrie: ${dropped.missingGeometry}). Geschrieben nach ${OUT_FILE}`
	);
}

if (import.meta.url === `file://${process.argv[1]}`) {
	main().catch((err) => {
		console.error(err);
		process.exit(1);
	});
}
