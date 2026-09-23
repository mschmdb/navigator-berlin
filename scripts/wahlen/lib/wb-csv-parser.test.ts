import { describe, it, expect } from 'vitest';
import {
	decodeLegendCp1252,
	parseWbLegend,
	parseWbCsvData,
	buildWbCsvRows,
	assertRequiredColumns,
	assertNonEmpty,
	assertPartySumMatchesGueltig,
	computeSourceUpdatedAt
} from './wb-csv-parser.js';
import { transformSbbRow } from './sbb-row-transformer.js';

const LEGEND_FIXTURE = [
	'1. Allgemeines;',
	'Inhalt der Daten;Vorläufige Ergebnisse für die Wahl zum Abgeordnetenhaus von Berlin am 20. September 2026',
	';',
	'2. Beschreibung der Felder;',
	'Feldname;Feldinhalt',
	'Adresse;Adresse des Wahlbezirks',
	'P01;Christlich Demokratische Union Deutschlands',
	'P01p;Christlich Demokratische Union Deutschlands in Prozent',
	'P02;Sozialdemokratische Partei Deutschlands',
	'P02p;Sozialdemokratische Partei Deutschlands in Prozent',
	'P10;nicht besetzt, kein Ergebniseingang',
	'P10p;nicht besetzt, kein Ergebniseingang'
].join('\r\n');

// P11 taucht in den Daten auf, hat aber -- anders als P10 -- gar keinen
// Legenden-Eintrag (I/O-Matrix "Unbekannter P-Code").
const CSV_HEADER =
	'Adresse;StimmArt;Bezirk;Bezirksname;WBezArt;Wahlbezirk;Briefwahlbezirk;AghWkr;BunWkr;OstWest;Datum;Zeit;WberIns;WberA1;WberA1p;Waehler;Waehlerp;Gueltig;Gueltigp;Unguelt;Ungueltp;P01;P01p;P02;P02p;P10;P10p;P11;P11p';

function csvLine(fields: Record<string, string>): string {
	const cols = CSV_HEADER.split(';');
	return cols.map((c) => fields[c] ?? '0').join(';');
}

function makeCsvText(rows: Record<string, string>[]): string {
	return '﻿' + [CSV_HEADER, ...rows.map((r) => csvLine(r))].join('\r\n');
}

