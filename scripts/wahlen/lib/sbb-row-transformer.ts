import { resolveParteiKurzname } from './partei-seed.js';
import type { StimmtypKey, TransformedBwlRow } from './row-transformer.js';

const COL_STIMMART = 'Stimmart';
const COL_ADRESSE = 'Adresse';
const COL_BEZIRKSNR = 'Bezirksnummer';
const COL_WAHLBEZIRK = 'Wahlbezirk';
const COL_WAHLBEZIRKSART = 'Wahlbezirksart';
const COL_BRIEFWAHLBEZIRK = 'Briefwahlbezirk';
const COL_WAHLBERECHTIGTE = 'Wahlberechtigte insgesamt';
const COL_GUELTIG = 'Gültige Stimmen';
const COL_UNGUELTIG = 'Ungültige Stimmen';

const WAEHLENDE_VARIANTS = ['Wählende', 'Wähler'];
const AGH_WAHLKREIS_VARIANTS = [
	'Abgeordneten- hauswahlkreis',
	'Abgeordnetenhauswahlkreis',
	'Abgeordneten-hauswahlkreis'
];

const SBB_IDENTIFIER_COLS = new Set([
	COL_STIMMART,
	COL_ADRESSE,
	COL_BEZIRKSNR,
	'Bezirksname',
	COL_WAHLBEZIRK,
	COL_WAHLBEZIRKSART,
	COL_BRIEFWAHLBEZIRK,
	...AGH_WAHLKREIS_VARIANTS,
	'Bundestags- wahlkreis',
	'Bundestagswahlkreis',
	'OstWest',
	'Berlin OstWest',
	COL_WAHLBERECHTIGTE,
	'Wahlberechtigte A1',
	'Wahlberechtigte A2',
	'Wahlberechtigte A3',
	...WAEHLENDE_VARIANTS,
	'Wählende B1',
	'Wähler B1',
	COL_GUELTIG,
	COL_UNGUELTIG
]);

function parseIntSafe(value: string | undefined): number {
	if (!value) return 0;
	const n = Number.parseInt(value.replace(/\./g, '').trim(), 10);
	return Number.isFinite(n) ? n : 0;
}

function pickFirst(row: Record<string, string>, cols: readonly string[]): string {
	for (const c of cols) {
		const v = row[c];
		if (v !== undefined && v !== '') return v;
	}
	return '';
}

function buildSbbUwbId(
	bezirkCode: string,
	wahlbezirk: string,
	wahlbezirksart: string,
	adresse?: string
): string {
	if (adresse) return adresse;
	const art = (wahlbezirksart || '0').replace(/\s+/g, '').slice(0, 1) || '0';
	return `${bezirkCode}${art}${wahlbezirk}`;
}

function isSbbBriefwahl(wahlbezirksart: string): boolean {
	const raw = wahlbezirksart.trim();
	if (raw === '' || raw === '0') return false;
	const lower = raw.toLowerCase();
	if (lower.startsWith('urnenwahl') || lower === 'w') return false;
	if (lower.startsWith('briefwahl') || lower.startsWith('b')) return true;
	if (/^\d+[a-z]/i.test(raw)) return true;
	return false;
}

function isEbColumn(col: string): boolean {
	return /^EB(\s+\d+)?$/i.test(col);
}

function aggregateSbbVotes(
	row: Record<string, string>,
	headers: readonly string[]
): { parteiKurzname: string; stimmen: number }[] {
	const totals = new Map<string, number>();
	for (const col of headers) {
		if (!col || SBB_IDENTIFIER_COLS.has(col) || isEbColumn(col)) continue;
		const stimmen = parseIntSafe(row[col]);
		if (stimmen === 0) continue;
		const kurz = resolveParteiKurzname(col);
		totals.set(kurz, (totals.get(kurz) ?? 0) + stimmen);
	}
	return Array.from(totals.entries())
		.map(([parteiKurzname, stimmen]) => ({ parteiKurzname, stimmen }))
		.sort((a, b) => b.stimmen - a.stimmen);
}

export function transformSbbRow(
	row: Record<string, string>,
	headers: readonly string[],
	stimmtyp: StimmtypKey | 'einstimme'
): TransformedBwlRow {
	const adresse = (row[COL_ADRESSE] ?? '').trim();
	const wahlbezirk = (row[COL_WAHLBEZIRK] ?? '').trim();
	const bezirkCode = (row[COL_BEZIRKSNR] ?? '').padStart(2, '0');
	const wahlbezirksart = (row[COL_WAHLBEZIRKSART] ?? '').trim();
	const wahlkreisRaw = pickFirst(row, AGH_WAHLKREIS_VARIANTS).trim();
	const wahlkreis = wahlkreisRaw ? wahlkreisRaw.padStart(3, '0') : bezirkCode;

	const gueltig = parseIntSafe(row[COL_GUELTIG]);
	const ungueltig = parseIntSafe(row[COL_UNGUELTIG]);
	const waehlende = parseIntSafe(pickFirst(row, WAEHLENDE_VARIANTS));

	const votes = aggregateSbbVotes(row, headers);

	const erst = stimmtyp === 'erststimme';
	const zweit = stimmtyp === 'zweitstimme';
	const ein = stimmtyp === 'einstimme';

	return {
		wahlkreis,
		wahlbezirk,
		uwbId: buildSbbUwbId(bezirkCode, wahlbezirk, wahlbezirksart, adresse || undefined),
		bezirkCode,
		bezirksart: wahlbezirksart,
		istBriefwahl: isSbbBriefwahl(wahlbezirksart),
		wahlberechtigte: parseIntSafe(row[COL_WAHLBERECHTIGTE]),
		waehlende,
		ungueltig: {
			erststimme: erst ? ungueltig : 0,
			zweitstimme: zweit ? ungueltig : 0
		},
		gueltig: {
			erststimme: erst ? gueltig : 0,
			zweitstimme: zweit ? gueltig : 0
		},
		votes: {
			erststimme: erst || ein ? votes : [],
			zweitstimme: zweit ? votes : []
		}
	};
}
