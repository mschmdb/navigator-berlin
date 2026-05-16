import { describe, it, expect } from 'vitest';
import {
	buildBezirkTargetsFromGeoJson,
	buildKiezTargetsFromGeoJson,
	buildLayerTargetsFromManifest,
	computeFeatureBbox,
	type LayerManifestEntry,
	type GeoJsonFeatureCollection
} from './og-pipeline.js';

const SAMPLE_BEZIRK: GeoJsonFeatureCollection = {
	type: 'FeatureCollection',
	features: [
		{
			type: 'Feature',
			geometry: {
				type: 'Polygon',
				coordinates: [
					[
						[13.3, 52.5],
						[13.4, 52.5],
						[13.4, 52.6],
						[13.3, 52.6],
						[13.3, 52.5]
					]
				]
			},
			properties: { Gemeinde_name: 'Mitte', Gemeinde_schluessel: '001' }
		},
		{
			type: 'Feature',
			geometry: {
				type: 'Polygon',
				coordinates: [
					[
						[13.5, 52.4],
						[13.6, 52.4],
						[13.6, 52.5],
						[13.5, 52.5],
						[13.5, 52.4]
					]
				]
			},
			properties: { Gemeinde_name: 'Friedrichshain-Kreuzberg' }
		}
	]
};

const SAMPLE_KIEZ: GeoJsonFeatureCollection = {
	type: 'FeatureCollection',
	features: [
		{
			type: 'Feature',
			geometry: {
				type: 'Polygon',
				coordinates: [
					[
						[13.45, 52.5],
						[13.46, 52.5],
						[13.46, 52.51],
						[13.45, 52.51],
						[13.45, 52.5]
					]
				]
			},
			properties: { BZR_NAME: 'Boxhagener-Kiez', BEZ: '11' }
		}
	]
};

describe('computeFeatureBbox', () => {
	it('returns minLon/minLat/maxLon/maxLat from polygon coordinates', () => {
		const bbox = computeFeatureBbox(SAMPLE_BEZIRK.features[0]);
		expect(bbox).toEqual([13.3, 52.5, 13.4, 52.6]);
	});

	it('handles MultiPolygon', () => {
		const feature = {
			type: 'Feature' as const,
			geometry: {
				type: 'MultiPolygon' as const,
				coordinates: [
					[
						[
							[13.1, 52.4],
							[13.2, 52.4],
							[13.2, 52.5],
							[13.1, 52.4]
						]
					],
					[
						[
							[13.4, 52.5],
							[13.5, 52.5],
							[13.5, 52.6],
							[13.4, 52.5]
						]
					]
				]
			},
			properties: {}
		};
		const bbox = computeFeatureBbox(feature);
		expect(bbox).toEqual([13.1, 52.4, 13.5, 52.6]);
	});
});

describe('buildBezirkTargetsFromGeoJson', () => {
	it('emits one target per feature with slug, label and bbox', () => {
		const targets = buildBezirkTargetsFromGeoJson(SAMPLE_BEZIRK);
		expect(targets).toHaveLength(2);
		expect(targets[0]).toMatchObject({
			type: 'bezirk',
			slug: 'mitte',
			label: 'Mitte'
		});
		expect(targets[0].bbox).toEqual([13.3, 52.5, 13.4, 52.6]);
		expect(targets[1].slug).toBe('friedrichshain-kreuzberg');
	});

	it('throws on feature missing Gemeinde_name (defensive)', () => {
		const bad: GeoJsonFeatureCollection = {
			type: 'FeatureCollection',
			features: [
				{
					type: 'Feature',
					geometry: { type: 'Polygon', coordinates: [[[0, 0]]] },
					properties: {}
				}
			]
		};
		expect(() => buildBezirkTargetsFromGeoJson(bad)).toThrow(/Gemeinde_name/);
	});
});

describe('buildKiezTargetsFromGeoJson', () => {
	it('emits target with kiez-slug, label, parent-bezirk-code and bbox', () => {
		const bezirkCodeToSlug = new Map([['11', 'lichtenberg']]);
		const targets = buildKiezTargetsFromGeoJson(SAMPLE_KIEZ, bezirkCodeToSlug);
		expect(targets).toHaveLength(1);
		expect(targets[0]).toMatchObject({
			type: 'kiez',
			slug: 'boxhagener-kiez',
			label: 'Boxhagener-Kiez',
			parentBezirkSlug: 'lichtenberg'
		});
		expect(targets[0].bbox?.[0]).toBeCloseTo(13.45, 5);
	});

	it('throws when parent-bezirk code not in lookup', () => {
		const bezirkCodeToSlug = new Map<string, string>();
		expect(() => buildKiezTargetsFromGeoJson(SAMPLE_KIEZ, bezirkCodeToSlug)).toThrow(/unknown bezirk/i);
	});
});

describe('buildLayerTargetsFromManifest', () => {
	const manifest: LayerManifestEntry[] = [
		{
			slug: 'laerm-2023',
			bundleGroup: 'C: Umwelt',
			license: 'dl-de/zero-2-0',
			sourceUpdatedAt: '2023-01-01T00:00:00.000Z',
			sourceUrl: 'https://gdi.berlin.de/services/wfs/foo'
		},
		{
			slug: 'bezirke',
			bundleGroup: 'A: Boundaries',
			license: 'dl-de/zero-2-0',
			sourceUpdatedAt: '2024-01-01T00:00:00.000Z',
			sourceUrl: 'https://daten.odis-berlin.de/de/dataset/bezirksgrenzen/data.geojson'
		}
	];

	it('emits one target per manifest entry with derived authority', () => {
		const targets = buildLayerTargetsFromManifest(manifest);
		expect(targets).toHaveLength(2);
		expect(targets[0]).toMatchObject({
			type: 'layer',
			slug: 'laerm-2023',
			label: 'Laerm 2023',
			bundleGroup: 'C: Umwelt',
			license: 'dl-de/zero-2-0',
			sourceUpdatedAt: '2023-01-01'
		});
		expect(targets[0].authority).toMatch(/gdi\.berlin\.de/);
	});

	it('strips ISO time suffix from sourceUpdatedAt', () => {
		const [t] = buildLayerTargetsFromManifest(manifest);
		expect(t.sourceUpdatedAt).toBe('2023-01-01');
	});
});
