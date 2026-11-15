import { describe, expect, it } from 'vitest';
import { layoutAxisLabels, trimZeroDecimals } from './axis';

describe('trimZeroDecimals', () => {
	it('drops ,0 when every tick is a whole number', () => {
		expect(trimZeroDecimals(['2,0', '4,0', '14,0'], [2, 4, 14], ',')).toEqual(['2', '4', '14']);
	});
	it('keeps decimals when a tick is fractional', () => {
		expect(trimZeroDecimals(['2,5', '5,0'], [2.5, 5], ',')).toEqual(['2,5', '5,0']);
	});
	it('keeps thousands separators', () => {
		expect(trimZeroDecimals(['0', '10.000', '20.000'], [0, 10000, 20000], ',')).toEqual([
			'0',
			'10.000',
			'20.000'
		]);
		expect(trimZeroDecimals(['1,000', '2,000.0'], [1000, 2000], '.')).toEqual(['1,000', '2,000']);
	});
});

describe('layoutAxisLabels', () => {
	it('anchors the edges inward and keeps all labels when they fit', () => {
		const out = layoutAxisLabels(['0', '50', '100 Punkte'], [0, 150, 300], 300, 6);
		expect(out.map((l) => l.anchor)).toEqual(['start', 'middle', 'end']);
		expect(out.every((l) => l.visible)).toBe(true);
	});
	it('hides a label that would collide with the last label carrying the unit', () => {
		const out = layoutAxisLabels(['2', '4', '12', '14 % der Fläche'], [0, 100, 500, 600], 600, 6);
		expect(out.map((l) => l.visible)).toEqual([true, true, false, true]);
	});
});
