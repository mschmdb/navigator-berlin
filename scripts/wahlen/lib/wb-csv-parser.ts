/**
 * Parser für den Wahlbezirks-Datenexport von wahlen-berlin.de
 * ("wb-csv", Story: Ingest AGH/BVV 2026).
 *
 * Zwei Dateien pro Stimmtyp:
 * - Datenexport_*_W_BE.csv: UTF-8-mit-BOM, `;`-getrennt, ein Wahlbezirk pro
 *   Zeile, Partei-Spalten als `P<nn>`/`P<nn>p` (Stimmen/Prozent).
 * - DSB_Datenexport_*_W_BE.csv: Windows-1252, Datensatzbeschreibung. Löst
 *   `P<nn>` auf den amtlichen Parteinamen auf oder markiert den Code als
 *   "nicht besetzt, kein Ergebniseingang" (Legenden-Slot ohne Partei in
 *   dieser Wahl).
 *
 * Die Ausgabe (`buildWbCsvRows`) hat die Spaltennamen, die
 * `transformSbbRow` (sbb-row-transformer.ts) erwartet -- UWB-ID,
 * Briefwahl-Erkennung und Einstimme-Slot laufen dadurch unverändert.
 * Metaspalten (StimmArt, Datum, Zeit, WberA1..3, alle `p`-Prozentspalten)
 * werden bewusst nicht durchgereicht, sonst behandelt `transformSbbRow`
 * sie als unbekannte Partei-Spalten.
 */
import { parse } from 'csv-parse/sync';
import { USER_AGENT } from '../../lib/user-agent.js';
import { assertAllowed } from '../../lib/allowlist.js';
import { withRetry } from '../../lib/retry.js';

/**
 * wahlen-berlin.de liefert 406 Not Acceptable auf jeden expliziten
 * `Accept`-Header außer dem Wildcard-Accept (auch `text/csv` schlägt fehl)
 * -- anders als die `defaultHeaders()`-Konvention (`Accept: application/json`)
 * der übrigen Fetcher. Eigene Headers statt der geteilten JSON-Defaults.
 */
function wbCsvHeaders(): HeadersInit {
	return { 'User-Agent': USER_AGENT, Accept: '*/*' };
}

export type WbCsvRow = Record<string, string>;

const BOM = '﻿';

function stripBom(text: string): string {
	return text.startsWith(BOM) ? text.slice(BOM.length) : text;
}

function splitCsvLine(line: string): string[] {
	return parse(line, { delimiter: ';', relax_quotes: true, skip_empty_lines: false })[0] ?? [];
}

/** Identifier-Quellspalte (wahlen-berlin.de) -> Zielspalte (sbb-row-transformer.ts). */
const IDENTIFIER_COLUMN_MAP: Readonly<Record<string, string>> = {
	Adresse: 'Adresse',
	Bezirk: 'Bezirksnummer',
	Bezirksname: 'Bezirksname',
	WBezArt: 'Wahlbezirksart',
	Wahlbezirk: 'Wahlbezirk',
	Briefwahlbezirk: 'Briefwahlbezirk',
	AghWkr: 'Abgeordnetenhauswahlkreis',
	WberIns: 'Wahlberechtigte insgesamt',
	Waehler: 'Wählende',
	Gueltig: 'Gültige Stimmen',
	Unguelt: 'Ungültige Stimmen'
};

const PARTY_CODE_RE = /^P\d+$/;

function parseIntSafe(value: string | undefined): number {
	if (!value) return 0;
	const n = Number.parseInt(value.replace(/\./g, '').trim(), 10);
	return Number.isFinite(n) ? n : 0;
}

// --- Fetch (Netzwerk, ungetestet -- Muster bwl-fetcher.ts/sbb-xlsx-fetcher.ts) ---

export async function fetchWbCsvText(url: string): Promise<string> {
	assertAllowed(url);
	return withRetry(async () => {
		const res = await fetch(url, { headers: wbCsvHeaders() });
		if (!res.ok) throw new Error(`wb-csv ${url} HTTP ${res.status}`);
		const buf = Buffer.from(await res.arrayBuffer());
		return buf.toString('utf-8');
	});
}

export async function fetchWbLegendBuffer(url: string): Promise<Buffer> {
	assertAllowed(url);
	return withRetry(async () => {
		const res = await fetch(url, { headers: wbCsvHeaders() });
		if (!res.ok) throw new Error(`wb-csv DSB-Legende ${url} HTTP ${res.status}`);
		return Buffer.from(await res.arrayBuffer());
	});
}

// --- Parse (pure, getestet) ---

export function decodeLegendCp1252(buf: Buffer): string {
	return new TextDecoder('windows-1252').decode(buf);
}

