import { describe, expect, it } from 'vitest';
import { buildNaviLinks } from './navi-links.js';

describe('buildNaviLinks', () => {
	it('liefert genau die zwei URL-Formen mit lat,lon-Reihenfolge', () => {
		const links = buildNaviLinks(52.5343784, 13.3596231);
		expect(links.googleMapsUrl).toBe(
			'https://www.google.com/maps/dir/?api=1&destination=52.5343784,13.3596231'
		);
		expect(links.appleMapsUrl).toBe('https://maps.apple.com/?daddr=52.5343784,13.3596231');
	});

	it('setzt Koordinaten unverändert ein, ohne Rundungs-Drift', () => {
		const links = buildNaviLinks(-0.5, 13.100001);
		expect(links.googleMapsUrl).toContain('destination=-0.5,13.100001');
		expect(links.appleMapsUrl).toContain('daddr=-0.5,13.100001');
	});

	it('hält die lat,lon-Reihenfolge (nicht GeoJSON lon,lat)', () => {
		const links = buildNaviLinks(52.5, 13.4);
		expect(links.googleMapsUrl).toContain('=52.5,13.4');
	});
});