describe('wb-csv-parser', () => {
	it('decodeLegendCp1252 dekodiert Windows-1252 (Ü) korrekt', () => {
		const buf = Buffer.from([0x50, 0x30, 0x31, 0x3b, 0xdc]); // "P01;" + Ü (0xDC in cp1252)
		expect(decodeLegendCp1252(buf)).toBe('P01;Ü');
	});

	it('parseWbLegend baut Code -> Name-Map, ignoriert Prozent-Spalten und unbesetzte Codes als null', () => {
		const map = parseWbLegend(LEGEND_FIXTURE);
		expect(map.get('P01')).toBe('Christlich Demokratische Union Deutschlands');
		expect(map.get('P02')).toBe('Sozialdemokratische Partei Deutschlands');
		expect(map.get('P10')).toBeNull();
		expect(map.has('P01p')).toBe(false);
		expect(map.has('P11')).toBe(false);
	});

	it('parseWbCsvData parst UTF-8-BOM ;-CSV in headers + rows', () => {
		const text = makeCsvText([
			{ Adresse: '01W101', Bezirk: '01', Gueltig: '100', P01: '60', P02: '40' }
		]);
		const { headers, rows } = parseWbCsvData(text);
		expect(headers[0]).toBe('Adresse');
		expect(rows).toHaveLength(1);
		expect(rows[0].Adresse).toBe('01W101');
		expect(rows[0].P01).toBe('60');
	});

	it('buildWbCsvRows mappt Identifier-Spalten und löst bekannte P-Codes über die Legende auf', () => {
		const legend = parseWbLegend(LEGEND_FIXTURE);
		const data = parseWbCsvData(
			makeCsvText([
				{
					Adresse: '01W101',
					Bezirk: '01',
					Bezirksname: 'Mitte',
					WBezArt: 'W',
					Wahlbezirk: '101',
					WberIns: '974',
					Waehler: '437',
					Gueltig: '100',
					Unguelt: '2',
					P01: '60',
					P02: '40',
					P10: '0',
					P11: '0'
				}
			])
		);
		const built = buildWbCsvRows(data, legend, 'agh26-erst');
		expect(built.headers).toContain('Bezirksnummer');
		expect(built.headers).toContain('Wahlbezirksart');
		expect(built.headers).toContain('Gültige Stimmen');
		expect(built.headers).toContain('Christlich Demokratische Union Deutschlands');
		expect(built.headers).not.toContain('P01');
		expect(built.headers).not.toContain('Datum');
		expect(built.rows[0].Bezirksnummer).toBe('01');
		expect(built.rows[0].Wahlbezirksart).toBe('W');
		expect(built.rows[0]['Gültige Stimmen']).toBe('100');
		expect(built.rows[0]['Christlich Demokratische Union Deutschlands']).toBe('60');
	});

	it('unbesetzter P-Code (Legende leer): Spalte wird ignoriert, keine Party-Spalte im Output', () => {
		const legend = parseWbLegend(LEGEND_FIXTURE);
		const data = parseWbCsvData(
			makeCsvText([
				{ Adresse: '01W101', Bezirk: '01', Gueltig: '100', P01: '60', P02: '40', P10: '0' }
			])
		);
		const built = buildWbCsvRows(data, legend, 'agh26-erst');
		expect(built.headers.some((h) => h.includes('nicht besetzt'))).toBe(false);
	});

	it('unbekannter P-Code (kein Legenden-Eintrag) mit Wert > 0 wirft mit Code + Adresse', () => {
		const legend = parseWbLegend(LEGEND_FIXTURE);
		const data = parseWbCsvData(
			makeCsvText([
				{ Adresse: '01W101', Bezirk: '01', Gueltig: '100', P01: '60', P02: '30', P11: '10' }
			])
		);
		expect(() => buildWbCsvRows(data, legend, 'agh26-erst')).toThrowError(/P11.*01W101/s);
	});

	it('unbekannter P-Code mit Wert 0 bleibt stumm (kein Fehler)', () => {
		const legend = parseWbLegend(LEGEND_FIXTURE);
		const data = parseWbCsvData(
			makeCsvText([{ Adresse: '01W101', Bezirk: '01', Gueltig: '100', P01: '60', P02: '40' }])
		);
		expect(() => buildWbCsvRows(data, legend, 'agh26-erst')).not.toThrow();
	});

	it('assertPartySumMatchesGueltig wirft bei Abweichung mit Zeilen-Adresse', () => {
		const rows = [{ Adresse: '01W101', 'Gültige Stimmen': '100', CDU: '60', SPD: '30' }];
		expect(() => assertPartySumMatchesGueltig(rows, ['CDU', 'SPD'], 'agh26-erst')).toThrowError(
			/01W101/
		);
	});

	it('assertPartySumMatchesGueltig ist still wenn Summe = Gueltig', () => {
		const rows = [{ Adresse: '01W101', 'Gültige Stimmen': '100', CDU: '60', SPD: '40' }];
		expect(() => assertPartySumMatchesGueltig(rows, ['CDU', 'SPD'], 'agh26-erst')).not.toThrow();
	});

	it('computeSourceUpdatedAt liefert das späteste Datum+Zeit über alle Rohzeilen, als Europe/Berlin-Ortszeit interpretiert (Format JJ.MM.TT)', () => {
		const rows = [
			{ Datum: '26.09.20', Zeit: '18:44:17' },
			{ Datum: '26.09.21', Zeit: '01:55:55' },
			{ Datum: '', Zeit: '' }
		];
		const max = computeSourceUpdatedAt(rows);
		// 21.09.2026 01:55:55 CEST (UTC+2) -> 20.09.2026 23:55:55 UTC.
		expect(max?.toISOString()).toBe('2026-09-20T23:55:55.000Z');
	});

	it('computeSourceUpdatedAt liefert null ohne verwertbare Rohzeilen', () => {
		expect(computeSourceUpdatedAt([{ Datum: '', Zeit: '' }])).toBeNull();
	});

	it('computeSourceUpdatedAt konvertiert Europe/Berlin-Ortszeit DST-korrekt nach UTC (Bugfix: vorher fälschlich als UTC interpretiert)', () => {
		// AGH-2026-Stand-Banner auf wahlen-berlin.de: "21.09.2026, 03:33:56" (CEST, UTC+2).
		const rows = [{ Datum: '26.09.21', Zeit: '03:33:56' }];
		const max = computeSourceUpdatedAt(rows);
		expect(max?.toISOString()).toBe('2026-09-21T01:33:56.000Z');
	});

	it('computeSourceUpdatedAt konvertiert Winterzeit (CET, UTC+1) korrekt', () => {
		const rows = [{ Datum: '26.01.15', Zeit: '12:00:00' }];
		const max = computeSourceUpdatedAt(rows);
		expect(max?.toISOString()).toBe('2026-01-15T11:00:00.000Z');
	});

	it('assertRequiredColumns wirft mit den fehlenden Spaltennamen (Review-Fund 23.09.)', () => {
		const headers = parseWbCsvData(makeCsvText([])).headers.filter((h) => h !== 'WberIns');
		expect(() => assertRequiredColumns(headers, 'agh26-erst')).toThrowError(/WberIns/);
	});

	it('assertRequiredColumns ist still wenn alle Pflichtspalten vorhanden sind', () => {
		const headers = parseWbCsvData(makeCsvText([])).headers;
		expect(() => assertRequiredColumns(headers, 'agh26-erst')).not.toThrow();
	});

	it('assertNonEmpty wirft bei 0 Zeilen (leere Datei nach Transform, Review-Fund 23.09.)', () => {
		expect(() => assertNonEmpty([], 'agh26-erst')).toThrowError(/0 Zeilen/);
	});

	it('assertNonEmpty ist still bei mindestens einer Zeile', () => {
		expect(() => assertNonEmpty([{ x: 1 }], 'agh26-erst')).not.toThrow();
	});
});

