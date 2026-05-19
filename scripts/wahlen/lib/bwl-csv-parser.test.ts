import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
	isMetadataLine,
	isHeaderLine,
	stripBom,
	parseBwlWbzCsv,
	filterByLand,
	BERLIN_LAND_CODE,
	BERLIN_WAHLKREISE_BTW25
} from './bwl-csv-parser.js';

const here = dirname(fileURLToPath(import.meta.url));
const fixturePath = join(here, '..', '..', '..', 'tests', 'fixtures', 'wahlen', 'btw25-sample.csv');

async function loadFixture(): Promise<string> {
	return readFile(fixturePath, 'utf-8');
}

describe('bwl-csv-parser', () => {
	describe('stripBom', () => {
		it('strippt UTF-8 BOM am String-Start', () => {
			expect(stripBom('﻿hello')).toBe('hello');
		});

		it('lässt String ohne BOM unverändert', () => {
			expect(stripBom('hello')).toBe('hello');
		});

		it('strippt nur am Anfang, nicht mittendrin', () => {
			expect(stripBom('a﻿b')).toBe('a﻿b');
		});
	});

	describe('isMetadataLine', () => {
		it('erkennt Copyright-Zeile', () => {
			expect(isMetadataLine('(c) Die Bundeswahlleiterin (im Auftrag der Herausgebergemeinschaft)')).toBe(
				true
			);
		});

		it('erkennt Title-Zeile (Ergebnisse der Wahlbezirksstatistik)', () => {
			expect(isMetadataLine('Ergebnisse der Wahlbezirksstatistik zur Bundestagswahl 2025')).toBe(true);
		});

		it('erkennt komplett leere Zeile', () => {
			expect(isMetadataLine('')).toBe(true);
		});

		it('erkennt Zeile aus nur Semikola', () => {
			expect(isMetadataLine(';;;;;;;')).toBe(true);
		});

		it('keine Metadaten-Zeile bei Header', () => {
			expect(
				isMetadataLine(
					'Wahlkreis;Land;Regierungsbezirk;Kreis;Verbandsgemeinde;Gemeinde;Kennziffer Urnenwahlbezirke nach § 68 BWO'
				)
			).toBe(false);
		});

		it('keine Metadaten-Zeile bei Daten-Row', () => {
			expect(isMetadataLine('001;01;0;01;0000;000;0000;00;Flensburg, Stadt;000001')).toBe(false);
		});
	});

	describe('isHeaderLine', () => {
		it('erkennt Header anhand Wahlkreis;Land;-Prefix', () => {
			expect(isHeaderLine('Wahlkreis;Land;Regierungsbezirk;Kreis')).toBe(true);
		});

		it('erkennt Header case-insensitive', () => {
			expect(isHeaderLine('wahlkreis;land;regierungsbezirk')).toBe(true);
		});

		it('verweigert Daten-Row', () => {
			expect(isHeaderLine('001;01;0;01;0000;000;0000;00;Flensburg, Stadt;000001')).toBe(false);
		});

		it('verweigert leere Zeile', () => {
			expect(isHeaderLine('')).toBe(false);
		});
	});

	describe('parseBwlWbzCsv', () => {
		it('parsed Header + alle Daten-Rows aus Fixture', async () => {
			const csv = await loadFixture();
			const result = parseBwlWbzCsv(csv);
			expect(result.headers.length).toBeGreaterThan(70);
			expect(result.headers[0]).toBe('Wahlkreis');
			expect(result.headers[1]).toBe('Land');
			expect(result.headers[9]).toBe('Wahlbezirk');
			expect(result.rows.length).toBe(5);
		});

		it('strippt BOM aus erstem Column-Header', async () => {
			const csv = await loadFixture();
			const result = parseBwlWbzCsv(csv);
			expect(result.headers[0]).toBe('Wahlkreis');
			expect(result.headers[0].charCodeAt(0)).toBe('W'.charCodeAt(0));
		});

		it('liest Wahlkreis-Spalte als String, behält führende Nullen', async () => {
			const csv = await loadFixture();
			const result = parseBwlWbzCsv(csv);
			const firstBerlin = result.rows.find((r) => r.Land === '11');
			expect(firstBerlin?.Wahlkreis).toBe('074');
		});

		it('liefert Metadaten-Lines im meta-Feld', async () => {
			const csv = await loadFixture();
			const result = parseBwlWbzCsv(csv);
			expect(result.meta.copyrightLine).toContain('Bundeswahlleiterin');
			expect(result.meta.titleLine).toContain('Wahlbezirksstatistik');
			expect(result.meta.metadataLineCount).toBeGreaterThanOrEqual(1);
		});

		it('wirft bei CSV ohne erkennbaren Header', () => {
			expect(() => parseBwlWbzCsv('foo;bar;baz\n1;2;3')).toThrow(/header/i);
		});
	});

	describe('filterByLand', () => {
		it('liefert nur Berlin-Rows (Land=11)', async () => {
			const csv = await loadFixture();
			const result = parseBwlWbzCsv(csv);
			const berlin = filterByLand(result.rows, BERLIN_LAND_CODE);
			expect(berlin.length).toBe(3);
			expect(berlin.every((r) => r.Land === '11')).toBe(true);
		});

		it('liefert leeres Array bei unbekanntem Land', async () => {
			const csv = await loadFixture();
			const result = parseBwlWbzCsv(csv);
			expect(filterByLand(result.rows, '99')).toEqual([]);
		});
	});

	describe('BERLIN_WAHLKREISE_BTW25', () => {
		it('enthält 12 Wahlkreise (074-085)', () => {
			expect(BERLIN_WAHLKREISE_BTW25.length).toBe(12);
			expect(BERLIN_WAHLKREISE_BTW25[0]).toBe('074');
			expect(BERLIN_WAHLKREISE_BTW25[11]).toBe('085');
		});
	});
});
