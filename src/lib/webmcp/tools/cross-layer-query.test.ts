import { describe, it, expect, vi } from 'vitest';
import { createCrossLayerQueryTool } from './cross-layer-query.js';
import type { LayerHit } from '$lib/data';

const FIXTURE_HITS: LayerHit[] = [
	{
		layer: 'wohnlagen-2024',
		value: 'gut',
		source: 'https://example.com/wohnlagen.json',
		updatedAt: '2024-06-01',
		license: 'dl-de/by-2-0'
	},
	{
		layer: 'laerm-2023',
		value: 'mittel',
		source: 'https://example.com/laerm.json',
		updatedAt: '2023-08-01',
		license: 'dl-de/zero-2-0',
		reason: 'outdated'
	}
];

describe('cross-layer-query tool', () => {
	it('hat snake_case-name', () => {
		const tool = createCrossLayerQueryTool({ getLayersAtPoint: vi.fn(async () => []) });
		expect(tool.name).toBe('cross_layer_query');
	});

	it('liefert Provenance-Felder', async () => {
		const tool = createCrossLayerQueryTool({
			getLayersAtPoint: async () => FIXTURE_HITS
		});
		const out = await tool.handler({ lat: 52.52, lng: 13.4 });
		expect(out).toEqual([
			{
				layer: 'wohnlagen-2024',
				value: 'gut',
				source: 'https://example.com/wohnlagen.json',
				updated_at: '2024-06-01',
				license: 'dl-de/by-2-0',
				reason: null
			},
			{
				layer: 'laerm-2023',
				value: 'mittel',
				source: 'https://example.com/laerm.json',
				updated_at: '2023-08-01',
				license: 'dl-de/zero-2-0',
				reason: 'outdated'
			}
		]);
	});

	it('validiert lat/lng-Bereich', async () => {
		const tool = createCrossLayerQueryTool({ getLayersAtPoint: vi.fn(async () => []) });
		await expect(tool.handler({ lat: 999, lng: 13.4 })).rejects.toThrow();
	});

	it('delegiert lat/lng an getLayersAtPoint', async () => {
		const spy = vi.fn(async () => FIXTURE_HITS);
		const tool = createCrossLayerQueryTool({ getLayersAtPoint: spy });
		await tool.handler({ lat: 52.52, lng: 13.4 });
		expect(spy).toHaveBeenCalledWith(52.52, 13.4);
	});
});
