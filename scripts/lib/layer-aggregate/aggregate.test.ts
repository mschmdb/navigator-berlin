import { describe, expect, it } from 'vitest';
import { aggregateNumericMedian } from './aggregate-numeric-median.js';
import { aggregateOrdinalDistribution } from './aggregate-ordinal-distribution.js';
import { aggregateCoverageShare } from './aggregate-coverage-share.js';
import { aggregateAreaShare } from './aggregate-area-share.js';

describe('aggregateNumericMedian', () => {
	it('Median ungerade Anzahl', () => {
		const r = aggregateNumericMedian([10, 30, 20]);
		expect(r.median).toBe(20);
		expect(r.min).toBe(10);
		expect(r.max).toBe(30);
	});

	it('Median gerade Anzahl = Mittel der beiden mittleren', () => {
		expect(aggregateNumericMedian([10, 20, 30, 40]).median).toBe(25);
	});

	it('rundet auf 1 Dezimal', () => {
		expect(aggregateNumericMedian([1, 2, 2]).median).toBe(2);
		expect(aggregateNumericMedian([1.04, 1.06]).median).toBe(1.1);
	});

	it('unter 50% non-null → median null + below-threshold-Marker', () => {
		const r = aggregateNumericMedian([5, null, null, null]);
		expect(r.median).toBeNull();
		expect(r.coverage).toContain('below-50%-threshold');
		expect(r.contributingMembers).toBe(1);
		expect(r.totalMembers).toBe(4);
	});

	it('exakt 50% Coverage zählt als ausreichend (>=)', () => {
		const r = aggregateNumericMedian([10, 20, null, null]);
		expect(r.median).toBe(15);
	});

	it('leere Member → median null, kein Crash', () => {
		expect(aggregateNumericMedian([]).median).toBeNull();
	});
});

describe('aggregateOrdinalDistribution', () => {
	it('Histogramm + Shares (% der Beitragenden) + dominant', () => {
		const r = aggregateOrdinalDistribution(['hoch', 'hoch', 'mittel', 'gering']);
		expect(r.dominant).toBe('hoch');
		const hoch = r.classes.find((c) => c.label === 'hoch');
		expect(hoch?.share).toBe(50);
	});

	it('classOrder bestimmt Klassen-Reihenfolge (Determinismus)', () => {
		const order = ['gering', 'mittel', 'hoch'];
		const r = aggregateOrdinalDistribution(['hoch', 'gering', 'mittel'], order);
		expect(r.classes.map((c) => c.label)).toEqual(['gering', 'mittel', 'hoch']);
	});

	it('ohne classOrder: Share desc, dann Label alphabetisch', () => {
		const r = aggregateOrdinalDistribution(['b', 'a', 'a', 'b', 'c']);
		expect(r.classes[0].share).toBe(40);
		expect(
			r.classes
				.map((c) => c.label)
				.slice(0, 2)
				.sort()
		).toEqual(['a', 'b']);
	});

	it('unter 50% → leere Verteilung + Marker', () => {
		const r = aggregateOrdinalDistribution(['hoch', null, null, null]);
		expect(r.classes).toEqual([]);
		expect(r.dominant).toBeNull();
		expect(r.coverage).toContain('below-50%-threshold');
	});

	it('dominant Tie-Break alphabetisch deterministisch', () => {
		expect(aggregateOrdinalDistribution(['b', 'a']).dominant).toBe('a');
	});
});

describe('aggregateCoverageShare', () => {
	it('Anteil = hitArea/polygonArea * 100', () => {
		expect(aggregateCoverageShare(250, 1000).share).toBe(25);
	});
	it('clamped 0-100', () => {
		expect(aggregateCoverageShare(1500, 1000).share).toBe(100);
		expect(aggregateCoverageShare(-5, 1000).share).toBe(0);
	});
	it('polygonArea<=0 → 0 ohne Crash', () => {
		expect(aggregateCoverageShare(100, 0).share).toBe(0);
	});
});

describe('aggregateAreaShare', () => {
	it('Anteil = featureArea/polygonArea * 100, gerundet', () => {
		expect(aggregateAreaShare(333, 1000).share).toBe(33.3);
	});
	it('polygonArea<=0 → 0', () => {
		expect(aggregateAreaShare(100, 0).share).toBe(0);
	});
});

describe('Determinismus', () => {
	it('ordinal-distribution: zwei Läufe identisch trotz Input-Permutation', () => {
		const a = aggregateOrdinalDistribution(['hoch', 'mittel', 'hoch', 'gering']);
		const b = aggregateOrdinalDistribution(['gering', 'hoch', 'hoch', 'mittel']);
		expect(JSON.stringify(a)).toBe(JSON.stringify(b));
	});
});
