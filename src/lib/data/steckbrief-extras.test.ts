import { describe, it, expect } from 'vitest';
import { toSegments, distributionText, countsText } from './steckbrief-extras.js';

describe('toSegments', () => {
	it('sortiert absteigend, kapitalisiert, filtert 0', () => {
		const out = toSegments({ gut: 0.17, mittel: 0.67, schlecht: 0.16, leer: 0 });
		expect(out.map((s) => s.label)).toEqual(['Mittel', 'Gut', 'Schlecht']);
		expect(out[0].share).toBeCloseTo(0.67);
	});
	it('null/leeres Objekt → []', () => {
		expect(toSegments(null)).toEqual([]);
		expect(toSegments({})).toEqual([]);
	});
});

describe('distributionText', () => {
	it('rendert Prozent-Text', () => {
		expect(
			distributionText([
				{ label: 'Mittel', share: 0.67 },
				{ label: 'Gut', share: 0.33 }
			])
		).toBe('Mittel 67% · Gut 33%');
	});
});

describe('countsText', () => {
	it('filtert null/0, formatiert', () => {
		expect(
			countsText([
				['U', 3],
				['S', 0],
				['Tram', null],
				['Bus', 12]
			])
		).toBe('U 3 · Bus 12');
	});
	it('leer wenn nichts > 0', () => {
		expect(countsText([['U', 0]])).toBe('');
	});
});
