import 'dotenv/config';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { closeDb, getDb } from '../src/lib/server/db/index.js';
import {
	BERLIN_LAND_CODE,
	filterByLand,
	parseBwlWbzCsv
} from './wahlen/lib/bwl-csv-parser.js';
import { extractBwlCsvs, fetchBwlZip } from './wahlen/lib/bwl-fetcher.js';
import {
	extractSheet,
	fetchSbbXlsx,
	loadWorkbook,
	rowToObject
} from './wahlen/lib/sbb-xlsx-fetcher.js';
import { transformSbbRow } from './wahlen/lib/sbb-row-transformer.js';
import { BWL_BTW25_WBZ, WAHL_SOURCES, type WahlSource } from './wahlen/lib/sources.js';
import {
	transformBwlRow,
	transformBwlSplitRow,
	type StimmtypKey
} from './wahlen/lib/row-transformer.js';
import {
	buildAggregates,
	clearWahlData,
	insertErgebnisse,
	insertStimmbezirke,
	seedParteienAndAliases,
	upsertWahl
} from './wahlen/lib/db-loader.js';
import { diffHeaders, isDrift, formatDriftReport } from './wahlen/lib/schema-validator.js';

const SPIKE_DIR = join(process.cwd(), '_bmad-output', 'spike-artifacts');

type Args = {
	only?: string;
	skipDriftCheck: boolean;
};

function parseArgs(argv: readonly string[]): Args {
	let only: string | undefined;
	let skipDriftCheck = false;
	for (const arg of argv) {
		if (arg.startsWith('--only=')) only = arg.slice('--only='.length);
		else if (arg === '--skip-drift-check') skipDriftCheck = true;
	}
	return { only, skipDriftCheck };
}

async function loadSnapshotHeadersForSlug(slug: string): Promise<string[] | null> {
	const path = join(SPIKE_DIR, `wahl-schema-snapshot-${slug}.json`);
	if (!existsSync(path)) return null;
	const text = await readFile(path, 'utf-8');
	const snap = JSON.parse(text) as { header?: { columns?: string[] } };
	return snap.header?.columns ?? null;
}

async function processCombined(
	source: WahlSource,
	csv: string,
	args: Args
): Promise<{ transformed: ReturnType<typeof transformBwlRow>[]; }> {
	const parsed = parseBwlWbzCsv(csv);
	console.log(
		`[aggregate-wahl] ${source.slug} parsed: headers=${parsed.headers.length} rows=${parsed.rows.length}`
	);

	if (!args.skipDriftCheck) {
		const snapshotHeaders = await loadSnapshotHeadersForSlug(source.slug);
		if (snapshotHeaders) {
			const diff = diffHeaders(snapshotHeaders, parsed.headers);
			if (isDrift(diff)) {
				throw new Error(
					`[aggregate-wahl] ${source.slug} schema drift detected:\n${formatDriftReport(diff)}`
				);
			}
		} else {
			console.log(
				`[aggregate-wahl] ${source.slug} no snapshot found, skipping drift check (run scripts/wahlen/spike-fetch.ts first)`
			);
		}
	}

	const berlin = filterByLand(parsed.rows, BERLIN_LAND_CODE);
	console.log(`[aggregate-wahl] ${source.slug} berlin rows=${berlin.length}`);
	return { transformed: berlin.map((r) => transformBwlRow(r, parsed.headers)) };
}

function processSplitOne(
	source: WahlSource,
	csv: string,
	stimmtyp: StimmtypKey
): ReturnType<typeof transformBwlSplitRow>[] {
	const parsed = parseBwlWbzCsv(csv);
	console.log(
		`[aggregate-wahl] ${source.slug}/${stimmtyp} parsed: headers=${parsed.headers.length} rows=${parsed.rows.length}`
	);
	const berlin = filterByLand(parsed.rows, BERLIN_LAND_CODE);
	console.log(`[aggregate-wahl] ${source.slug}/${stimmtyp} berlin rows=${berlin.length}`);
	return berlin.map((r) => transformBwlSplitRow(r, parsed.headers, stimmtyp));
}

