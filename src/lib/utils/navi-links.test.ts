import { describe, expect, it } from 'vitest';
import { buildNaviLinks } from './navi-links.js';

describe('buildNaviLinks', () => {
	it('Google-Deeplink mit destination=lat,lng', () => {
		expect(buildNaviLinks(52.52, 13.405).googleMapsUrl).toBe(
			'https://www.google.com/maps/dir/?api=1&destination=52.52,13.405'
		);
	});

	it('Apple-Deeplink mit daddr=lat,lng', () => {
		expect(buildNaviLinks(52.52, 13.405).appleMapsUrl).toBe(
			'https://maps.apple.com/?daddr=52.52,13.405'
		);
	});

	it('rundet nicht, übernimmt Koordinaten unverändert', () => {
		expect(buildNaviLinks(52.5461978, 13.2059831).googleMapsUrl).toContain(
			'52.5461978,13.2059831'
		);
	});
});
