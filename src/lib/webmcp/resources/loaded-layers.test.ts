import { describe, it, expect } from 'vitest';
import { readLoadedLayersResource } from './loaded-layers.js';

describe('readLoadedLayersResource', () => {
	it('mirror aktiv-geschaltete Layer-Slugs', () => {
		const result = readLoadedLayersResource({
			uri: 'navigator://layers/active',
			activeLayerSlugs: ['wohnlagen-2024', 'laerm-2023'],
			hiddenLayerSlugs: ['laerm-2023']
		});
		expect(result.uri).toBe('navigator://layers/active');
		expect(result.mimeType).toBe('application/json');
		expect(result.content).toEqual({
			active: ['wohnlagen-2024', 'laerm-2023'],
			hidden: ['laerm-2023']
		});
	});

	it('liefert leere Arrays bei initial-state', () => {
		const result = readLoadedLayersResource({
			uri: 'navigator://layers/active',
			activeLayerSlugs: [],
			hiddenLayerSlugs: []
		});
		expect(result.content).toEqual({ active: [], hidden: [] });
	});
});