/** Code (`P01`) -> Parteiname, oder `null` für "nicht besetzt, kein Ergebniseingang". */
export function parseWbLegend(text: string): Map<string, string | null> {
	const map = new Map<string, string | null>();
	const lines = stripBom(text).split(/\r?\n/);
	for (const line of lines) {
		const idx = line.indexOf(';');
		if (idx < 0) continue;
		const rawKey = line.slice(0, idx).trim();
		if (!PARTY_CODE_RE.test(rawKey)) continue;
		const rawVal = line
			.slice(idx + 1)
			.replace(/;+\s*$/, '')
			.trim();
		const name = rawVal === '' || /^nicht besetzt/i.test(rawVal) ? null : rawVal;
		map.set(rawKey, name);
	}
	return map;
}

export function parseWbCsvData(text: string): { headers: string[]; rows: WbCsvRow[] } {
	const stripped = stripBom(text);
	const lines = stripped.split(/\r?\n/).filter((l) => l.length > 0);
	if (lines.length === 0) {
		throw new Error('wb-csv: leere Datei');
	}
	const headers = splitCsvLine(lines[0]).map((h) => h.trim());
	const rows: WbCsvRow[] = lines.slice(1).map((line) => {
		const cells = splitCsvLine(line);
		const row: WbCsvRow = {};
		for (let i = 0; i < headers.length; i++) {
			row[headers[i]] = (cells[i] ?? '').trim();
		}
		return row;
	});
	return { headers, rows };
}

/**
 * Baut aus den Roh-Zeilen die für `transformSbbRow` erwartete Spaltenform.
 * Wirft, wenn die Daten einen Partei-Code enthalten, den die Legende gar
 * nicht kennt, UND dieser Code in mindestens einer Zeile einen Wert > 0
 * trägt ("Unbekannter P-Code", I/O-Matrix). Ein Code, den die Legende
 * explizit als "nicht besetzt" führt, wird dagegen still übersprungen.
 */
/**
 * Quellspalten, ohne die eine Wahlbezirks-Zeile nicht sinnvoll verarbeitbar
 * ist: alle `IDENTIFIER_COLUMN_MAP`-Keys (UWB-ID, Briefwahl-Erkennung,
 * Gueltig/Unguelt, Wahlberechtigte, Wählende) plus `Datum`/`Zeit`
 * (Grundlage für `computeSourceUpdatedAt`). Fehlt eine davon in der echten
 * CSV, werden Zeilen sonst still mit `''`/`0` befüllt statt laut
 * abzubrechen (Review-Fund 23.09.).
 */
const REQUIRED_SOURCE_COLUMNS: readonly string[] = [
	...Object.keys(IDENTIFIER_COLUMN_MAP),
	'Datum',
	'Zeit'
];

export function assertRequiredColumns(headers: readonly string[], sourceLabel: string): void {
	const missing = REQUIRED_SOURCE_COLUMNS.filter((c) => !headers.includes(c));
	if (missing.length > 0) {
		throw new Error(
			`wb-csv (${sourceLabel}): Pflichtspalten fehlen im CSV-Header: ${missing.join(', ')}`
		);
	}
}

/**
 * Bricht ab, wenn nach dem Transform 0 Zeilen übrig sind (leere Datei oder
 * Bezirksnummer-Filter hat alles verworfen). Muss VOR `clearWahlData`
 * laufen, sonst löscht der Ingest bestehende gute Daten und ersetzt sie
 * durch nichts (Review-Fund 23.09.).
 */
export function assertNonEmpty(rows: readonly unknown[], sourceLabel: string): void {
	if (rows.length === 0) {
		throw new Error(
			`wb-csv (${sourceLabel}): 0 Zeilen nach Transform -- Abbruch vor DB-Schreiben ` +
				`(kein Datenverlust durch clearWahlData ohne Ersatz-Daten)`
		);
	}
}

export function buildWbCsvRows(
	data: { headers: string[]; rows: WbCsvRow[] },
	legend: ReadonlyMap<string, string | null>,
	sourceLabel: string
): { headers: string[]; rows: WbCsvRow[]; partyNames: string[] } {
	const partyCols: { source: string; name: string }[] = [];
	const unknownCols: string[] = [];
	for (const col of data.headers) {
		if (!PARTY_CODE_RE.test(col)) continue;
		if (!legend.has(col)) {
			unknownCols.push(col);
			continue;
		}
		const name = legend.get(col);
		if (name === null) continue;
		if (name !== undefined) partyCols.push({ source: col, name });
	}

	const partyNames = Array.from(new Set(partyCols.map((p) => p.name)));
	const outHeaders = [...Object.values(IDENTIFIER_COLUMN_MAP), ...partyNames];

	const outRows: WbCsvRow[] = data.rows.map((row) => {
		for (const col of unknownCols) {
			const n = parseIntSafe(row[col]);
			if (n !== 0) {
				throw new Error(
					`wb-csv (${sourceLabel}): unbekannter Partei-Code ${col} ohne Legenden-Eintrag, ` +
						`Wert=${n}, Adresse=${row.Adresse ?? '?'}`
				);
			}
		}

		const out: WbCsvRow = {};
		for (const [source, target] of Object.entries(IDENTIFIER_COLUMN_MAP)) {
			out[target] = row[source] ?? '';
		}
		const partyTotals = new Map<string, number>();
		for (const { source, name } of partyCols) {
			partyTotals.set(name, (partyTotals.get(name) ?? 0) + parseIntSafe(row[source]));
		}
		for (const [name, n] of partyTotals) out[name] = String(n);
		return out;
	});

	return { headers: outHeaders, rows: outRows, partyNames };
}

