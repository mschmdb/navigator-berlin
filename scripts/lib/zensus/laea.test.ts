import { describe, expect, it } from 'vitest';
import { laeaToWgs84 } from './laea.js';

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
