import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
	BERLIN_LAND_CODE,
	BERLIN_WAHLKREISE_BTW25,
	filterByLand,
	parseBwlWbzCsv
} from './lib/bwl-csv-parser.js';
import { extractBwlWbzCsv, fetchBwlZip } from './lib/bwl-fetcher.js';
import { BWL_BTW25_WBZ } from './lib/sources.js';

const SPIKE_OUT_DIR = join(process.cwd(), '_bmad-output', 'spike-artifacts');
const SPIKE_OUT_FILE = join(SPIKE_OUT_DIR, 'wahl-schema-snapshot-btw25.json');

type Snapshot = {
	source: {
		url: string;
		license: string;
		licenseShort: string;
		fetchedAt: string;
	};
	format: {
		container: 'zip';
		csvEntry: string;
		encoding: 'utf-8-sig';
		delimiter: ';';
		lineTerminator: 'CRLF';
	};
	header: {
		metadataLineCount: number;
		headerLineIndex: number;
		columnCount: number;
		columns: string[];
		copyrightLine: string;
		titleLine: string;
	};
	totals: {
		bytesZip: number;
		bytesCsv: number;
		totalRows: number;
		berlinRowCount: number;
		expectedBerlinRowCount: number;
		wahlkreiseBerlin: string[];
		expectedWahlkreiseBerlin: string[];
	};
	asserts: {
		berlinRowsAroundExpected: boolean;
		wahlkreiseBerlinAllPresent: boolean;
		noNullWahlbezirk: boolean;
	};
	sampleBerlinRow: Record<string, string>;
};

async function main(): Promise<void> {
	const fetchedAt = new Date().toISOString();
	console.log(`[spike-btw25] fetch ${BWL_BTW25_WBZ.url}`);
	const zip = await fetchBwlZip(BWL_BTW25_WBZ.url);
	console.log(`[spike-btw25] zip bytes=${zip.byteLength}`);

	const csv = extractBwlWbzCsv(zip);
	console.log(`[spike-btw25] csv bytes=${csv.length}`);

	const parsed = parseBwlWbzCsv(csv);
	console.log(`[spike-btw25] headers=${parsed.headers.length} rows=${parsed.rows.length}`);

	const berlin = filterByLand(parsed.rows, BERLIN_LAND_CODE);
	console.log(`[spike-btw25] berlin rows=${berlin.length}`);

	const wahlkreiseFound = Array.from(new Set(berlin.map((r) => r.Wahlkreis))).sort();
	const expectedWahlkreise = Array.from(BERLIN_WAHLKREISE_BTW25);

	const wahlkreiseAllPresent = expectedWahlkreise.every((w) => wahlkreiseFound.includes(w));
	const noNullWahlbezirk = berlin.every((r) => r.Wahlbezirk && r.Wahlbezirk.length > 0);
	const berlinAroundExpected = berlin.length >= 3500 && berlin.length <= 3700;

	const headerLineIndex = (() => {
		const stripped = csv.replace(/^﻿/, '');
		const lines = stripped.split(/\r?\n/);
		return lines.findIndex((l) => /^Wahlkreis;\s*Land\s*;/i.test(l));
	})();

	const snapshot: Snapshot = {
		source: {
			url: BWL_BTW25_WBZ.url,
			license: BWL_BTW25_WBZ.license,
			licenseShort: BWL_BTW25_WBZ.licenseShort,
			fetchedAt
		},
		format: {
			container: 'zip',
			csvEntry: 'btw25_wbz_ergebnisse.csv',
			encoding: 'utf-8-sig',
			delimiter: ';',
			lineTerminator: 'CRLF'
		},
		header: {
			metadataLineCount: parsed.meta.metadataLineCount,
			headerLineIndex,
			columnCount: parsed.headers.length,
			columns: parsed.headers,
			copyrightLine: parsed.meta.copyrightLine,
			titleLine: parsed.meta.titleLine
		},
		totals: {
			bytesZip: zip.byteLength,
			bytesCsv: csv.length,
			totalRows: parsed.rows.length,
			berlinRowCount: berlin.length,
			expectedBerlinRowCount: 3598,
			wahlkreiseBerlin: wahlkreiseFound,
			expectedWahlkreiseBerlin: expectedWahlkreise
		},
		asserts: {
			berlinRowsAroundExpected: berlinAroundExpected,
			wahlkreiseBerlinAllPresent: wahlkreiseAllPresent,
			noNullWahlbezirk
		},
		sampleBerlinRow: berlin[0] ?? {}
	};

	const allPass =
		snapshot.asserts.berlinRowsAroundExpected &&
		snapshot.asserts.wahlkreiseBerlinAllPresent &&
		snapshot.asserts.noNullWahlbezirk;

	await mkdir(SPIKE_OUT_DIR, { recursive: true });
	await writeFile(SPIKE_OUT_FILE, JSON.stringify(snapshot, null, 2) + '\n', 'utf-8');
	console.log(`[spike-btw25] snapshot written: ${SPIKE_OUT_FILE}`);
	console.log(`[spike-btw25] asserts: ${allPass ? 'PASS' : 'FAIL'}`);
	console.log(`  berlinRowsAroundExpected: ${snapshot.asserts.berlinRowsAroundExpected}`);
	console.log(`  wahlkreiseBerlinAllPresent: ${snapshot.asserts.wahlkreiseBerlinAllPresent}`);
	console.log(`  noNullWahlbezirk: ${snapshot.asserts.noNullWahlbezirk}`);

	if (!allPass) {
		process.exitCode = 1;
	}
}

main().catch((err) => {
	console.error(err);
	process.exitCode = 1;
});
