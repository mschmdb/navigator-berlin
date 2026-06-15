import { parse } from 'csv-parse/sync';

export const BERLIN_LAND_CODE = '11' as const;

export const BERLIN_WAHLKREISE_BTW25 = [
	'074',
	'075',
	'076',
	'077',
	'078',
	'079',
	'080',
	'081',
	'082',
	'083',
	'084',
	'085'
] as const;

export type BwlRawRow = Record<string, string>;

export type BwlMeta = {
	copyrightLine: string;
	titleLine: string;
	metadataLineCount: number;
};

export type BwlParseResult = {
	headers: string[];
	rows: BwlRawRow[];
	meta: BwlMeta;
};

const BOM = '﻿';

export function stripBom(text: string): string {
	return text.startsWith(BOM) ? text.slice(BOM.length) : text;
}

export function isMetadataLine(line: string): boolean {
	const trimmed = line.trim();
	if (trimmed === '') return true;
	if (/^[;\s]+$/.test(trimmed)) return true;
	if (/^\(c\)/i.test(trimmed)) return true;
	if (/^ergebnisse der wahlbezirksstatistik/i.test(trimmed)) return true;
	return false;
}

export function isHeaderLine(line: string): boolean {
	return /^"?wahlkreis"?\s*;\s*"?land"?\s*;/i.test(line);
}

function splitCsvLine(line: string): string[] {
	return parse(line, { delimiter: ';', relax_quotes: true, skip_empty_lines: false })[0] ?? [];
}

export function parseBwlWbzCsv(csv: string): BwlParseResult {
	const stripped = stripBom(csv);
	const lines = stripped.split(/\r?\n/);

	let copyrightLine = '';
	let titleLine = '';
	let metadataLineCount = 0;
	let headerIndex = -1;

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		if (isHeaderLine(line)) {
			headerIndex = i;
			break;
		}
		if (isMetadataLine(line)) {
			metadataLineCount++;
			const trimmed = line.replace(/;+$/, '').trim();
			if (trimmed) {
				if (!copyrightLine && /bundeswahlleiterin/i.test(trimmed)) copyrightLine = trimmed;
				else if (!titleLine && /wahlbezirksstatistik/i.test(trimmed)) titleLine = trimmed;
			}
		}
	}

	if (headerIndex < 0) {
		throw new Error(
			'Bundeswahlleiterin-CSV: header line not found (expected "Wahlkreis;Land;...")'
		);
	}

	const headers = splitCsvLine(lines[headerIndex]).map((h) => h.trim());

	const rows: BwlRawRow[] = [];
	for (let i = headerIndex + 1; i < lines.length; i++) {
		const line = lines[i];
		if (line.trim() === '') continue;
		const cells = splitCsvLine(line);
		if (cells.length === 0) continue;
		const row: BwlRawRow = {};
		for (let c = 0; c < headers.length; c++) {
			row[headers[c]] = (cells[c] ?? '').trim();
		}
		rows.push(row);
	}

	return {
		headers,
		rows,
		meta: { copyrightLine, titleLine, metadataLineCount }
	};
}

export function filterByLand(rows: BwlRawRow[], landCode: string): BwlRawRow[] {
	return rows.filter((r) => r.Land === landCode);
}
