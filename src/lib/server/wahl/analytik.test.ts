import { describe, it, expect } from 'vitest';
import {
	computeWechsel,
	computeTrendSlope,
	computeVolatilitaet,
	computeSimilarity,
	type SeriesEntry
} from './analytik.js';

function entry(
	jahr: number,
	shares: Record<string, number>,
	repeat?: { parentJahr: number }
): SeriesEntry {
	return {
		jahr,
		isRepeatElection: repeat !== undefined,
		parentJahr: repeat?.parentJahr ?? null,
		shares: new Map(Object.entries(shares))
	};
}

describe('computeWechsel', () => {
	it('zählt Wechsel der stärksten Partei über Legislaturen', () => {
		const points = [
			entry(2011, { SPD: 0.4, CDU: 0.3 }),
			entry(2016, { SPD: 0.35, CDU: 0.3 }),
			entry(2021, { CDU: 0.4, SPD: 0.3 })
		];
		expect(computeWechsel(points)).toEqual({ wechselCount: 1, wechselJahre: [2021] });
	});

	it('zählt keine Wechsel ohne Führungswechsel', () => {
		const points = [
			entry(2011, { SPD: 0.4, CDU: 0.3 }),
			entry(2016, { SPD: 0.45, CDU: 0.25 }),
			entry(2021, { SPD: 0.5, CDU: 0.2 })
		];
		expect(computeWechsel(points)).toEqual({ wechselCount: 0, wechselJahre: [] });
	});

	it('Wiederholungswahl ersetzt Eltern-Jahr: 2021→2023 zählt nie als eigener Wechsel', () => {
		const points = [
			entry(2016, { SPD: 0.4, CDU: 0.2 }),
			entry(2021, { SPD: 0.35, CDU: 0.3 }),
			entry(2023, { CDU: 0.4, SPD: 0.3 }, { parentJahr: 2021 })
		];
		// Effektive Reihe: 2016 SPD -> 2023 (ersetzt 2021) CDU. Genau ein Wechsel, am Jahr 2023.
		expect(computeWechsel(points)).toEqual({ wechselCount: 1, wechselJahre: [2023] });
	});

	it('Wiederholungswahl mit gleichem Sieger erzeugt keinen Wechsel', () => {
		const points = [
			entry(2016, { SPD: 0.3, CDU: 0.4 }),
			entry(2021, { SPD: 0.35, CDU: 0.45 }),
			entry(2023, { SPD: 0.3, CDU: 0.5 }, { parentJahr: 2021 })
		];
		expect(computeWechsel(points)).toEqual({ wechselCount: 0, wechselJahre: [] });
	});

	it('löst Anteils-Gleichstände deterministisch alphabetisch auf, unabhängig von der Map-Reihenfolge', () => {
		const einlesereihenfolgeA = [
			entry(2016, { Zebra: 0.4, Alpha: 0.4 }),
			entry(2021, { Alpha: 0.5, Zebra: 0.3 })
		];
		const einlesereihenfolgeB = [
			entry(2016, { Alpha: 0.4, Zebra: 0.4 }),
			entry(2021, { Alpha: 0.5, Zebra: 0.3 })
		];
		// Gleichstand 2016: alphabetisch gewinnt Alpha, 2021 ebenfalls Alpha -> kein Wechsel,
		// egal in welcher Reihenfolge die Shares eingelesen wurden.
		expect(computeWechsel(einlesereihenfolgeA)).toEqual({ wechselCount: 0, wechselJahre: [] });
		expect(computeWechsel(einlesereihenfolgeB)).toEqual({ wechselCount: 0, wechselJahre: [] });
	});

	it('leere oder Ein-Punkt-Reihe ergibt keinen Wechsel', () => {
		expect(computeWechsel([])).toEqual({ wechselCount: 0, wechselJahre: [] });
		expect(computeWechsel([entry(2021, { SPD: 0.4 })])).toEqual({
			wechselCount: 0,
			wechselJahre: []
		});
	});
});

