import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { isMainEntry } from './lib/is-main-entry.js';
import { classifyPlace } from './lib/waerme-orte/filter.js';
import {
	buildResearchBatches,
	mergeEnrichmentResults,
	validateEnrichment,
	type CandidatePlace,
	type PriorKuehleEntry
} from './lib/waerme-orte/enrichment.js';
import type { OsmSnapshot, WaermeEnrichment } from './lib/waerme-orte/types.js';

/**
 * Wärme-Orte (#61): Hilfsskript für den Recherche-Lauf.
 *   batches [--size 25] [--out DIR]  schreibt Aufgaben-Batches für offene Kandidaten
 *   merge <result.json...>           validiert Ergebnis-Batches und führt sie in enrichment.json zusammen
 *   validate                         prüft die vorhandene enrichment.json
 * Ergebnis-Dateien enthalten ein JSON-Array von Enrichment-Einträgen (Schema: types.ts).
 */
const IN_DIR = 'static/data/waerme-orte';
const ENRICHMENT_FILE = join(IN_DIR, 'enrichment.json');
const PLACES_FILE = join(IN_DIR, 'places-osm.json');
const KUEHLE_ENRICHMENT_FILE = 'static/data/kuehle-orte/enrichment.json';
const DEFAULT_OUT = '/tmp/waerme-orte-batches';

async function readJson<T>(path: string): Promise<T> {
	return JSON.parse(await readFile(path, 'utf-8')) as T;
}

async function loadCandidates(): Promise<CandidatePlace[]> {
	const snapshot = await readJson<OsmSnapshot>(PLACES_FILE);
	const candidates: CandidatePlace[] = [];
	for (const place of snapshot.places) {
		const result = classifyPlace(place);
		if (result.candidate) candidates.push({ ...place, cat: result.cat });
	}
	return candidates;
}

async function loadEnrichment(): Promise<WaermeEnrichment[]> {
	return readJson<WaermeEnrichment[]>(ENRICHMENT_FILE);
}

async function loadPrior(): Promise<Record<string, PriorKuehleEntry>> {
	const kuehle = await readJson<Array<PriorKuehleEntry & { id: string }>>(KUEHLE_ENRICHMENT_FILE);
	return Object.fromEntries(
		kuehle.map((k) => [
			k.id,
			{
				is_free: k.is_free,
				website: k.website,
				address_verified: k.address_verified,
				still_exists: k.still_exists
			}
		])
	);
}

function optionValue(args: string[], name: string, fallback: string): string {
	const index = args.indexOf(name);
	return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
}

async function writeBatches(args: string[]): Promise<void> {
	const size = Number(optionValue(args, '--size', '25'));
	const outDir = optionValue(args, '--out', DEFAULT_OUT);
	const batches = buildResearchBatches(
		await loadCandidates(),
		await loadEnrichment(),
		await loadPrior(),
		size
	);
	await mkdir(outDir, { recursive: true });
	for (const batch of batches) {
		const name = `batch-${String(batch.batch).padStart(3, '0')}.json`;
		await writeFile(join(outDir, name), JSON.stringify(batch, null, '\t') + '\n');
	}
	console.log(`[waerme-orte-research] ${batches.length} Batches nach ${outDir}`);
}

async function mergeResults(files: string[]): Promise<void> {
	if (files.length === 0) throw new Error('Keine Ergebnis-Dateien angegeben');
	const results: WaermeEnrichment[] = [];
	for (const file of files) results.push(...(await readJson<WaermeEnrichment[]>(file)));
	const candidateIds = (await loadCandidates()).map((c) => c.id);
	const { merged, errors } = mergeEnrichmentResults(await loadEnrichment(), results, candidateIds);
	await writeFile(ENRICHMENT_FILE, JSON.stringify(merged, null, '\t') + '\n');
	console.log(`[waerme-orte-research] ${merged.length} Einträge in ${ENRICHMENT_FILE}`);
	if (errors.length > 0) {
		console.error(`${errors.length} Fehler, betroffene Einträge nicht übernommen:`);
		for (const error of errors) console.error(`  ${error}`);
		process.exit(1);
	}
}

async function validateAll(): Promise<void> {
	const enrichment = await loadEnrichment();
	const errors = enrichment.flatMap((e) => validateEnrichment(e).map((m) => `${e.id}: ${m}`));
	for (const error of errors) console.error(error);
	console.log(`[waerme-orte-research] ${enrichment.length} Einträge, ${errors.length} Fehler`);
	if (errors.length > 0) process.exit(1);
}

async function main(): Promise<void> {
	const [command, ...rest] = process.argv.slice(2);
	if (command === 'batches') return writeBatches(rest);
	if (command === 'merge') return mergeResults(rest);
	if (command === 'validate') return validateAll();
	throw new Error('Aufruf: waerme-orte-research.ts batches|merge|validate');
}

if (isMainEntry(import.meta.url, process.argv[1])) {
	main().catch((err) => {
		console.error(err);
		process.exit(1);
	});
}
