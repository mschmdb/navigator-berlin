import { describe, expect, it } from 'vitest';
import { dodgeLevels, layoutLabelLanes } from './dodge';

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

describe('layoutLabelLanes', () => {
	it('puts non-overlapping labels in lane 0', () => {
		expect(
			layoutLabelLanes(
				[
					{ x: 0, width: 40 },
					{ x: 100, width: 40 }
				],
				2,
				4
			)
		).toEqual([0, 0]);
	});
	it('moves a colliding label into the next free lane', () => {
		expect(
			layoutLabelLanes(
				[
					{ x: 0, width: 60 },
					{ x: 30, width: 60 }
				],
				2,
				4
			)
		).toEqual([0, 1]);
	});
	it('hides a label (null) when all lanes are taken', () => {
		expect(
			layoutLabelLanes(
				[
					{ x: 0, width: 60 },
					{ x: 10, width: 60 },
					{ x: 20, width: 60 }
				],
				2,
				4
			)
		).toEqual([0, 1, null]);
	});
});
