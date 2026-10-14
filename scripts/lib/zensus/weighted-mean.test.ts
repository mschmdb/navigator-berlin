import { describe, expect, it } from 'vitest';
import {
	MIN_WOHNUNGEN,
	addCell,
	createAccumulator,
	mergeAccumulators,
	weightedMean
} from './weighted-mean.js';

describe('weightedMean', () => {
	it('gewichtet mit der Wohnungszahl: 10 x 90 und 20 x 10 ergeben 11,00', () => {
		const acc = createAccumulator();
		addCell(acc, 10, 90);
		addCell(acc, 20, 10);
		expect(weightedMean(acc)).toBe(11);
	});

	it('gibt null bei 0 vermieteten Wohnungen', () => {
		expect(weightedMean(createAccumulator())).toBeNull();
	});

	it('gibt null bei 29 Wohnungen (unter Schwelle)', () => {
		const acc = createAccumulator();
		addCell(acc, 8, MIN_WOHNUNGEN - 1);
		expect(weightedMean(acc)).toBeNull();
	});

	it('gibt den Wert bei genau 30 Wohnungen', () => {
		const acc = createAccumulator();
		addCell(acc, 8, MIN_WOHNUNGEN);
		expect(weightedMean(acc)).toBe(8);
	});

	it('rundet auf 2 Nachkommastellen', () => {
		const acc = createAccumulator();
		addCell(acc, 7, 1);
		addCell(acc, 8, 2);
		addCell(acc, 9, 30);
		expect(weightedMean(acc)).toBe(8.88);
	});

	it('Kiez-Aggregat: Merge zweier Planungsraeume ist gewichtet, kein Median', () => {
		const a = createAccumulator();
		addCell(a, 10, 90);
		const b = createAccumulator();
		addCell(b, 20, 10);
		expect(weightedMean(mergeAccumulators([a, b]))).toBe(11);
	});

	it('Kiez rechnet Planungsraeume unter der Schwelle mit ein', () => {
		const klein = createAccumulator();
		addCell(klein, 20, 10);
		expect(weightedMean(klein)).toBeNull();
		const gross = createAccumulator();
		addCell(gross, 10, 90);
		expect(weightedMean(mergeAccumulators([klein, gross]))).toBe(11);
	});

	it('KLAMMERN-Zellen gehen ins Mittel ein, wenn eine sichere Zelle dabei ist', () => {
		const acc = createAccumulator();
		addCell(acc, 10, 90);
		addCell(acc, 20, 10, true);
		expect(weightedMean(acc)).toBe(11);
	});

	it('nur KLAMMERN-Zellen: Anzeigewert null, Summen bleiben fuer Kiez/Bezirk', () => {
		const acc = createAccumulator();
		addCell(acc, 9, 40, true);
		expect(weightedMean(acc)).toBeNull();
		expect(acc.wohnungen).toBe(40);
		const sicher = createAccumulator();
		addCell(sicher, 11, 60);
		expect(weightedMean(mergeAccumulators([acc, sicher]))).toBe(10.2);
	});

	it('ignoriert Zellen mit 0 Wohnungen', () => {
		const acc = createAccumulator();
		addCell(acc, 99, 0);
		expect(acc.wohnungen).toBe(0);
	});
});
