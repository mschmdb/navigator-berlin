import { describe, expect, it } from 'vitest';
import { mean, median, rankOf } from './stats';

describe('median', () => {
	it('ignores null and returns the middle value', () => {
		expect(median([3, null, 1, 2])).toBe(2);
	});
	it('averages the two middle values for even counts', () => {
		expect(median([1, 2, 3, 4])).toBe(2.5);
	});
	it('returns null without values', () => {
		expect(median([null, null])).toBeNull();
		expect(median([])).toBeNull();
	});
	it('returns 0 when most values are 0 (Wohnschutz case)', () => {
		expect(median([0, 0, 0, 90, 40])).toBe(0);
	});
});

describe('mean', () => {
	it('ignores null', () => {
		expect(mean([2, null, 4])).toBe(3);
	});
	it('returns null without values', () => {
		expect(mean([null])).toBeNull();
	});
});

describe('rankOf', () => {
	it('ranks descending, place 1 is the highest value', () => {
		expect(rankOf(9, [1, 9, 5])).toEqual({ rang: 1, total: 3 });
		expect(rankOf(1, [1, 9, 5])).toEqual({ rang: 3, total: 3 });
	});
	it('gives ties the same place (competition ranking)', () => {
		expect(rankOf(5, [9, 5, 5, 1])).toEqual({ rang: 2, total: 4 });
		expect(rankOf(1, [9, 5, 5, 1])).toEqual({ rang: 4, total: 4 });
	});
	it('counts only present values in total', () => {
		expect(rankOf(5, [5, null, 3])).toEqual({ rang: 1, total: 2 });
	});
	it('returns null for a missing own value', () => {
		expect(rankOf(null, [1, 2])).toBeNull();
	});
});

import { countBelow, spread } from './stats';

describe('countBelow', () => {
	it('counts strictly lower present values', () => {
		expect(countBelow(5, [1, 5, 7, null, 3])).toBe(2);
		expect(countBelow(null, [1])).toBeNull();
	});
});

describe('spread', () => {
	it('returns min and max item with range', () => {
		const items = [
			{ name: 'A', v: 28.4 },
			{ name: 'B', v: 57.4 },
			{ name: 'C', v: null }
		];
		const s = spread(items, (i) => i.v);
		expect(s?.min.name).toBe('A');
		expect(s?.max.name).toBe('B');
		expect(s?.range).toBeCloseTo(29);
	});
	it('returns null with fewer than two values', () => {
		expect(spread([{ v: 1 }], (i) => i.v)).toBeNull();
	});
});

import { niceDomain } from './stats';

describe('niceDomain', () => {
	it('rounds outward to the step', () => {
		expect(niceDomain([6.2, 9.8, null], 1)).toEqual([6, 10]);
		expect(niceDomain([0, 87.3], 10)).toEqual([0, 90]);
	});
	it('falls back to [0, step] without values', () => {
		expect(niceDomain([], 5)).toEqual([0, 5]);
	});
});
