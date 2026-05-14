import { describe, expect, it } from 'vitest';
import { buildLayerEntry, validateManifest, ManifestSchema } from './manifest.js';
import type { Manifest, SourceConfig } from './types.js';

const fakeSource: SourceConfig = {
	slug: 'bezirke',
	kind: 'odis',
	sourceUrl: 'https://daten.odis-berlin.de/de/dataset/bezirksgrenzen',
	license: 'dl-de/zero-2-0',
	bundleGroup: 'A: Boundaries',
	zoomThresholds: { min: 8, max: 12 },
	simplifyProfile: 'boundary'
};

const fakeGeoJson = Buffer.from(
	JSON.stringify({
		type: 'FeatureCollection',
		features: [
			{
				type: 'Feature',
				geometry: { type: 'MultiPolygon', coordinates: [[[[13, 52]]]] },
				properties: {}
			},
			{
				type: 'Feature',
				geometry: { type: 'MultiPolygon', coordinates: [[[[13.1, 52.1]]]] },
				properties: {}
			}
		]
	})
);

describe('buildLayerEntry', () => {
	it('extrahiert featureCount + geometryType + sha256', () => {
		const entry = buildLayerEntry(fakeSource, fakeGeoJson, '2026-05-11T14:21:33Z');
		expect(entry.slug).toBe('bezirke');
		expect(entry.featureCount).toBe(2);
		expect(entry.geometryType).toBe('MultiPolygon');
		expect(entry.sha256).toMatch(/^[0-9a-f]{64}$/);
		expect(entry.filename).toMatch(/^bezirke\.[0-9a-f]{8}\.geojson$/);
		expect(entry.bundleGroup).toBe('A: Boundaries');
		expect(entry.license).toBe('dl-de/zero-2-0');
		expect(entry.zoomThresholds).toEqual({ min: 8, max: 12 });
		expect(entry.fetchedAt).toBe('2026-05-11T14:21:33Z');
	});

	it('respektiert seasonality wenn gesetzt', () => {
		const src: SourceConfig = {
			...fakeSource,
			slug: 'trinkbrunnen',
			seasonality: { from: '05-01', to: '10-31' }
		};
		const entry = buildLayerEntry(src, fakeGeoJson, '2026-05-11T14:21:33Z');
		expect(entry.seasonality).toEqual({ from: '05-01', to: '10-31' });
	});

	it('Feature-Collection ohne Features: count=0, geometryType faellt zurueck auf Point', () => {
		const empty = Buffer.from('{"type":"FeatureCollection","features":[]}');
		const entry = buildLayerEntry(fakeSource, empty, '2026-05-11T14:21:33Z');
		expect(entry.featureCount).toBe(0);
		expect(entry.geometryType).toBe('Point');
	});

	it('reicht nearestPolygonFallbackKm aus SourceConfig durch (Story 1.25)', () => {
		const src: SourceConfig = { ...fakeSource, nearestPolygonFallbackKm: 0.05 };
		const entry = buildLayerEntry(src, fakeGeoJson, '2026-05-11T14:21:33Z');
		expect(entry.nearestPolygonFallbackKm).toBe(0.05);
	});

	it('lässt nearestPolygonFallbackKm undefined wenn Source es nicht setzt', () => {
		const entry = buildLayerEntry(fakeSource, fakeGeoJson, '2026-05-11T14:21:33Z');
		expect(entry.nearestPolygonFallbackKm).toBeUndefined();
	});
});

describe('validateManifest', () => {
	const validManifest: Manifest = {
		schemaVersion: 1,
		generatedAt: '2026-05-11T14:23:00Z',
		layers: [buildLayerEntry(fakeSource, fakeGeoJson, '2026-05-11T14:21:33Z')]
	};

	it('valid manifest passt valibot-Schema', () => {
		expect(() => validateManifest(validManifest)).not.toThrow();
	});

	it('schemaVersion != 1 wirft', () => {
		expect(() => validateManifest({ ...validManifest, schemaVersion: 2 as 1 })).toThrow();
	});

	it('fehlende Layer-Felder werfen', () => {
		const broken = {
			...validManifest,
			layers: [{ ...validManifest.layers[0], sha256: undefined }]
		};
		expect(() => validateManifest(broken as unknown as Manifest)).toThrow();
	});

	it('ManifestSchema parse + roundtrip', () => {
		const json = JSON.stringify(validManifest);
		const parsed = ManifestSchema.parse(JSON.parse(json));
		expect(parsed.schemaVersion).toBe(1);
		expect(parsed.layers).toHaveLength(1);
	});
});