async function processOneWahl(source: WahlSource, args: Args): Promise<void> {
	const t0 = Date.now();
	const db = getDb();
	const parteiIdByKurzname = await seedParteienAndAliases(db);

	if (source.kind === 'sbb-xlsx') {
		await processSbbXlsx(source, parteiIdByKurzname);
		const dt = ((Date.now() - t0) / 1000).toFixed(1);
		console.log(`[aggregate-wahl] ${source.slug} done in ${dt}s`);
		return;
	}

	console.log(`[aggregate-wahl] ${source.slug} fetch ${source.url}`);
	const zip = await fetchBwlZip(source.url);
	const extracted = extractBwlCsvs(zip);
	console.log(`[aggregate-wahl] ${source.slug} mode=${extracted.mode}`);
	console.log(`[aggregate-wahl] seeded ${parteiIdByKurzname.size} Parteien`);

	const stimmtypen: StimmtypKey[] = ['erststimme', 'zweitstimme'];

	if (extracted.mode === 'combined') {
		const { transformed } = await processCombined(source, extracted.csv, args);
		const briefwahl = transformed.filter((t) => t.istBriefwahl).length;
		console.log(
			`[aggregate-wahl] ${source.slug} brief=${briefwahl} urne=${transformed.length - briefwahl}`
		);
		for (const stimmtyp of stimmtypen) {
			const wahlId = await upsertWahl(db, {
				jahr: source.jahr,
				typ: source.wahl,
				stimmtyp,
				sourceUrl: source.url,
				license: source.licenseShort
			});
			await clearWahlData(db, wahlId);
			const sbCount = await insertStimmbezirke(db, wahlId, transformed);
			const erCount = await insertErgebnisse(
				db,
				wahlId,
				transformed,
				stimmtyp,
				parteiIdByKurzname
			);
			const counts = await buildAggregates(db, wahlId);
			console.log(
				`[aggregate-wahl] ${source.slug}/${stimmtyp} wahlId=${wahlId} stimmbezirke=${sbCount} ergebnis=${erCount} agg=berlin:${counts.berlin}/bezirk:${counts.bezirk}`
			);
		}
	} else {
		const pairs: { stimmtyp: StimmtypKey; csv: string }[] = [
			{ stimmtyp: 'erststimme', csv: extracted.erst },
			{ stimmtyp: 'zweitstimme', csv: extracted.zweit }
		];
		for (const { stimmtyp, csv } of pairs) {
			const transformed = processSplitOne(source, csv, stimmtyp);
			const briefwahl = transformed.filter((t) => t.istBriefwahl).length;
			console.log(
				`[aggregate-wahl] ${source.slug}/${stimmtyp} brief=${briefwahl} urne=${transformed.length - briefwahl}`
			);
			const wahlId = await upsertWahl(db, {
				jahr: source.jahr,
				typ: source.wahl,
				stimmtyp,
				sourceUrl: source.url,
				license: source.licenseShort
			});
			await clearWahlData(db, wahlId);
			const sbCount = await insertStimmbezirke(db, wahlId, transformed);
			const erCount = await insertErgebnisse(
				db,
				wahlId,
				transformed,
				stimmtyp,
				parteiIdByKurzname
			);
			const counts = await buildAggregates(db, wahlId);
			console.log(
				`[aggregate-wahl] ${source.slug}/${stimmtyp} wahlId=${wahlId} stimmbezirke=${sbCount} ergebnis=${erCount} agg=berlin:${counts.berlin}/bezirk:${counts.bezirk}`
			);
		}
	}

	const dt = ((Date.now() - t0) / 1000).toFixed(1);
	console.log(`[aggregate-wahl] ${source.slug} done in ${dt}s`);
}

