import { describe, expect, it } from 'vitest';
import { dodgeLevels } from './dodge';

describe('dodgeLevels', () => {
	it('keeps well separated points on the middle line', () => {
		expect(dodgeLevels([0, 20, 40], 4, 5)).toEqual([0, 0, 0]);
	});
	it('alternates up and down for overlapping points', () => {
		expect(dodgeLevels([10, 10, 10], 4, 5)).toEqual([0, 1, -1]);
	});
	it('returns levels in input order', () => {
		expect(dodgeLevels([50, 10, 10.5], 4, 5)).toEqual([0, 0, 1]);
	});
	it('clamps a pile to the outermost level instead of growing past the height', () => {
		const levels = dodgeLevels(Array(9).fill(0), 4, 2) as number[];
		expect(Math.max(...levels.map(Math.abs))).toBe(2);
		expect(levels.filter((l) => Math.abs(l) === 2).length).toBe(6);
	});
	it('ignores missing values (returns null level)', () => {
		expect(dodgeLevels([null, 5], 4, 3)).toEqual([null, 0]);
	});
});

describe('dodgeLevels without cap', () => {
	it('stacks every point when maxLevel is Infinity', () => {
		const levels = dodgeLevels(Array(9).fill(0), 4, Infinity) as number[];
		expect(Math.max(...levels.map(Math.abs))).toBe(4);
		expect(new Set(levels).size).toBe(9);
	});
});
