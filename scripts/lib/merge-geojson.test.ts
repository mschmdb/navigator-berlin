import { describe, expect, it } from 'vitest';
import type { Feature, FeatureCollection } from 'geojson';
import { mergeFeatureCollections } from './merge-geojson.js';

function fc(...ids: string[]): FeatureCollection {
	const features: Feature[] = ids.map((id) => ({
		type: 'Feature',
		geometry: { type: 'Point', coordinates: [0, 0] },
		properties: { id, pet14h: 33 }
	}));
	return { type: 'FeatureCollection', features };
}

describe('mergeFeatureCollections', () => {
	it('führt zwei Collections zu allen Features zusammen', () => {
		const merged = mergeFeatureCollections([fc('a', 'b'), fc('c')]);
		expect(merged.type).toBe('FeatureCollection');
		expect(merged.features).toHaveLength(3);
		expect(merged.features.map((f) => f.properties?.id)).toEqual(['a', 'b', 'c']);
	});

	it('Partition aus drei Collections: Feature-Count = Summe der Quellen', () => {
		const merged = mergeFeatureCollections([fc('a', 'b'), fc('c', 'd'), fc('e')]);
		expect(merged.features).toHaveLength(5);
	});

	it('leere Collection bleibt stabil', () => {
		const merged = mergeFeatureCollections([fc(), fc('a')]);
		expect(merged.features).toHaveLength(1);
	});

	it('reicht pet14h-Property auf allen Features durch', () => {
		const merged = mergeFeatureCollections([fc('a'), fc('b')]);
		expect(merged.features.every((f) => f.properties?.pet14h === 33)).toBe(true);
	});
});
