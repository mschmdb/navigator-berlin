import 'dotenv/config';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { closeDb, getDb } from '../src/lib/server/db/index.js';
import { BERLIN_LAND_CODE, filterByLand, parseBwlWbzCsv } from './wahlen/lib/bwl-csv-parser.js';
import { extractBwlCsvs, fetchBwlZip } from './wahlen/lib/bwl-fetcher.js';
import {
	extractSheet,
	fetchSbbXlsx,
	loadWorkbook,
	rowToObject
} from './wahlen/lib/sbb-xlsx-fetcher.js';
import { transformSbbRow } from './wahlen/lib/sbb-row-transformer.js';
import {
	decodeLegendCp1252,
	parseWbLegend,
	parseWbCsvData,
	buildWbCsvRows,
	assertRequiredColumns,
	assertNonEmpty,
	assertPartySumMatchesGueltig,
	computeSourceUpdatedAt,
	fetchWbCsvText,
	fetchWbLegendBuffer
} from './wahlen/lib/wb-csv-parser.js';
import { lookupParentWahlId } from './wahlen/lib/parent-lookup.js';
import {
	BWL_BTW25_WBZ,
	WAHL_SOURCES,
	type WahlSource,
	type WbCsvFiles
} from './wahlen/lib/sources.js';
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
	/** Kommagetrennte Slug-Liste, z.B. `--only=agh23,agh26,bvv26`. */
	only?: readonly string[];
	skipDriftCheck: boolean;
};

function parseArgs(argv: readonly string[]): Args {
	let only: string[] | undefined;
	let skipDriftCheck = false;
	for (const arg of argv) {
		if (arg.startsWith('--only=')) {
			only = arg
				.slice('--only='.length)
				.split(',')
				.map((s) => s.trim())
				.filter((s) => s.length > 0);
		} else if (arg === '--skip-drift-check') skipDriftCheck = true;
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
): Promise<{ transformed: ReturnType<typeof transformBwlRow>[] }> {
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

	if (source.kind === 'wb-csv') {
		await processWbCsv(source, parteiIdByKurzname);
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
			const erCount = await insertErgebnisse(db, wahlId, transformed, stimmtyp, parteiIdByKurzname);
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
			const erCount = await insertErgebnisse(db, wahlId, transformed, stimmtyp, parteiIdByKurzname);
			const counts = await buildAggregates(db, wahlId);
			console.log(
				`[aggregate-wahl] ${source.slug}/${stimmtyp} wahlId=${wahlId} stimmbezirke=${sbCount} ergebnis=${erCount} agg=berlin:${counts.berlin}/bezirk:${counts.bezirk}`
			);
		}
	}

	const dt = ((Date.now() - t0) / 1000).toFixed(1);
	console.log(`[aggregate-wahl] ${source.slug} done in ${dt}s`);
}

/**
 * Löst `--only` gegen `WAHL_SOURCES` auf. Pure (kein DB/Prozess-Zugriff),
 * damit „unbekannter Slug neben gültigen wird still übersprungen"
 * (Review-Fund 23.09.) ohne echten Ingest testbar ist: `unknown` listet
 * jeden Slug aus `only`, der in `sources` keinen Treffer hat -- auch wenn
 * ANDERE Slugs im selben `--only` gültig sind.
 */
export function resolveTargets(
	only: readonly string[] | undefined,
	sources: readonly WahlSource[] = WAHL_SOURCES
): { targets: WahlSource[]; unknown: string[] } {
	if (!only) return { targets: [...sources], unknown: [] };
	const known = new Set(sources.map((s) => s.slug));
	return {
		targets: sources.filter((s) => only.includes(s.slug)),
		unknown: only.filter((slug) => !known.has(slug))
	};
}

