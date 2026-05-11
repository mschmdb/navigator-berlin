import { describe, expect, it } from 'vitest';
import { getVisibleLayers } from './layer-visibility.js';
import type { LayerMetadata } from '$lib/data';

function layer(slug: string, min: number, max: number): LayerMetadata {
	return {
		slug,
		filename: `${slug}.geojson`,
		sourceUrl: 'https://example/',
		fetchedAt: '2026-05-11',
		license: 'CC BY 4.0',
		sha256: 'abc',
		bundleGroup: 'A: Boundaries',
		zoomThresholds: { min, max },
		geometryType: 'Polygon',
		featureCount: 1
	};
}

const layers: LayerMetadata[] = [
	layer('bezirke', 8, 11),
	layer('lor-bezirksregion', 12, 13),
	layer('lor-planungsraum', 14, 16),
	layer('stolpersteine', 17, 22)
];

describe('getVisibleLayers', () => {
	it('zoom 10 → bezirke', () => {
		const v = getVisibleLayers(10, layers);
		expect(v.map((l) => l.slug)).toEqual(['bezirke']);
	});

	it('zoom 12 → bezirksregion', () => {
		const v = getVisibleLayers(12, layers);
		expect(v.map((l) => l.slug)).toEqual(['lor-bezirksregion']);
	});

	it('zoom 14 → planungsraum', () => {
		const v = getVisibleLayers(14, layers);
		expect(v.map((l) => l.slug)).toEqual(['lor-planungsraum']);
	});

	it('zoom 18 → stolpersteine', () => {
		const v = getVisibleLayers(18, layers);
		expect(v.map((l) => l.slug)).toEqual(['stolpersteine']);
	});

	it('zoom 5 → keine Layer', () => {
		const v = getVisibleLayers(5, layers);
		expect(v).toEqual([]);
	});

	it('Boundary inclusive: zoom=min → sichtbar', () => {
		const v = getVisibleLayers(8, layers);
		expect(v.find((l) => l.slug === 'bezirke')).toBeDefined();
	});

	it('Boundary inclusive: zoom=max → sichtbar', () => {
		const v = getVisibleLayers(11, layers);
		expect(v.find((l) => l.slug === 'bezirke')).toBeDefined();
	});

	it('Float zoom 11.5 → keine bezirke (>11), keine bezirksregion (<12)', () => {
		const v = getVisibleLayers(11.5, layers);
		expect(v).toEqual([]);
	});
});
