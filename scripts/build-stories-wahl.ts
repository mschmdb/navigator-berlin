/**
 * Berlin in Quadraten (gh-187): Zweitstimmen je Bezirk und Wahl, dazu
 * Wahlberechtigte, Wählende und Berlin gesamt. Liest die amtlichen Dateien aus
 * `WAHL_SOURCES` mit denselben Parsern wie die Wahl-Pipeline, ohne Datenbank.
 * Wahlbeteiligung = Wählende / Wahlberechtigte, gerechnet wie in der Skizze
 * (`runde-20-ux/tools/bezirk-turnout.ts`). Parteien außerhalb des Partei-Seeds
 * landen wie in der Pipeline in `Sonstige`, alle übrigen bleiben einzeln.
 *
 * Ausgabe: `static/data/stories-wahl.json`. Run: `pnpm data:stories-wahl`.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { WahlMeta, WahlSlug } from '../src/lib/stories/wahl-quadrate/types.js';
import { isMainEntry } from './lib/is-main-entry.js';
import {
	buildStoriesWahl,
	type WahlInput,
	type ZweitstimmenRow
} from './lib/stories/wahl-quadrate.js';
import { BERLIN_LAND_CODE, filterByLand, parseBwlWbzCsv } from './wahlen/lib/bwl-csv-parser.js';
import { extractBwlCsvs, fetchBwlZip } from './wahlen/lib/bwl-fetcher.js';
import {
	transformBwlRow,
	transformBwlSplitRow,
	type TransformedBwlRow
} from './wahlen/lib/row-transformer.js';
import {
	extractSheet,
	fetchSbbXlsx,
	loadWorkbook,
	rowToObject
} from './wahlen/lib/sbb-xlsx-fetcher.js';
import { transformSbbRow } from './wahlen/lib/sbb-row-transformer.js';
import { WAHL_SOURCES, type WahlSource } from './wahlen/lib/sources.js';
import {
	assertNonEmpty,
	assertPartySumMatchesGueltig,
	assertRequiredColumns,
	buildWbCsvRows,
	decodeLegendCp1252,
	fetchWbCsvText,
	fetchWbLegendBuffer,
	parseWbCsvData,
	parseWbLegend
} from './wahlen/lib/wb-csv-parser.js';

export const OUT_FILE = 'static/data/stories-wahl.json';

export const STORIES_WAHL_SLUGS: readonly WahlSlug[] = [
	'agh11',
	'agh16',
	'agh21',
	'agh23',
	'agh26',
	'btw13',
	'btw17',
	'btw21',
	'btw25'
];

const isBezirkRow = (r: Record<string, string>) =>
	Boolean(r.Bezirksnummer) && /^[0-9]{1,2}$/.test(r.Bezirksnummer);

async function sbbRows(src: WahlSource): Promise<TransformedBwlRow[]> {
	if (!src.sheetZweit) throw new Error(`${src.slug}: sheetZweit fehlt`);
	const sheet = extractSheet(loadWorkbook(await fetchSbbXlsx(src.url)), src.sheetZweit);
	return sheet.rows
		.map((r) => rowToObject(r, sheet.headers))
		.filter(isBezirkRow)
		.map((r) => transformSbbRow(r, sheet.headers, 'zweitstimme'));
}

async function wbRows(src: WahlSource): Promise<TransformedBwlRow[]> {
	if (!src.wbCsvZweit) throw new Error(`${src.slug}: wbCsvZweit fehlt`);
	const label = `${src.slug}/zweitstimme`;
	const [text, legend] = await Promise.all([
		fetchWbCsvText(src.wbCsvZweit.data),
		fetchWbLegendBuffer(src.wbCsvZweit.legend)
	]);
	const parsed = parseWbCsvData(text);
	assertRequiredColumns(parsed.headers, label);
	const built = buildWbCsvRows(parsed, parseWbLegend(decodeLegendCp1252(legend)), label);
	assertPartySumMatchesGueltig(built.rows, built.partyNames, label);
	return built.rows
		.filter(isBezirkRow)
		.map((r) => transformSbbRow(r, built.headers, 'zweitstimme'));
}

async function bwlRows(src: WahlSource): Promise<TransformedBwlRow[]> {
	const extracted = extractBwlCsvs(await fetchBwlZip(src.url));
	if (extracted.mode === 'combined') {
		const p = parseBwlWbzCsv(extracted.csv);
		return filterByLand(p.rows, BERLIN_LAND_CODE).map((r) => transformBwlRow(r, p.headers));
	}
	const p = parseBwlWbzCsv(extracted.zweit);
	return filterByLand(p.rows, BERLIN_LAND_CODE).map((r) =>
		transformBwlSplitRow(r, p.headers, 'zweitstimme')
	);
}

function rowsFor(src: WahlSource): Promise<TransformedBwlRow[]> {
	if (src.kind === 'sbb-xlsx') return sbbRows(src);
	if (src.kind === 'wb-csv') return wbRows(src);
	return bwlRows(src);
}

const toZweitstimmen = (r: TransformedBwlRow): ZweitstimmenRow => ({
	bezirkCode: r.bezirkCode,
	wahlberechtigte: r.wahlberechtigte,
	waehlende: r.waehlende,
	gueltig: r.gueltig.zweitstimme,
	votes: r.votes.zweitstimme
});

function metaFor(src: WahlSource, slug: WahlSlug): WahlMeta {
	if (src.wahl === 'bvv') throw new Error(`${slug}: BVV gehört nicht in die Datenbasis`);
	return {
		slug,
		typ: src.wahl,
		jahr: src.jahr,
		wiederholung: src.isRepeatElection ?? false,
		vorlaeufig: src.vorlaeufig ?? false,
		quelle: src.wbCsvZweit?.data ?? src.url,
		lizenz: src.licenseShort
	};
}

async function main(): Promise<void> {
	const wahlen: WahlInput[] = [];
	for (const slug of STORIES_WAHL_SLUGS) {
		const src = WAHL_SOURCES.find((s) => s.slug === slug);
		if (!src) throw new Error(`WAHL_SOURCES ohne ${slug}`);
		console.log(`[stories-wahl] ${slug} lade ${src.url}`);
		const rows = await rowsFor(src);
		assertNonEmpty(rows, slug);
		wahlen.push({ meta: metaFor(src, slug), rows: rows.map(toZweitstimmen) });
	}

	const out = buildStoriesWahl({ generatedAt: new Date().toISOString(), wahlen });
	await mkdir(dirname(OUT_FILE), { recursive: true });
	await writeFile(OUT_FILE, JSON.stringify(out, null, '\t') + '\n');
	for (const w of out.wahlen) {
		const b = out.berlin[w.slug];
		console.log(
			`[stories-wahl] ${w.slug} gültig=${b.gueltig} beteiligung=${(b.wahlbeteiligung * 100).toFixed(1)} % parteien=${b.parteien.length}`
		);
	}
	console.log(`[stories-wahl] ${OUT_FILE} geschrieben`);
}

if (isMainEntry(import.meta.url, process.argv[1])) {
	main().catch((err) => {
		console.error(err);
		process.exitCode = 1;
	});
}
