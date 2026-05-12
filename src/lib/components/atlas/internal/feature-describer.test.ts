import { describe, expect, it } from 'vitest';
import { describeFeature, type AccessibleFeatureInput } from './feature-describer.js';
import type { LayerMetadata } from '$lib/data/types.js';

const baseLayer: LayerMetadata = {
	slug: 'bezirke',
	filename: 'bezirke.geojson',
	sourceUrl: 'https://fbinter.example/bezirke',
	fetchedAt: '2026-04-01T00:00:00Z',
	license: 'dl-de/by-2-0',
	sha256: 'abc',
	bundleGroup: 'A: Boundaries',
	zoomThresholds: { min: 9, max: 19 },
	geometryType: 'MultiPolygon',
	featureCount: 12
};

function feature(
	layerId: string,
	geometryType: 'Point' | 'Polygon' | 'MultiPolygon',
	properties: Record<string, unknown>,
	id: string | number = 'fid-1',
	centroid: [number, number] = [13.4, 52.5]
): AccessibleFeatureInput {
	return {
		id,
		layerId,
		geometryType,
		properties,
		centroid
	};
}

describe('describeFeature', () => {
	it('Bezirk → "Bezirk: <name>, <einwohner> Einwohner"', () => {
		const out = describeFeature(
			feature('bezirke', 'MultiPolygon', { name: 'Friedrichshain-Kreuzberg', einwohner: 295000 }),
			baseLayer
		);
		expect(out.description).toBe('Bezirk: Friedrichshain-Kreuzberg, 295.000 Einwohner');
		expect(out.layerSlug).toBe('bezirke');
		expect(out.geometryType).toBe('MultiPolygon');
	});

	it('Bezirk ohne einwohner → Fallback ohne Zahl', () => {
		const out = describeFeature(
			feature('bezirke', 'MultiPolygon', { name: 'Mitte' }),
			{ ...baseLayer, slug: 'bezirke' }
		);
		expect(out.description).toBe('Bezirk: Mitte');
	});

	it('Lärm L_DEN → dB-Wert + Stand', () => {
		const layer: LayerMetadata = { ...baseLayer, slug: 'laerm-den', fetchedAt: '2022-06-01T00:00:00Z' };
		const out = describeFeature(
			feature('laerm-den', 'Polygon', { value: 65 }),
			layer
		);
		expect(out.description).toMatch(/Lärmkarte/);
		expect(out.description).toMatch(/65/);
		expect(out.description).toMatch(/dB/);
		expect(out.description).toMatch(/2022/);
	});

	it('Stolperstein mit Person + Adresse', () => {
		const layer: LayerMetadata = { ...baseLayer, slug: 'stolpersteine', geometryType: 'Point' };
		const out = describeFeature(
			feature('stolpersteine', 'Point', {
				person: 'Anna Müller',
				'addr:street': 'Boxhagener Straße',
				'addr:housenumber': '12'
			}),
			layer
		);
		expect(out.description).toBe('Stolperstein für Anna Müller, Boxhagener Straße 12');
	});

	it('Stolperstein ohne Person → generischer Eintrag mit Adresse', () => {
		const layer: LayerMetadata = { ...baseLayer, slug: 'stolpersteine', geometryType: 'Point' };
		const out = describeFeature(
			feature('stolpersteine', 'Point', {
				'addr:street': 'Hauptstraße'
			}),
			layer
		);
		expect(out.description).toBe('Stolperstein, Hauptstraße');
	});

	it('Stolperstein ohne Person + Adresse → Fallback nur Layer-Label', () => {
		const layer: LayerMetadata = { ...baseLayer, slug: 'stolpersteine', geometryType: 'Point' };
		const out = describeFeature(feature('stolpersteine', 'Point', {}), layer);
		expect(out.description).toBe('Stolperstein');
	});

	it('LOR-Region → "Kiez: <name>"', () => {
		const layer: LayerMetadata = { ...baseLayer, slug: 'lor-regionen' };
		const out = describeFeature(
			feature('lor-regionen', 'MultiPolygon', { name: 'Boxhagener Platz' }),
			layer
		);
		expect(out.description).toBe('Kiez: Boxhagener Platz');
	});

	it('Unbekannter Slug → properties.name Fallback', () => {
		const layer: LayerMetadata = { ...baseLayer, slug: 'unknown-layer' };
		const out = describeFeature(
			feature('unknown-layer', 'Polygon', { name: 'Etwas' }),
			layer
		);
		expect(out.description).toBe('Etwas');
	});

	it('Unbekannter Slug + keine name-Property → Slug als Fallback', () => {
		const layer: LayerMetadata = { ...baseLayer, slug: 'unknown-layer' };
		const out = describeFeature(feature('unknown-layer', 'Polygon', {}), layer);
		expect(out.description).toBe('unknown-layer');
	});

	it('liefert source, updatedAt, license, centroid aus Layer', () => {
		const out = describeFeature(
			feature('bezirke', 'MultiPolygon', { name: 'Pankow' }, 'p-1', [13.41, 52.55]),
			baseLayer
		);
		expect(out.source).toBe(baseLayer.sourceUrl);
		expect(out.updatedAt).toBe(baseLayer.fetchedAt);
		expect(out.license).toBe(baseLayer.license);
		expect(out.centroid).toEqual([13.41, 52.55]);
	});

	it('synthetisiert ID falls feature.id fehlt', () => {
		const out = describeFeature(
			{
				id: undefined,
				layerId: 'bezirke',
				geometryType: 'Polygon',
				properties: { osm_id: 42 },
				centroid: [13.4, 52.5]
			},
			baseLayer
		);
		expect(out.id).toBe('bezirke:42');
	});

	it('synthetisiert ID via JSON-Fingerprint wenn weder id noch osm_id', () => {
		const out = describeFeature(
			{
				id: undefined,
				layerId: 'bezirke',
				geometryType: 'Polygon',
				properties: { name: 'X' },
				centroid: [13.4, 52.5]
			},
			baseLayer
		);
		expect(out.id.startsWith('bezirke:')).toBe(true);
	});
});