/**
 * Plausi-Check: Summe der aufgelösten Partei-Spalten muss je Zeile exakt
 * `Gültige Stimmen` ergeben (I/O-Matrix "Unbesetzter P-Code" -- Abbruch bei
 * Abweichung statt stiller Daten-Korruption).
 */
export function assertPartySumMatchesGueltig(
	rows: readonly WbCsvRow[],
	partyNames: readonly string[],
	sourceLabel: string
): void {
	for (const row of rows) {
		const gueltig = parseIntSafe(row['Gültige Stimmen']);
		let sum = 0;
		for (const name of partyNames) sum += parseIntSafe(row[name]);
		if (sum !== gueltig) {
			throw new Error(
				`wb-csv (${sourceLabel}): Parteisumme (${sum}) != Gueltig (${gueltig}) bei ` +
					`Adresse=${row.Adresse ?? '?'}`
			);
		}
	}
}

const SOURCE_TIME_ZONE = 'Europe/Berlin';

const BERLIN_ZONE_FORMATTER = new Intl.DateTimeFormat('en-US', {
	timeZone: SOURCE_TIME_ZONE,
	hourCycle: 'h23',
	year: 'numeric',
	month: '2-digit',
	day: '2-digit',
	hour: '2-digit',
	minute: '2-digit',
	second: '2-digit'
});

/**
 * Wandelt eine Wanduhrzeit in `Europe/Berlin` (DST-korrekt, CEST/CET) in den
 * entsprechenden UTC-Zeitpunkt um -- ohne Zeitzonen-Library, per
 * Intl-Offset-Trick (zwei Iterationen, robust auch nahe einer
 * DST-Umstellung). `wahlen-berlin.de` liefert `Datum`/`Zeit` in Berliner
 * Ortszeit (Stand-Banner der Seite, z.B. „21.09.2026, 03:33:56"), nicht UTC.
 */
function zonedBerlinTimeToUtc(
	year: number,
	month: number,
	day: number,
	hour: number,
	minute: number,
	second: number
): Date {
	let guess = Date.UTC(year, month - 1, day, hour, minute, second);
	for (let i = 0; i < 2; i++) {
		const parts = BERLIN_ZONE_FORMATTER.formatToParts(new Date(guess));
		const map: Record<string, string> = {};
		for (const p of parts) map[p.type] = p.value;
		const asIfUtc = Date.UTC(
			Number(map.year),
			Number(map.month) - 1,
			Number(map.day),
			Number(map.hour),
			Number(map.minute),
			Number(map.second)
		);
		const offsetMs = asIfUtc - guess;
		guess = Date.UTC(year, month - 1, day, hour, minute, second) - offsetMs;
	}
	return new Date(guess);
}

/**
 * Spätester `Datum`+`Zeit`-Zeitstempel über alle Roh-Zeilen (vor dem
 * Identifier-Remapping, das diese Metaspalten verwirft) -- Basis für
 * `wahl.sourceUpdatedAt`. `Datum`/`Zeit` liefert die Quelle in Berliner
 * Ortszeit (Format `JJ.MM.TT`/`hh:mm:ss`), DST-korrekt nach UTC konvertiert
 * (Bugfix: vorher fälschlich als UTC interpretiert, dadurch 1-2h daneben).
 */
export function computeSourceUpdatedAt(rawRows: readonly WbCsvRow[]): Date | null {
	let max: Date | null = null;
	for (const row of rawRows) {
		const d = (row.Datum ?? '').trim();
		const t = (row.Zeit ?? '').trim();
		if (!d || !t) continue;
		const dm = d.match(/^(\d{2})\.(\d{2})\.(\d{2})$/);
		const tm = t.match(/^(\d{2}):(\d{2}):(\d{2})$/);
		if (!dm || !tm) continue;
		const [, yy, mm, dd] = dm;
		const [, hh, mi, ss] = tm;
		const dt = zonedBerlinTimeToUtc(
			2000 + Number(yy),
			Number(mm),
			Number(dd),
			Number(hh),
			Number(mi),
			Number(ss)
		);
		if (!max || dt > max) max = dt;
	}
	return max;
}
