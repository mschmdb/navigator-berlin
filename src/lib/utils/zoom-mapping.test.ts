import { describe, expect, it } from 'vitest';
import { matchZoomForType } from './zoom-mapping.js';

describe('matchZoomForType', () => {
	it('house → 17', () => {
		expect(matchZoomForType('house')).toBe(17);
	});

	it('road → 16', () => {
		expect(matchZoomForType('road')).toBe(16);
	});

	it('suburb / neighbourhood → 14 (Kiez)', () => {
		expect(matchZoomForType('suburb')).toBe(14);
		expect(matchZoomForType('neighbourhood')).toBe(14);
	});

	it('city_district → 12 (Bezirk)', () => {
		expect(matchZoomForType('city_district')).toBe(12);
	});

	it('postcode → 13', () => {
		expect(matchZoomForType('postcode')).toBe(13);
	});

	it('city → 11', () => {
		expect(matchZoomForType('city')).toBe(11);
	});

	it('state → 9', () => {
		expect(matchZoomForType('state')).toBe(9);
	});

	it('unbekannt → 14 Default', () => {
		expect(matchZoomForType('foo-bar')).toBe(14);
		expect(matchZoomForType('')).toBe(14);
	});
});
