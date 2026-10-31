import { describe, expect, it } from 'vitest';
import { laeaToWgs84, wgs84ToLaea } from './laea.js';

describe('laeaToWgs84', () => {
	it('projiziert eine Berliner Zelle (EPSG:3035) nach WGS84', () => {
		const [lon, lat] = laeaToWgs84(4549850, 3270050);
		expect(Math.abs(lon - 13.3706)).toBeLessThan(0.0005);
		expect(Math.abs(lat - 52.492)).toBeLessThan(0.0005);
	});

	it('liefert [lon, lat] in dieser Reihenfolge', () => {
		const [lon, lat] = laeaToWgs84(4549850, 3270050);
		expect(lon).toBeGreaterThan(13);
		expect(lat).toBeGreaterThan(52);
	});
});

describe('wgs84ToLaea', () => {
	it('ist die Umkehrung von laeaToWgs84', () => {
		const [lon, lat] = laeaToWgs84(4549850, 3270050);
		const { x, y } = wgs84ToLaea(lon, lat);
		expect(Math.abs(x - 4549850)).toBeLessThan(0.01);
		expect(Math.abs(y - 3270050)).toBeLessThan(0.01);
	});
});
