import { describe, expect, it } from 'vitest';
import { viewportFromUrl } from './viewport-from-url.js';
import { BERLIN_BBOX_ARRAY, BERLIN_CENTER, DEFAULT_ZOOM } from '$lib/data/constants.js';

describe('viewportFromUrl', () => {
	it('Defaults bei leerer URL', () => {
		const v = viewportFromUrl(new URL('https://navigator.berlin/'));
		expect(v.initialBbox).toEqual(BERLIN_BBOX_ARRAY);
		expect(v.initialCenter).toEqual(BERLIN_CENTER);
		expect(v.initialZoom).toBe(DEFAULT_ZOOM);
	});

	it('bbox + zoom aus URL', () => {
		const u = new URL('https://navigator.berlin/?bbox=13.4,52.5,13.5,52.55&zoom=14.5');
		const v = viewportFromUrl(u);
		expect(v.initialBbox).toEqual([13.4, 52.5, 13.5, 52.55]);
		expect(v.initialZoom).toBeCloseTo(14.5, 2);
	});

	it('center aus URL', () => {
		const u = new URL('https://navigator.berlin/?center=13.377,52.516&zoom=15');
		const v = viewportFromUrl(u);
		expect(v.initialCenter).toEqual([13.377, 52.516]);
		expect(v.initialZoom).toBe(15);
	});

	it('invalid bbox → Default', () => {
		const u = new URL('https://navigator.berlin/?bbox=foo');
		const v = viewportFromUrl(u);
		expect(v.initialBbox).toEqual(BERLIN_BBOX_ARRAY);
	});
});