describe('computeTrendSlope', () => {
	it('berechnet die Steigung der linearen Regression', () => {
		const points = [
			entry(2011, { GRÜNE: 0.1 }),
			entry(2016, { GRÜNE: 0.2 }),
			entry(2021, { GRÜNE: 0.3 })
		];
		expect(computeTrendSlope(points, 'GRÜNE')).toBeCloseTo(0.02, 10);
	});

	it('liefert 0 für fallende Datenpunkte mit korrektem Vorzeichen', () => {
		const points = [entry(2011, { AfD: 0.3 }), entry(2021, { AfD: 0.1 })];
		expect(computeTrendSlope(points, 'AfD')).toBeCloseTo(-0.02, 10);
	});

	it('liefert 0 mit weniger als 2 Datenpunkten für die Partei', () => {
		const points = [entry(2011, { SPD: 0.3 })];
		expect(computeTrendSlope(points, 'SPD')).toBe(0);
		expect(computeTrendSlope([], 'SPD')).toBe(0);
	});

	it('ignoriert Jahre ohne Anteil für die Partei', () => {
		const points = [
			entry(2011, { SPD: 0.3 }),
			entry(2016, { CDU: 0.4 }),
			entry(2021, { SPD: 0.5 })
		];
		expect(computeTrendSlope(points, 'SPD')).toBeCloseTo(0.02, 10);
	});

	it('nutzt die effektive Reihe bei Wiederholungswahlen', () => {
		const points = [
			entry(2016, { CDU: 0.2 }),
			entry(2021, { CDU: 0.3 }),
			entry(2023, { CDU: 0.5 }, { parentJahr: 2021 })
		];
		// effektiv: 2016 -> 0.2, 2023 -> 0.5 (2021 verworfen)
		expect(computeTrendSlope(points, 'CDU')).toBeCloseTo((0.5 - 0.2) / (2023 - 2016), 10);
	});
});

describe('computeVolatilitaet', () => {
	it('berechnet den mittleren Pedersen-Index (halbe L1-Distanz) aufeinanderfolgender Vektoren', () => {
		const points = [
			entry(2011, { A: 0.5, B: 0.5 }),
			entry(2016, { A: 0.6, B: 0.4 }),
			entry(2021, { A: 0.6, B: 0.4 })
		];
		// Transition 1: (|0.6-0.5|+|0.4-0.5|) / 2 = 0.1; Transition 2: 0
		expect(computeVolatilitaet(points)).toBeCloseTo(0.05, 10);
	});

	it('liefert 0 mit weniger als 2 Legislaturen', () => {
		expect(computeVolatilitaet([])).toBe(0);
		expect(computeVolatilitaet([entry(2021, { A: 1 })])).toBe(0);
	});

	it('mergt Wiederholungswahlen vor der Distanz-Berechnung', () => {
		const points = [
			entry(2016, { A: 0.5, B: 0.5 }),
			entry(2021, { A: 0.9, B: 0.1 }),
			entry(2023, { A: 0.6, B: 0.4 }, { parentJahr: 2021 })
		];
		// effektiv: 2016 {0.5,0.5} -> 2023 {0.6,0.4}: Pedersen = 0.2 / 2, ein Übergang
		expect(computeVolatilitaet(points)).toBeCloseTo(0.1, 10);
	});
});

describe('computeSimilarity', () => {
	it('liefert 100 für identische Vektoren', () => {
		const a = new Map([
			['A', 0.5],
			['B', 0.5]
		]);
		expect(computeSimilarity(a, a)).toBe(100);
	});

	it('liefert 0 für maximal unähnliche Vektoren', () => {
		const a = new Map([
			['A', 1],
			['B', 0]
		]);
		const b = new Map([
			['A', 0],
			['B', 1]
		]);
		expect(computeSimilarity(a, b)).toBe(0);
	});

	it('liefert einen Zwischenwert proportional zur L1-Distanz', () => {
		const a = new Map([
			['A', 0.6],
			['B', 0.4]
		]);
		const b = new Map([
			['A', 0.5],
			['B', 0.5]
		]);
		// L1 = 0.2, normiert 0.1 -> score 90
		expect(computeSimilarity(a, b)).toBe(90);
	});

	it('behandelt fehlende Parteien in einem Vektor als 0', () => {
		const a = new Map([['A', 1]]);
		const b = new Map([
			['A', 0.5],
			['B', 0.5]
		]);
		// L1 = |1-0.5| + |0-0.5| = 1.0, normiert 0.5 -> score 50
		expect(computeSimilarity(a, b)).toBe(50);
	});
});
