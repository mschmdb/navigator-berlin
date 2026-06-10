import { describe, expect, it } from 'vitest';
import {
	buildBrIndex,
	combineIndex,
	DEFAULT_DELIKT_WEIGHTS,
	meanByDelikt,
	threeYearMean
} from './aggregate.js';
import { DEFAULT_DELIKTE, type BrHzRow } from './parse-xlsx.js';

describe('threeYearMean', () => {
	it('mittelt über vorhandene Werte', () => {
		expect(threeYearMean([10, 20, 30])).toBe(20);
	});

	it('überspringt null-Jahrgänge', () => {
		expect(threeYearMean([10, null, 30])).toBe(20);
		expect(threeYearMean([null, null, 30])).toBe(30);
	});

	it('liefert null, wenn alle Werte fehlen', () => {
		expect(threeYearMean([null, null, null])).toBeNull();
		expect(threeYearMean([])).toBeNull();
	});
});

describe('DEFAULT_DELIKT_WEIGHTS', () => {
	it('summiert zu 1.0 über das Default-Set', () => {
		const sum = DEFAULT_DELIKTE.reduce((acc, d) => acc + (DEFAULT_DELIKT_WEIGHTS[d.key] ?? 0), 0);
		expect(sum).toBeCloseTo(1, 10);
	});
});

describe('combineIndex', () => {
	it('bildet den gewichteten Mittelwert über alle Delikte', () => {
		const weights = { a: 0.5, b: 0.5 };
		expect(combineIndex({ a: 100, b: 200 }, weights)).toBe(150);
	});

	it('renormalisiert über vorhandene Delikte (null wird übersprungen)', () => {
		const weights = { a: 0.5, b: 0.5 };
		// nur a vorhanden -> Gewicht renormalisiert auf 1.0
		expect(combineIndex({ a: 100, b: null }, weights)).toBe(100);
	});

	it('liefert null, wenn alle Delikte fehlen', () => {
		const weights = { a: 0.5, b: 0.5 };
		expect(combineIndex({ a: null, b: null }, weights)).toBeNull();
	});
});

function row(bzrId: string, name: string, hz: Record<string, number | null>): BrHzRow {
	return { bzrId, name, hz };
}

describe('meanByDelikt', () => {
	it('mittelt jede Delikt-Spalte über drei Jahrgänge je BR', () => {
		const y1 = [row('011001', 'Tiergarten Süd', { kieztaten: 6000, fahrraddiebstahl: 400 })];
		const y2 = [row('011001', 'Tiergarten Süd', { kieztaten: 6300, fahrraddiebstahl: 410 })];
		const y3 = [row('011001', 'Tiergarten Süd', { kieztaten: 6600, fahrraddiebstahl: 420 })];
		const result = meanByDelikt([y1, y2, y3]);
		expect(result).toHaveLength(1);
		expect(result[0].bzrId).toBe('011001');
		expect(result[0].meanHz.kieztaten).toBe(6300);
		expect(result[0].meanHz.fahrraddiebstahl).toBe(410);
	});

	it('behandelt null-Delikt über Jahrgänge korrekt', () => {
		const y1 = [row('011002', 'Regierungsviertel', { kieztaten: 5000, strassenraub: null })];
		const y2 = [row('011002', 'Regierungsviertel', { kieztaten: 5200, strassenraub: 100 })];
		const y3 = [row('011002', 'Regierungsviertel', { kieztaten: 5400, strassenraub: null })];
		const result = meanByDelikt([y1, y2, y3]);
		expect(result[0].meanHz.kieztaten).toBe(5200);
		expect(result[0].meanHz.strassenraub).toBe(100); // nur ein Jahr vorhanden
	});

	it('verkraftet ein leeres Jahrgangs-Set ohne Crash', () => {
		expect(meanByDelikt([])).toEqual([]);
		expect(meanByDelikt([[], [], []])).toEqual([]);
	});
});

describe('buildBrIndex', () => {
	it('liefert pro BR Index + Roh-HZ', () => {
		const y = (k: number, f: number): BrHzRow[] => [
			row('011001', 'Tiergarten Süd', {
				kieztaten: k,
				wohnraumeinbruch: 100,
				sachbeschaedigung: 900,
				strassenraub: 300,
				fahrraddiebstahl: f
			})
		];
		const records = buildBrIndex([y(6000, 400), y(6000, 400), y(6000, 400)], DEFAULT_DELIKTE, DEFAULT_DELIKT_WEIGHTS);
		expect(records).toHaveLength(1);
		expect(records[0].bzrId).toBe('011001');
		expect(records[0].name).toBe('Tiergarten Süd');
		// gleichgewichteter Mittelwert der fünf Delikte
		expect(records[0].index).toBeCloseTo((6000 + 100 + 900 + 300 + 400) / 5, 6);
		expect(records[0].delikteHz.kieztaten).toBe(6000);
	});

	it('setzt index = null, wenn alle Delikte einer BR fehlen', () => {
		const allNull = { kieztaten: null, wohnraumeinbruch: null, sachbeschaedigung: null, strassenraub: null, fahrraddiebstahl: null };
		const r = [row('011009', 'Leer', allNull)];
		const records = buildBrIndex([r, r, r], DEFAULT_DELIKTE, DEFAULT_DELIKT_WEIGHTS);
		expect(records[0].index).toBeNull();
	});
});
