import type { BwlRawRow } from './bwl-csv-parser.js';
import { resolveParteiKurzname } from './partei-seed.js';

export type StimmtypKey = 'erststimme' | 'zweitstimme';

export type PartyVote = {
	parteiKurzname: string;
	stimmen: number;
};

export type TransformedBwlRow = {
	wahlkreis: string;
	wahlbezirk: string;
	uwbId: string;
	bezirkCode: string;
	bezirksart: string;
	istBriefwahl: boolean;
	wahlberechtigte: number;
	waehlende: number;
	ungueltig: { erststimme: number; zweitstimme: number };
	gueltig: { erststimme: number; zweitstimme: number };
	votes: { erststimme: PartyVote[]; zweitstimme: PartyVote[] };
};

const COL_WAHLKREIS = 'Wahlkreis';
const COL_LAND = 'Land';
const COL_KREIS = 'Kreis';
const COL_WAHLBEZIRK = 'Wahlbezirk';
const COL_BEZIRKSART = 'Bezirksart';
const COL_WAHLBERECHTIGTE = 'Wahlberechtigte (A)';
const COL_WAEHLENDE = 'Wählende (B)';

export type BwlFormatProfile = {
	id: 'suffix-gen' | 'prefix-gen' | 'split-direct-erst' | 'split-direct-zweit';
	erstMarker: string;
	zweitMarker: string;
	matchErst: (col: string) => boolean;
	matchZweit: (col: string) => boolean;
	labelFromErstCol: (col: string) => string;
	labelFromZweitCol: (col: string) => string;
	cols: {
		ungueltigErst: string;
		gueltigErst: string;
		ungueltigZweit: string;
		gueltigZweit: string;
	};
};

export const SUFFIX_GEN_PROFILE: BwlFormatProfile = {
	id: 'suffix-gen',
	erstMarker: ' - Erststimmen',
	zweitMarker: ' - Zweitstimmen',
	matchErst: (col) => col.endsWith(' - Erststimmen'),
	matchZweit: (col) => col.endsWith(' - Zweitstimmen'),
	labelFromErstCol: (col) => col.slice(0, -' - Erststimmen'.length).trim(),
	labelFromZweitCol: (col) => col.slice(0, -' - Zweitstimmen'.length).trim(),
	cols: {
		ungueltigErst: 'Ungültige - Erststimmen',
		gueltigErst: 'Gültige - Erststimmen',
		ungueltigZweit: 'Ungültige - Zweitstimmen',
		gueltigZweit: 'Gültige - Zweitstimmen'
	}
};

export const PREFIX_GEN_PROFILE: BwlFormatProfile = {
	id: 'prefix-gen',
	erstMarker: 'E_',
	zweitMarker: 'Z_',
	matchErst: (col) => col.startsWith('E_'),
	matchZweit: (col) => col.startsWith('Z_'),
	labelFromErstCol: (col) => col.slice('E_'.length).trim(),
	labelFromZweitCol: (col) => col.slice('Z_'.length).trim(),
	cols: {
		ungueltigErst: 'E_Ungültige',
		gueltigErst: 'E_Gültige',
		ungueltigZweit: 'Z_Ungültige',
		gueltigZweit: 'Z_Gültige'
	}
};

export function detectFormatProfile(headers: readonly string[]): BwlFormatProfile {
	const hasSuffix = headers.some((h) => h.endsWith(' - Erststimmen'));
	if (hasSuffix) return SUFFIX_GEN_PROFILE;
	const hasPrefix = headers.some((h) => h.startsWith('E_'));
	if (hasPrefix) return PREFIX_GEN_PROFILE;
	throw new Error(
		'Bundeswahlleiterin-CSV: unable to detect format profile (no suffix or prefix marker found)'
	);
}

const SPLIT_IDENTIFIER_COLS = new Set([
	'Wahlkreis',
	'Land',
	'Regierungsbezirk',
	'Kreis',
	'Verbandsgemeinde',
	'Gemeinde',
	'Kennziffer Urnenwahlbezirke nach § 68 BWO',
	'Kennziffer Briefwahlzugehörigkeit',
	'Gemeindename',
	'Gemeinde Name',
	'Wahlbezirk',
	'Bezirksart',
	'Wahlberechtigte (A)',
	'Wahlberechtigte ohne Sperrvermerk (A1)',
	'Wahlberechtigte mit Sperrvermerk (A2)',
	'Wahlberechtigte nach § 25 Abs. 2 BWO (A3)',
	'Wähler (B)',
	'Wähler mit Wahlschein (B1)',
	'Wählende (B)',
	'Wählende mit Wahlschein (B1)',
	'Ungültig',
	'Gültig',
	'Ungültige',
	'Gültige',
	'Ungekürzte Wahlbezirksbezeichnung',
	'Bezeichnung des Wahlbezirkes gemäß Anlage 30 zur BWO'
]);

function aggregateSplitVotes(
	row: BwlRawRow,
	headers: readonly string[]
): PartyVote[] {
	const totals = new Map<string, number>();
	for (const col of headers) {
		if (SPLIT_IDENTIFIER_COLS.has(col)) continue;
		const stimmen = parseIntSafe(row[col]);
		if (stimmen === 0) continue;
		const kurz = resolveParteiKurzname(col);
		totals.set(kurz, (totals.get(kurz) ?? 0) + stimmen);
	}
	return Array.from(totals.entries())
		.map(([parteiKurzname, stimmen]) => ({ parteiKurzname, stimmen }))
		.sort((a, b) => b.stimmen - a.stimmen);
}

function pickFirstExisting(row: BwlRawRow, cols: readonly string[]): string {
	for (const c of cols) {
		const v = row[c];
		if (v !== undefined) return v;
	}
	return '';
}