async function main(): Promise<void> {
	const args = parseArgs(process.argv.slice(2));
	const { targets, unknown } = resolveTargets(args.only);

	if (unknown.length > 0) {
		console.error(
			`Unknown wahl slug(s) in --only: ${unknown.join(', ')}. Known: ${WAHL_SOURCES.map((s) => s.slug).join(', ')}`
		);
		process.exit(2);
	}

	if (targets.length === 0) {
		console.error(
			`No wahl matches --only=${args.only?.join(',')}. Known: ${WAHL_SOURCES.map((s) => s.slug).join(', ')}`
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

		// Bugfix (Story: Ingest AGH/BVV 2026): pro Stimmtyp separat suchen,
		// nicht einmal pro Quelle -- sonst matcht LIMIT 1 nicht-deterministisch
		// die falsche Stimmtyp-Row der Eltern-Wahl (agh23 Zweitstimme zeigte
		// zuvor teils auf agh21 Erststimme).
		const parentWahlId: number | undefined = source.parentSlug
			? await lookupParentWahlId(db, source.parentSlug, source.wahl, stimmtyp)
			: undefined;

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
		const erCount = await insertErgebnisse(db, wahlId, transformed, stimmtyp, parteiIdByKurzname);
		const counts = await buildAggregates(db, wahlId);
		console.log(
			`[aggregate-wahl] ${source.slug}/${stimmtyp} wahlId=${wahlId} stimmbezirke=${sbCount} ergebnis=${erCount} agg=berlin:${counts.berlin}/bezirk:${counts.bezirk}`
		);
	}
}

async function processWbCsvOne(
	source: WahlSource,
	stimmtyp: StimmtypKey | 'einstimme',
	files: WbCsvFiles,
	parteiIdByKurzname: Awaited<ReturnType<typeof seedParteienAndAliases>>
): Promise<void> {
	const db = getDb();
	const tag = `[aggregate-wahl] ${source.slug}/${stimmtyp}`;
	console.log(`${tag} fetch data=${files.data}`);
	console.log(`${tag} fetch legend=${files.legend}`);

	const [dataText, legendBuf] = await Promise.all([
		fetchWbCsvText(files.data),
		fetchWbLegendBuffer(files.legend)
	]);

	const parsed = parseWbCsvData(dataText);
	console.log(`${tag} parsed rows=${parsed.rows.length} cols=${parsed.headers.length}`);
	// Pflichtspalten-Check VOR jeder Verarbeitung: ein gedroppter Header
	// (Format-Änderung bei wahlen-berlin.de) soll laut abbrechen statt Zeilen
	// still mit '' / 0 zu befüllen (Review-Fund 23.09.).
	assertRequiredColumns(parsed.headers, `${source.slug}/${stimmtyp}`);

	const legend = parseWbLegend(decodeLegendCp1252(legendBuf));
	const built = buildWbCsvRows(parsed, legend, `${source.slug}/${stimmtyp}`);
	assertPartySumMatchesGueltig(built.rows, built.partyNames, `${source.slug}/${stimmtyp}`);

	const sourceUpdatedAt = computeSourceUpdatedAt(parsed.rows) ?? undefined;

	const transformed = built.rows
		.filter((r) => r.Bezirksnummer && /^[0-9]{1,2}$/.test(r.Bezirksnummer))
		.map((r) => transformSbbRow(r, built.headers, stimmtyp));

	// Leerer Ergebnis-Satz VOR clearWahlData abbrechen (siehe assertNonEmpty).
	assertNonEmpty(transformed, `${source.slug}/${stimmtyp}`);

	const briefwahl = transformed.filter((t) => t.istBriefwahl).length;
	console.log(`${tag} brief=${briefwahl} urne=${transformed.length - briefwahl}`);

	const parentWahlId: number | undefined = source.parentSlug
		? await lookupParentWahlId(db, source.parentSlug, source.wahl, stimmtyp)
		: undefined;

	const wahlId = await upsertWahl(db, {
		jahr: source.jahr,
		typ: source.wahl,
		stimmtyp,
		sourceUrl: files.data,
		license: source.licenseShort,
		isRepeatElection: source.isRepeatElection,
		parentElectionId: parentWahlId,
		vorlaeufig: source.vorlaeufig,
		sourceUpdatedAt
	});
	await clearWahlData(db, wahlId);
	const sbCount = await insertStimmbezirke(db, wahlId, transformed);
	const erCount = await insertErgebnisse(db, wahlId, transformed, stimmtyp, parteiIdByKurzname);
	const counts = await buildAggregates(db, wahlId);
	console.log(
		`${tag} wahlId=${wahlId} stimmbezirke=${sbCount} ergebnis=${erCount} agg=berlin:${counts.berlin}/bezirk:${counts.bezirk} vorlaeufig=${source.vorlaeufig ?? false} sourceUpdatedAt=${sourceUpdatedAt?.toISOString() ?? 'null'}`
	);
}

async function processWbCsv(
	source: WahlSource,
	parteiIdByKurzname: Awaited<ReturnType<typeof seedParteienAndAliases>>
): Promise<void> {
	const pairs: { stimmtyp: StimmtypKey | 'einstimme'; files?: WbCsvFiles }[] = [
		{ stimmtyp: 'erststimme', files: source.wbCsvErst },
		{ stimmtyp: 'zweitstimme', files: source.wbCsvZweit },
		{ stimmtyp: 'einstimme', files: source.wbCsvEin }
	];
	for (const { stimmtyp, files } of pairs) {
		if (!files) continue;
		await processWbCsvOne(source, stimmtyp, files, parteiIdByKurzname);
	}
}

// Nur ausführen, wenn direkt als Script gestartet (nicht beim Import fürs
// Testen von `parseArgs` -- Import würde sonst den kompletten Ingest gegen
// alle WAHL_SOURCES auslösen).
const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
	main().catch((err) => {
		console.error(err);
		process.exitCode = 1;
	});
}

export { processOneWahl, parseArgs, BWL_BTW25_WBZ };
