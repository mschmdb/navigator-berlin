import { describe, it, expect, vi } from 'vitest';
import { createGetKiezProfileTool } from './get-kiez-profile.js';
import type { KiezProfile } from '$lib/data';

const FIXTURE_PROFILE: KiezProfile = {
	slug: 'regierungsviertel',
	name: 'Regierungsviertel',
	bezirk: 'Mitte',
	einwohner: 1234,
	flaecheHa: 56.78,
	centroid: [13.38, 52.52],
	geometry: { type: 'Polygon', coordinates: [] },
	layerCoverage: [
		{
			layer: 'wohnlagen-2024',
			value: 'gut',
			source: 'https://example.com/wohnlagen.json',
			updatedAt: '2024-06-01',
			license: 'dl-de/by-2-0'
		}
	]
};

describe('get-kiez-profile tool', () => {
	it('hat snake_case-name', () => {
		const tool = createGetKiezProfileTool({
			getKiezProfile: async () => FIXTURE_PROFILE,
			defaultLocale: () => 'de'
		});
		expect(tool.name).toBe('get_kiez_profile');
	});

	it('mappt camelCase → snake_case + data_sources mit Provenance', async () => {
		const tool = createGetKiezProfileTool({
			getKiezProfile: async () => FIXTURE_PROFILE,
			defaultLocale: () => 'de'
		});
		const out = await tool.handler({ slug: 'regierungsviertel' });
		expect(out).toMatchObject({
			name: 'Regierungsviertel',
			slug: 'regierungsviertel',
			bezirk: 'Mitte',
			einwohner: 1234,
			flaeche_ha: 56.78,
			centroid: [13.38, 52.52],
			data_sources: [
				{
					layer: 'wohnlagen-2024',
					source: 'https://example.com/wohnlagen.json',
					updated_at: '2024-06-01',
					license: 'dl-de/by-2-0'
				}
			]
		});
		// Geometrie + layerCoverage-Internalstruktur sind NICHT im Output
		expect(out).not.toHaveProperty('geometry');
		expect(out).not.toHaveProperty('layerCoverage');
	});

	it('reicht locale an getKiezProfile durch', async () => {
		const spy = vi.fn(async () => FIXTURE_PROFILE);
		const tool = createGetKiezProfileTool({
			getKiezProfile: spy,
			defaultLocale: () => 'de'
		});
		await tool.handler({ slug: 'regierungsviertel', locale: 'en' });
		expect(spy).toHaveBeenCalledWith('en', 'regierungsviertel');
	});

	it('fällt auf defaultLocale zurück wenn locale fehlt', async () => {
		const spy = vi.fn(async () => FIXTURE_PROFILE);
		const tool = createGetKiezProfileTool({
			getKiezProfile: spy,
			defaultLocale: () => 'de'
		});
		await tool.handler({ slug: 'regierungsviertel' });
		expect(spy).toHaveBeenCalledWith('de', 'regierungsviertel');
	});
});