export function transformBwlSplitRow(
	row: BwlRawRow,
	headers: readonly string[],
	stimmtyp: StimmtypKey
): TransformedBwlRow {
	const wahlkreis = (row[COL_WAHLKREIS] ?? '').padStart(3, '0');
	const wahlbezirk = (row[COL_WAHLBEZIRK] ?? '').trim();
	const bezirkCode = (row[COL_KREIS] ?? '').padStart(2, '0');
	const bezirksart = (row[COL_BEZIRKSART] ?? '').trim();

	const ungueltig = parseIntSafe(pickFirstExisting(row, ['Ungültig', 'Ungültige']));
	const gueltig = parseIntSafe(pickFirstExisting(row, ['Gültig', 'Gültige']));
	const waehlende = parseIntSafe(
		pickFirstExisting(row, ['Wählende (B)', 'Wähler (B)'])
	);

	const votes = aggregateSplitVotes(row, headers);

	return {
		wahlkreis,
		wahlbezirk,
		uwbId: buildUwbId(wahlkreis, bezirkCode, wahlbezirk, bezirksart),
		bezirkCode,
		bezirksart,
		istBriefwahl: isBriefwahlRow(row),
		wahlberechtigte: parseIntSafe(row[COL_WAHLBERECHTIGTE]),
		waehlende,
		ungueltig: {
			erststimme: stimmtyp === 'erststimme' ? ungueltig : 0,
			zweitstimme: stimmtyp === 'zweitstimme' ? ungueltig : 0
		},
		gueltig: {
			erststimme: stimmtyp === 'erststimme' ? gueltig : 0,
			zweitstimme: stimmtyp === 'zweitstimme' ? gueltig : 0
		},
		votes: {
			erststimme: stimmtyp === 'erststimme' ? votes : [],
			zweitstimme: stimmtyp === 'zweitstimme' ? votes : []
		}
	};
}

export function buildUwbId(
	wahlkreis: string,
	bezirkCode: string,
	wahlbezirk: string,
	bezirksart: string
): string {
	const wk = wahlkreis.padStart(3, '0');
	const bz = bezirkCode.padStart(2, '0');
	const art = bezirksart || '0';
	return `${wk}-${bz}-${wahlbezirk}-${art}`;
}

export function isBriefwahlRow(row: BwlRawRow): boolean {
	const bezirksart = (row[COL_BEZIRKSART] ?? '').trim();
	return bezirksart !== '' && bezirksart !== '0';
}

function parseIntSafe(value: string | undefined): number {
	const n = Number.parseInt((value ?? '0').trim(), 10);
	return Number.isFinite(n) ? n : 0;
}

function aggregateVotes(
	row: BwlRawRow,
	headers: readonly string[],
	match: (col: string) => boolean,
	labelFromCol: (col: string) => string,
	excludeCols: ReadonlySet<string>
): PartyVote[] {
	const totals = new Map<string, number>();
	for (const col of headers) {
		if (!match(col) || excludeCols.has(col)) continue;
		const label = labelFromCol(col);
		const stimmen = parseIntSafe(row[col]);
		if (stimmen === 0) continue;
		const kurz = resolveParteiKurzname(label);
		totals.set(kurz, (totals.get(kurz) ?? 0) + stimmen);
	}
	return Array.from(totals.entries())
		.map(([parteiKurzname, stimmen]) => ({ parteiKurzname, stimmen }))
		.sort((a, b) => b.stimmen - a.stimmen);
}

export function transformBwlRow(
	row: BwlRawRow,
	headers: readonly string[],
	profile?: BwlFormatProfile
): TransformedBwlRow {
	const fmt = profile ?? detectFormatProfile(headers);
	const wahlkreis = (row[COL_WAHLKREIS] ?? '').padStart(3, '0');
	const wahlbezirk = (row[COL_WAHLBEZIRK] ?? '').trim();
	const bezirkCode = (row[COL_KREIS] ?? '').padStart(2, '0');
	const bezirksart = (row[COL_BEZIRKSART] ?? '').trim();

	const excludeErst = new Set([fmt.cols.ungueltigErst, fmt.cols.gueltigErst]);
	const excludeZweit = new Set([fmt.cols.ungueltigZweit, fmt.cols.gueltigZweit]);

	return {
		wahlkreis,
		wahlbezirk,
		uwbId: buildUwbId(wahlkreis, bezirkCode, wahlbezirk, bezirksart),
		bezirkCode,
		bezirksart,
		istBriefwahl: isBriefwahlRow(row),
		wahlberechtigte: parseIntSafe(row[COL_WAHLBERECHTIGTE]),
		waehlende: parseIntSafe(row[COL_WAEHLENDE]),
		ungueltig: {
			erststimme: parseIntSafe(row[fmt.cols.ungueltigErst]),
			zweitstimme: parseIntSafe(row[fmt.cols.ungueltigZweit])
		},
		gueltig: {
			erststimme: parseIntSafe(row[fmt.cols.gueltigErst]),
			zweitstimme: parseIntSafe(row[fmt.cols.gueltigZweit])
		},
		votes: {
			erststimme: aggregateVotes(row, headers, fmt.matchErst, fmt.labelFromErstCol, excludeErst),
			zweitstimme: aggregateVotes(row, headers, fmt.matchZweit, fmt.labelFromZweitCol, excludeZweit)
		}
	};
}

export const COLUMNS = {
	WAHLKREIS: COL_WAHLKREIS,
	LAND: COL_LAND,
	KREIS: COL_KREIS,
	WAHLBEZIRK: COL_WAHLBEZIRK,
	BEZIRKSART: COL_BEZIRKSART
} as const;
