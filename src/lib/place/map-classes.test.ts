import { describe, expect, it } from 'vitest';
import { contrastRatio } from '$lib/data/partei-farben';
import { PLACE_MAP_FILLS, placeMapFill } from './map-classes';

describe('PLACE_MAP_FILLS', () => {
	it('steps clearly in lightness between neighbouring classes', () => {
		for (let i = 1; i < PLACE_MAP_FILLS.length; i++) {
			expect(contrastRatio(PLACE_MAP_FILLS[i - 1], PLACE_MAP_FILLS[i])).toBeGreaterThanOrEqual(1.5);
		}
	});
	it('maps scores to the classes 0-25, 26-50, 51-75, 76-100', () => {
		expect(placeMapFill(25)).toBe(PLACE_MAP_FILLS[0]);
		expect(placeMapFill(26)).toBe(PLACE_MAP_FILLS[1]);
		expect(placeMapFill(75.4)).toBe(PLACE_MAP_FILLS[2]);
		expect(placeMapFill(100)).toBe(PLACE_MAP_FILLS[3]);
	});
	it('uses the no-value grey without a score', () => {
		expect(placeMapFill(null)).not.toBe(PLACE_MAP_FILLS[0]);
	});
});
