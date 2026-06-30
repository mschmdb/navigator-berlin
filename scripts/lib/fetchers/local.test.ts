import { describe, expect, it } from 'vitest';
import { fetchLocalGeoJson } from './local.js';

describe('fetchLocalGeoJson', () => {
	it('liest ein vorhandenes GeoJSON von der Platte als String', async () => {
		const raw = await fetchLocalGeoJson('static/data/kuehle-orte.geojson');
		expect(typeof raw).toBe('string');
		expect(raw).toContain('FeatureCollection');
	});

	it('wirft mit Pfad im Text bei fehlender Datei', async () => {
		await expect(fetchLocalGeoJson('static/data/does-not-exist.geojson')).rejects.toThrow(
			/does-not-exist\.geojson/
		);
	});
});
