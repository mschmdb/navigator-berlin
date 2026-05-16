import { describe, it, expect } from 'vitest';
import { createListLayersAtPointTool } from './list-layers-at-point.js';
import type { LayerHit } from '$lib/data';

const FIXTURE_HITS: LayerHit[] = [
	{
		layer: 'wohnlagen-2024',
		value: 'gut',
		source: 'a',
		updatedAt: '2024-01-01',
		license: 'dl-de/by-2-0'
	},
	{
		layer: 'laerm-2023',
		value: null,
		source: 'b',
		updatedAt: '2023-01-01',
		license: 'dl-de/zero-2-0',
		reason: 'no-coverage'
	}
];

describe('list-layers-at-point tool', () => {
	it('hat snake_case-name', () => {
		const tool = createListLayersAtPointTool({ getLayersAtPoint: async () => [] });
		expect(tool.name).toBe('list_layers_at_point');
	});

	it('liefert nur Layer-Slug + has_value, ohne Werte', async () => {
		const tool = createListLayersAtPointTool({ getLayersAtPoint: async () => FIXTURE_HITS });
		const out = await tool.handler({ lat: 52.5, lng: 13.4 });
		expect(out).toEqual([
			{ layer: 'wohnlagen-2024', has_value: true, reason: null },
			{ layer: 'laerm-2023', has_value: false, reason: 'no-coverage' }
		]);
	});
});
