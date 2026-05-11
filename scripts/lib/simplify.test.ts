import { describe, expect, it } from 'vitest';
import { simplifyCommand, simplifyGeoJSON } from './simplify.js';
import type { SimplifyProfile } from './types.js';

describe('simplifyCommand', () => {
	it('boundary: visvalingam 20% planar + clean', () => {
		const cmd = simplifyCommand('boundary');
		expect(cmd).toContain('-simplify');
		expect(cmd).toContain('visvalingam');
		expect(cmd).toContain('20%');
		expect(cmd).toContain('planar');
		expect(cmd).toContain('-clean');
	});

	it('polygon: visvalingam 40%', () => {
		const cmd = simplifyCommand('polygon');
		expect(cmd).toContain('40%');
	});

	it('point: no-op (leerer command)', () => {
		expect(simplifyCommand('point')).toBe('');
	});
});

describe('simplifyGeoJSON', () => {
	const polygon = JSON.stringify({
		type: 'FeatureCollection',
		features: [
			{
				type: 'Feature',
				geometry: {
					type: 'Polygon',
					coordinates: [
						[
							[13.0, 52.0],
							[13.1, 52.0],
							[13.1, 52.05],
							[13.05, 52.07],
							[13.0, 52.05],
							[13.0, 52.0]
						]
					]
				},
				properties: { name: 'test' }
			}
		]
	});

	it('point profile: pass-through', async () => {
		const out = await simplifyGeoJSON(polygon, 'point');
		expect(out).toBe(polygon);
	});

	it('boundary profile: liefert valides GeoJSON, kein Crash', async () => {
		const out = await simplifyGeoJSON(polygon, 'boundary' as SimplifyProfile);
		const parsed = JSON.parse(out);
		expect(parsed.type).toBe('FeatureCollection');
		expect(parsed.features).toHaveLength(1);
	});
});
