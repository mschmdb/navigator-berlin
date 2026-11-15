import { describe, expect, it } from 'vitest';
import { classifyDiff, compareSentence, dimDiffs, joinDe } from './compare-text';

const label = (d: string) => ({ a: 'Kultur', b: 'Wohnschutz', c: 'Grün & Hitze', d: 'Mobilität' })[d] ?? d;

describe('joinDe', () => {
	it('joins with commas and "und"', () => {
		expect(joinDe([])).toBe('');
		expect(joinDe(['A'])).toBe('A');
		expect(joinDe(['A', 'B'])).toBe('A und B');
		expect(joinDe(['A', 'B', 'C'])).toBe('A, B und C');
	});
});

describe('classifyDiff', () => {
	it('uses a 5-point band for "etwa gleich"', () => {
		expect(classifyDiff(5)).toBe('hoeher');
		expect(classifyDiff(4.9)).toBe('gleich');
		expect(classifyDiff(-4.9)).toBe('gleich');
		expect(classifyDiff(-5)).toBe('niedriger');
	});
});

describe('dimDiffs', () => {
	it('skips dimensions without own or reference value', () => {
		const out = dimDiffs(['a', 'b', 'c'], { a: 10, b: null, c: 3 }, { a: 4, b: 2, c: null });
		expect(out).toEqual([{ dim: 'a', own: 10, ref: 4, diff: 6 }]);
	});
});

describe('compareSentence', () => {
	it('names higher and lower dims sorted by size, with signed points', () => {
		const diffs = dimDiffs(
			['a', 'b', 'c', 'd'],
			{ a: 98.8, b: 90.2, c: 26.4, d: 29.9 },
			{ a: 41.7, b: 0, c: 55.2, d: 25.9 }
		);
		expect(compareSentence(diffs, label, 'Berlin')).toBe(
			'Gegenüber Berlin höher bei Wohnschutz (+90) und Kultur (+57), niedriger bei Grün & Hitze (−29). Etwa gleich: Mobilität.'
		);
	});
	it('handles a reference that is equal everywhere', () => {
		const diffs = dimDiffs(['a'], { a: 50 }, { a: 52 });
		expect(compareSentence(diffs, label, 'Berlin')).toBe('Gegenüber Berlin etwa gleich bei Kultur.');
	});
	it('returns an empty string without comparable dims', () => {
		expect(compareSentence([], label, 'Berlin')).toBe('');
	});
});