// Matrix-Audit-Nachzug (Punkt 1): I/O-Matrix "AGH-Zweitstimme, W-CSV, WBezArt
// W/B" ist bisher nur summarisch über den echten Ingest geprüft. Dieser Test
// schickt eine W- und eine B-Zeile (echtes Briefwahl-Adress-Format `01B1A`
// aus der AGH26-Zweitstimme-CSV, wahlen-berlin.de) end-to-end durch
// buildWbCsvRows -> transformSbbRow und prüft istBriefwahl + UWB-ID.
describe('I/O-Matrix Integration: AGH-Zweitstimme W/B (buildWbCsvRows -> transformSbbRow)', () => {
	it('W-Zeile (Urne) und B-Zeile (Brief) laufen mit korrektem istBriefwahl/UWB-ID durch', () => {
		const legend = parseWbLegend(LEGEND_FIXTURE);
		const data = parseWbCsvData(
			makeCsvText([
				{
					Adresse: '01W101',
					Bezirk: '01',
					Bezirksname: 'Mitte',
					WBezArt: 'W',
					Wahlbezirk: '101',
					AghWkr: '074',
					WberIns: '974',
					Waehler: '437',
					Gueltig: '100',
					Unguelt: '2',
					P01: '60',
					P02: '40'
				},
				{
					// Reales Briefwahlbezirk-Adress-Format aus der AGH26-Zweitstimme-CSV
					// (Bezirk 01 Mitte, Briefwahlbezirk "1A").
					Adresse: '01B1A',
					Bezirk: '01',
					Bezirksname: 'Mitte',
					WBezArt: 'B',
					Wahlbezirk: '1A',
					Briefwahlbezirk: '011A',
					Gueltig: '50',
					P01: '30',
					P02: '20'
				}
			])
		);
		const built = buildWbCsvRows(data, legend, 'agh26-zweit');
		assertPartySumMatchesGueltig(
			built.rows,
			['Christlich Demokratische Union Deutschlands', 'Sozialdemokratische Partei Deutschlands'],
			'agh26-zweit'
		);
		const transformed = built.rows.map((r) => transformSbbRow(r, built.headers, 'zweitstimme'));

		const w = transformed.find((t) => t.uwbId === '01W101');
		const b = transformed.find((t) => t.uwbId === '01B1A');

		expect(w).toBeDefined();
		expect(b).toBeDefined();
		expect(w?.istBriefwahl).toBe(false);
		expect(b?.istBriefwahl).toBe(true);
		expect(w?.uwbId).toBe('01W101');
		expect(b?.uwbId).toBe('01B1A');
		expect(w?.gueltig.zweitstimme).toBe(100);
		expect(b?.gueltig.zweitstimme).toBe(50);
		// Review-Fund 23.09.: WberIns/Waehler/Unguelt/AghWkr auch mit Werten
		// ≠ 0 prüfen (nicht nur, dass die Spalten NICHT still 0/'' bleiben).
		expect(w?.wahlberechtigte).toBe(974);
		expect(w?.waehlende).toBe(437);
		expect(w?.ungueltig.zweitstimme).toBe(2);
		expect(w?.wahlkreis).toBe('074');
	});
});

