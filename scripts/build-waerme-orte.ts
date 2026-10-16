import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { isMainEntry } from './lib/is-main-entry.js';
import { validateEnrichmentSet } from './lib/waerme-orte/enrichment.js';
import { mergeWaermeOrte } from './lib/waerme-orte/merge.js';
import type { OsmSnapshot, WaermeEnrichment } from './lib/waerme-orte/types.js';

/**
 * Wärme-Orte (#61): baut static/data/waerme-orte.geojson aus dem committeten OSM-Snapshot
 * und der Winter-Anreicherung. Kein Layer, kein MANIFEST-Eintrag (folgt in #62).
 * `--strict` lässt den Build scheitern, wenn Kandidaten ohne Enrichment bleiben.
 */
const IN_DIR = 'static/data/waerme-orte';
const ENRICHMENT_FILE = join(IN_DIR, 'enrichment.json');
const PLACES_FILE = join(IN_DIR, 'places-osm.json');
const OUT_DIR = 'static/data';
const OUT_FILE = join(OUT_DIR, 'waerme-orte.geojson');

async function readJson<T>(path: string): Promise<T> {
	return JSON.parse(await readFile(path, 'utf-8')) as T;
}

async function main(): Promise<void> {
	const strict = process.argv.includes('--strict');
	const enrichment = await readJson<WaermeEnrichment[]>(ENRICHMENT_FILE);
	const snapshot = await readJson<OsmSnapshot>(PLACES_FILE);

	const validationErrors = validateEnrichmentSet(enrichment);
	if (validationErrors.length > 0) {
		for (const error of validationErrors) console.error(`[waerme-orte] ${error}`);
		console.error(
			`[waerme-orte] ${validationErrors.length} Validierungsfehler, nichts geschrieben`
		);
		process.exit(1);
	}

	const { collection, dropped, missingEnrichment } = mergeWaermeOrte(enrichment, snapshot.places);

	if (strict && missingEnrichment.length > 0) {
		console.error(
			`[waerme-orte] --strict: ${missingEnrichment.length} Kandidaten ohne Enrichment, nichts geschrieben`
		);
		process.exit(1);
	}

	await mkdir(OUT_DIR, { recursive: true });
	await writeFile(OUT_FILE, JSON.stringify(collection));

	const osmFiltered = Object.entries(dropped.osmFiltered)
		.map(([reason, count]) => `${reason}: ${count}`)
		.join(', ');
	console.log(
		`[waerme-orte] ${collection.features.length} Orte behalten. ` +
			`OSM-Filter (${osmFiltered || 'keine'}), ` +
			`ungeeignet: ${dropped.suitableFalse}, existiert nicht mehr: ${dropped.stillExistsNo}, ` +
			`ohne Geometrie: ${dropped.missingGeometry}, Dubletten: ${dropped.duplicates}. Geschrieben nach ${OUT_FILE}`
	);
	if (missingEnrichment.length > 0) {
		console.warn(
			`[waerme-orte] ${missingEnrichment.length} Kandidaten ohne Enrichment (nicht im GeoJSON)`
		);
	}
}

if (isMainEntry(import.meta.url, process.argv[1])) {
	main().catch((err) => {
		console.error(err);
		process.exit(1);
	});
}
