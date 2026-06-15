import { describe, it, expect } from 'vitest';
import { createGetLayerMetadataTool } from './get-layer-metadata.js';
import type { LayerMetadata } from '$lib/data';
import type { LayerMethodology } from '$lib/data/layer-methodology.js';

const FIXTURE_LAYER: LayerMetadata = {
	slug: 'wohnlagen-2024',
	filename: 'wohnlagen-2024.foo.geojson',
	sourceUrl: 'https://example.com/wohnlagen.json',
	fetchedAt: '2024-12-01',
	sourceUpdatedAt: '2024-06-01',
	license: 'dl-de/by-2-0',
	sha256: 'abc',
	bundleGroup: 'B: Wohn-Daten',
	zoomThresholds: { min: 9, max: 17 },
	geometryType: 'Polygon',
	featureCount: 12345
};

const FIXTURE_METHODOLOGY: LayerMethodology = {
	calculation: 'Wohnlagen aus Berliner Mietspiegel 2024',
	aggregationLevel: 'block',
	relatedLayers: ['wohnlagen-2024'],
	authority: 'ODIS Berlin'
};

describe('get-layer-metadata tool', () => {
	it('hat snake_case-name', () => {
		const tool = createGetLayerMetadataTool({
			getLayerMetadata: () => FIXTURE_LAYER,
			getLayerMethodology: () => null,
			loadManifest: async () => undefined,
			defaultLocale: () => 'de'
		});
		expect(tool.name).toBe('get_layer_metadata');
	});

	it('mappt Felder + license_url + methodology', async () => {
		const tool = createGetLayerMetadataTool({
			getLayerMetadata: () => FIXTURE_LAYER,
			getLayerMethodology: () => FIXTURE_METHODOLOGY,
			loadManifest: async () => undefined,
			defaultLocale: () => 'de'
		});
		const out = await tool.handler({ slug: 'wohnlagen-2024' });
		expect(out).toMatchObject({
			slug: 'wohnlagen-2024',
			bundle: 'B: Wohn-Daten',
			geometry_type: 'Polygon',
			feature_count: 12345,
			source_url: 'https://example.com/wohnlagen.json',
			updated_at: '2024-06-01',
			license: 'dl-de/by-2-0',
			license_url: 'https://www.govdata.de/dl-de/by-2-0',
			methodology: {
				summary: 'Wohnlagen aus Berliner Mietspiegel 2024',
				aggregation_level: 'block',
				source_layers: ['wohnlagen-2024']
			}
		});
		const methodology = (out as Record<string, unknown>).methodology as Record<string, unknown>;
		expect(methodology.authority).toBe('ODIS Berlin');
	});

	it('liefert null für methodology wenn keine vorhanden', async () => {
		const tool = createGetLayerMetadataTool({
			getLayerMetadata: () => FIXTURE_LAYER,
			getLayerMethodology: () => null,
			loadManifest: async () => undefined,
			defaultLocale: () => 'de'
		});
		const out = (await tool.handler({ slug: 'wohnlagen-2024' })) as Record<string, unknown>;
		expect(out.methodology).toBeNull();
	});

	it('Fallback auf fetchedAt bei fehlendem sourceUpdatedAt', async () => {
		const withoutSourceUpdated: LayerMetadata = {
			...FIXTURE_LAYER,
			sourceUpdatedAt: undefined
		};
		const tool = createGetLayerMetadataTool({
			getLayerMetadata: () => withoutSourceUpdated,
			getLayerMethodology: () => null,
			loadManifest: async () => undefined,
			defaultLocale: () => 'de'
		});
		const out = (await tool.handler({ slug: 'wohnlagen-2024' })) as Record<string, unknown>;
		expect(out.updated_at).toBe('2024-12-01');
	});

	it('graceful auf Unknown-Layer-Throw: returnt strukturierten Error (GH-Issue #7 follow-up 2)', async () => {
		const tool = createGetLayerMetadataTool({
			getLayerMetadata: () => {
				throw new Error('Unknown layer: social-status');
			},
			getLayerMethodology: () => null,
			loadManifest: async () => undefined,
			defaultLocale: () => 'de'
		});
		const out = (await tool.handler({ slug: 'social-status' })) as Record<string, unknown>;
		expect(out.error).toBe('layer_not_found');
		expect(out.slug).toBe('social-status');
		expect(typeof out.hint).toBe('string');
	});

	it('Nicht-Unknown-Layer-Errors werden weiter propagiert', async () => {
		const tool = createGetLayerMetadataTool({
			getLayerMetadata: () => {
				throw new Error('Network down');
			},
			getLayerMethodology: () => null,
			loadManifest: async () => undefined,
			defaultLocale: () => 'de'
		});
		await expect(tool.handler({ slug: 'whatever' })).rejects.toThrow('Network down');
	});
});