// Matrix-Audit-Nachzug (Punkt 2): I/O-Matrix "BVV lokale Liste" end-to-end.
// P19 in der echten BVV26-DSB-Legende ist "Wählergemeinschaft:
// Antifaschistisches Bündnis Spandau" -- kein partei-seed-Alias, muss also
// über resolveParteiKurzname (innerhalb transformSbbRow/aggregateSbbVotes)
// bei Sonstige landen, nicht stillschweigend verworfen werden.
describe('I/O-Matrix Integration: BVV lokale Liste (buildWbCsvRows -> transformSbbRow)', () => {
	it('lokale Wählergemeinschaft (P19) landet bei Sonstige, bekannte Partei bleibt getrennt', () => {
		const bvvLegend = parseWbLegend(
			[
				'Feldname;Feldinhalt',
				'Adresse;Adresse des Wahlbezirks',
				'P01;Christlich Demokratische Union Deutschlands',
				'P01p;Christlich Demokratische Union Deutschlands in Prozent',
				'P19;Wählergemeinschaft: Antifaschistisches Bündnis Spandau ',
				'P19p;Wählergemeinschaft: Antifaschistisches Bündnis Spandau in Prozent'
			].join('\r\n')
		);
		const header =
			'Adresse;Bezirk;Bezirksname;WBezArt;Wahlbezirk;Gueltig;Unguelt;P01;P01p;P19;P19p';
		const row = '05W100;05;Spandau;W;100;80;0;50;0;30;0';
		const csv = '﻿' + [header, row].join('\r\n');

		const data = parseWbCsvData(csv);
		const built = buildWbCsvRows(data, bvvLegend, 'bvv26-ein');
		assertPartySumMatchesGueltig(
			built.rows,
			[
				'Christlich Demokratische Union Deutschlands',
				'Wählergemeinschaft: Antifaschistisches Bündnis Spandau'
			],
			'bvv26-ein'
		);
		const transformed = built.rows.map((r) => transformSbbRow(r, built.headers, 'einstimme'));

		const bezirk = transformed[0];
		// BVV nutzt den Stimmtyp 'einstimme', der teilt den erststimme-Slot
		// (siehe sbb-row-transformer.ts Kommentar zum Live-Fund 20.09.).
		const cdu = bezirk.votes.erststimme.find((v) => v.parteiKurzname === 'CDU');
		const sonstige = bezirk.votes.erststimme.find((v) => v.parteiKurzname === 'Sonstige');

		expect(cdu?.stimmen).toBe(50);
		expect(sonstige?.stimmen).toBe(30);
		expect(bezirk.gueltig.erststimme).toBe(80);
	});
});
