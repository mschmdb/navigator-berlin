import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
	BERLIN_LAND_CODE,
	filterByLand,
	parseBwlWbzCsv
} from './lib/bwl-csv-parser.js';
import { extractBwlWbzCsv, fetchBwlZip } from './lib/bwl-fetcher.js';
import { WAHL_SOURCES, type WahlSource } from './lib/sources.js';

const SPIKE_OUT_DIR = join(process.cwd(), '_bmad-output', 'spike-artifacts');

type Snapshot = {
	source: {
		slug: string;
		jahr: number;
		wahl: string;
		url: string;
		license: string;
		licenseShort: string;
		fetchedAt: string;
	};
	format: {
		container: 'zip';
		csvEntryPattern: string;
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
		wahlkreiseBerlin: string[];
		wahlkreiseCount: number;
	};
	asserts: {
		berlinRowsAroundExpected: boolean;
		wahlkreiseCountIs12: boolean;
		noNullWahlbezirk: boolean;
	};
	sampleBerlinRow: Record<string, string>;
};

function inferCsvEntryPattern(slug: string): string {
	return `${slug}_wbz_ergebnisse.csv`;
}

function indexOfHeaderLine(csv: string): number {
	const stripped = csv.replace(/^﻿/, '');
	const lines = stripped.split(/\r?\n/);
	return lines.findIndex((l) => /^Wahlkreis;\s*Land\s*;/i.test(l));
}

export async function runSpike(source: WahlSource): Promise<Snapshot> {
	const tag = `[spike-${source.slug}]`;
	console.log(`${tag} fetch ${source.url}`);
	const zip = await fetchBwlZip(source.url);
	console.log(`${tag} zip bytes=${zip.byteLength}`);

	const csv = extractBwlWbzCsv(zip);
	console.log(`${tag} csv bytes=${csv.length}`);

	const parsed = parseBwlWbzCsv(csv);
	console.log(`${tag} headers=${parsed.headers.length} rows=${parsed.rows.length}`);

	const berlin = filterByLand(parsed.rows, BERLIN_LAND_CODE);
	console.log(`${tag} berlin rows=${berlin.length}`);

	const wahlkreiseFound = Array.from(new Set(berlin.map((r) => r.Wahlkreis))).sort();
	const wahlkreiseCount = wahlkreiseFound.length;
	const wahlkreiseCountIs12 = wahlkreiseCount === 12;
	const noNullWahlbezirk = berlin.every((r) => r.Wahlbezirk && r.Wahlbezirk.length > 0);
	const berlinAroundExpected = berlin.length >= 1500 && berlin.length <= 4000;

	const snapshot: Snapshot = {
		source: {
			slug: source.slug,
			jahr: source.jahr,
			wahl: source.wahl,
			url: source.url,
			license: source.license,
			licenseShort: source.licenseShort,
			fetchedAt: new Date().toISOString()
		},
		format: {
			container: 'zip',
			csvEntryPattern: inferCsvEntryPattern(source.slug),
			encoding: 'utf-8-sig',
			delimiter: ';',
			lineTerminator: 'CRLF'
		},
		header: {
			metadataLineCount: parsed.meta.metadataLineCount,
			headerLineIndex: indexOfHeaderLine(csv),
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
			wahlkreiseBerlin: wahlkreiseFound,
			wahlkreiseCount
		},
		asserts: {
			berlinRowsAroundExpected: berlinAroundExpected,
			wahlkreiseCountIs12,
			noNullWahlbezirk
		},
		sampleBerlinRow: berlin[0] ?? {}
	};

	const allPass =
		snapshot.asserts.berlinRowsAroundExpected &&
		snapshot.asserts.wahlkreiseCountIs12 &&
		snapshot.asserts.noNullWahlbezirk;

	await mkdir(SPIKE_OUT_DIR, { recursive: true });
	const outFile = join(SPIKE_OUT_DIR, `wahl-schema-snapshot-${source.slug}.json`);
	await writeFile(outFile, JSON.stringify(snapshot, null, 2) + '\n', 'utf-8');
	console.log(`${tag} snapshot: ${outFile}`);
	console.log(`${tag} asserts: ${allPass ? 'PASS' : 'FAIL'}`);
	console.log(`  berlinRowsAroundExpected: ${snapshot.asserts.berlinRowsAroundExpected}`);
	console.log(`  wahlkreiseCountIs12: ${snapshot.asserts.wahlkreiseCountIs12} (found ${wahlkreiseCount})`);
	console.log(`  noNullWahlbezirk: ${snapshot.asserts.noNullWahlbezirk}`);

	return snapshot;
}

async function main(): Promise<void> {
	const onlySlug = process.argv.find((a) => a.startsWith('--only='))?.slice('--only='.length);
	const targets = onlySlug
		? WAHL_SOURCES.filter((s) => s.slug === onlySlug)
		: WAHL_SOURCES;

	if (targets.length === 0) {
		console.error(`No wahl matches --only=${onlySlug}. Known: ${WAHL_SOURCES.map((s) => s.slug).join(', ')}`);
		process.exit(2);
	}

	let anyFail = false;
	for (const source of targets) {
		const snap = await runSpike(source);
		if (
			!snap.asserts.berlinRowsAroundExpected ||
			!snap.asserts.wahlkreiseCountIs12 ||
			!snap.asserts.noNullWahlbezirk
		) {
			anyFail = true;
		}
	}

	if (anyFail) process.exitCode = 1;
}

main().catch((err) => {
	console.error(err);
	process.exitCode = 1;
});
