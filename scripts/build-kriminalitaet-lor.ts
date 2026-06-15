import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import type { FeatureCollection } from 'geojson';
import * as XLSX from 'xlsx';
import { assertAllowed } from './lib/allowlist.js';
import { defaultHeaders } from './lib/user-agent.js';
import { withRetry } from './lib/retry.js';
import { defaultLorIdFor } from './lib/kiez-score/pipeline.js';
import {
	DEFAULT_DELIKTE,
	latestThreeHzSheetNames,
	parseHzSheet,
	type SheetRow
} from './lib/kriminalitaet/parse-xlsx.js';
import { buildBrIndex, DEFAULT_DELIKT_WEIGHTS } from './lib/kriminalitaet/aggregate.js';
import { mirrorBrToPlr } from './lib/kriminalitaet/mirror.js';

/**
 * Story 14.0: Kriminalitätsatlas-Berlin als deterministisches Build-Aggregat.
 * Fetch der offenen XLSX (Polizei Berlin, dl-de-by-2.0) → HZ-Sheets der letzten
 * drei Jahre → 3-Jahres-Mittel der wohn-relevanten Delikte → kombinierter Index
 * je Bezirksregion → Spiegelung auf alle Planungsräume (BR-nativ, ADR-019).
 *
 * Ausgabe static/data/kriminalitaet-lor.json (Build-Input für die
 * Kriminalitäts-Dimension, Story 14.1/14.3). Kein Score-Effekt durch diese
 * Story (keine Verdrahtung in build-kiez-scores).
 */
const LAYERS_DIR = 'static/layers';
const OUT_DIR = 'static/data';
const OUT_FILE = join(OUT_DIR, 'kriminalitaet-lor.json');
const SOURCE_URL =
	'https://www.kriminalitaetsatlas.berlin.de/K-Atlas/bezirke/Fallzahlen%26HZ%202016-2025.xlsx';
const PUBLISHER = 'Polizei Berlin';
const LICENSE = 'dl-de-by-2.0';

async function fetchXlsx(url: string): Promise<Buffer> {
	assertAllowed(url);
	return withRetry(async () => {
		const res = await fetch(url, { headers: defaultHeaders() });
		if (!res.ok) throw new Error(`Kriminalitätsatlas XLSX HTTP ${res.status}`);
		return Buffer.from(await res.arrayBuffer());
	});
}

async function loadPlrIds(): Promise<string[]> {
	const manifest = JSON.parse(await readFile(join(LAYERS_DIR, 'MANIFEST.json'), 'utf-8')) as {
		layers: { slug: string; filename: string }[];
	};
	const entry = manifest.layers.find((l) => l.slug === 'lor-planungsraum');
	if (!entry) throw new Error('MANIFEST ohne lor-planungsraum');
	const fc = JSON.parse(
		await readFile(join(LAYERS_DIR, entry.filename), 'utf-8')
	) as FeatureCollection;
	const ids: string[] = [];
	for (const f of fc.features ?? []) {
		const id = defaultLorIdFor(f);
		if (id) ids.push(id);
	}
	return ids;
}

async function main(): Promise<void> {
	const xlsx = await fetchXlsx(SOURCE_URL);
	const sourceSha256 = createHash('sha256').update(xlsx).digest('hex');
	const wb = XLSX.read(xlsx, { type: 'buffer' });

	const sheetNames = latestThreeHzSheetNames(wb.SheetNames);
	const years = sheetNames.map((n) => Number(n.slice(3)));
	const rowsPerYear = sheetNames.map((name) => {
		const aoa = XLSX.utils.sheet_to_json<SheetRow>(wb.Sheets[name], {
			header: 1,
			raw: true,
			defval: null
		}) as SheetRow[];
		return parseHzSheet(aoa, DEFAULT_DELIKTE);
	});

	const brIndex = buildBrIndex(rowsPerYear, DEFAULT_DELIKTE, DEFAULT_DELIKT_WEIGHTS);
	const plrIds = await loadPlrIds();
	const records = mirrorBrToPlr(brIndex, plrIds);

	const mirrored = records.filter((r) => r.index !== null).length;

	await mkdir(OUT_DIR, { recursive: true });
	await writeFile(
		OUT_FILE,
		JSON.stringify(
			{
				schemaVersion: 1,
				generatedAt: new Date().toISOString(),
				source: 'Kriminalitätsatlas Berlin (Häufigkeitszahlen je Bezirksregion)',
				sourceUrl: SOURCE_URL,
				publisher: PUBLISHER,
				license: LICENSE,
				sourceSha256,
				metric:
					'Gewichteter HZ-Index (3-Jahres-Mittel) wohn-relevanter Delikte, je LOR-Planungsraum',
				years,
				delikte: DEFAULT_DELIKTE.map((d) => ({
					key: d.key,
					label: d.label,
					weight: DEFAULT_DELIKT_WEIGHTS[d.key] ?? 0
				})),
				note: 'BR-nativ (138/143 Bezirksregionen), auf Planungsräume gespiegelt (BZR_ID = PLR_ID[:6]). Polarität: höher = mehr erfasste Kriminalität, kein Sicherheitsmaß (ADR-019). City-Core-Verzerrung in Story 14.1/14.6.',
				brCount: brIndex.length,
				plrCount: records.length,
				plrMirrored: mirrored,
				records
			},
			null,
			2
		)
	);
	console.log(
		`[kriminalitaet] ${brIndex.length} BR → ${records.length} PLR (${mirrored} mit Index, Jahre ${years.join('/')}) → ${OUT_FILE}`
	);
}

if (import.meta.url === `file://${process.argv[1]}`) {
	main().catch((err) => {
		console.error(err);
		process.exit(1);
	});
}