async function main(): Promise<void> {
	const args = parseArgs(process.argv.slice(2));
	const targets = args.only
		? WAHL_SOURCES.filter((s) => s.slug === args.only)
		: WAHL_SOURCES;

	if (targets.length === 0) {
		console.error(
			`No wahl matches --only=${args.only}. Known: ${WAHL_SOURCES.map((s) => s.slug).join(', ')}`
		);
		process.exit(2);
	}

	try {
		for (const source of targets) {
			await processOneWahl(source, args);
		}
	} finally {
		await closeDb();
	}
}

async function processSbbXlsx(
	source: WahlSource,
	parteiIdByKurzname: Awaited<ReturnType<typeof seedParteienAndAliases>>
): Promise<void> {
	const db = getDb();
	console.log(`[aggregate-wahl] ${source.slug} fetch ${source.url}`);
	const xlsxBuf = await fetchSbbXlsx(source.url);
	const wb = loadWorkbook(xlsxBuf);
	console.log(`[aggregate-wahl] ${source.slug} sheets=${wb.SheetNames.length}`);

	const parentWahlId: number | undefined = source.parentSlug
		? await lookupParentWahlId(source.parentSlug, source.wahl)
		: undefined;

	const pairs: { stimmtyp: StimmtypKey | 'einstimme'; sheet?: string }[] = [];
	if (source.sheetErst) pairs.push({ stimmtyp: 'erststimme', sheet: source.sheetErst });
	if (source.sheetZweit) pairs.push({ stimmtyp: 'zweitstimme', sheet: source.sheetZweit });
	if (source.sheetEin) pairs.push({ stimmtyp: 'einstimme', sheet: source.sheetEin });

	for (const { stimmtyp, sheet } of pairs) {
		if (!sheet) continue;
		const data = extractSheet(wb, sheet);
		console.log(
			`[aggregate-wahl] ${source.slug}/${stimmtyp} sheet=${sheet} rows=${data.rows.length} cols=${data.headers.length}`
		);
		const transformed = data.rows
			.map((r) => rowToObject(r, data.headers))
			.filter((r) => r.Bezirksnummer && /^[0-9]{1,2}$/.test(r.Bezirksnummer))
			.map((r) => transformSbbRow(r, data.headers, stimmtyp));

		const briefwahl = transformed.filter((t) => t.istBriefwahl).length;
		console.log(
			`[aggregate-wahl] ${source.slug}/${stimmtyp} brief=${briefwahl} urne=${transformed.length - briefwahl}`
		);

		const wahlId = await upsertWahl(db, {
			jahr: source.jahr,
			typ: source.wahl,
			stimmtyp,
			sourceUrl: source.url,
			license: source.licenseShort,
			isRepeatElection: source.isRepeatElection,
			parentElectionId: parentWahlId
		});
		await clearWahlData(db, wahlId);
		const sbCount = await insertStimmbezirke(db, wahlId, transformed);
		const erCount = await insertErgebnisse(
			db,
			wahlId,
			transformed,
			stimmtyp,
			parteiIdByKurzname
		);
		const counts = await buildAggregates(db, wahlId);
		console.log(
			`[aggregate-wahl] ${source.slug}/${stimmtyp} wahlId=${wahlId} stimmbezirke=${sbCount} ergebnis=${erCount} agg=berlin:${counts.berlin}/bezirk:${counts.bezirk}`
		);
	}
}

import { eq, and } from 'drizzle-orm';
import { wahl as wahlTable } from '../src/lib/server/db/schema/index.js';

async function lookupParentWahlId(
	parentSlug: string,
	typ: 'btw' | 'agh' | 'bvv'
): Promise<number | undefined> {
	const m = parentSlug.match(/^(btw|agh|bvv)(\d{2})$/);
	if (!m) return undefined;
	const jahr = 2000 + Number.parseInt(m[2], 10);
	const rows = await getDb()
		.select({ id: wahlTable.id })
		.from(wahlTable)
		.where(and(eq(wahlTable.jahr, jahr), eq(wahlTable.typ, typ)))
		.limit(1);
	return rows[0]?.id;
}

main().catch((err) => {
	console.error(err);
	process.exitCode = 1;
});

export { processOneWahl, parseArgs, BWL_BTW25_WBZ };
