import { describe, expect, it } from 'vitest';
import { buildLayerDetail } from './get-layer-detail.js';
import type { Manifest } from './types.js';

const sampleManifest: Manifest = {
	schemaVersion: 1,
	generatedAt: '2026-05-13T10:00:00.000Z',
	layers: [
		{
			slug: 'laerm-2023',
			filename: 'laerm-2023.x.geojson',
			sourceUrl: 'https://gdi.berlin.de/wfs/ua',
			fetchedAt: '2026-05-12T10:00:00.000Z',
			sourceUpdatedAt: '2024-01-01T00:00:00.000Z',
			license: 'dl-de/zero-2-0',
			sha256: 'a'.repeat(64),
			bundleGroup: 'C: Umwelt',
			zoomThresholds: { min: 9, max: 18 },
			geometryType: 'Polygon',
			featureCount: 542
		},
		{
			slug: 'wohnlagen-2024',
			filename: 'wohnlagen-2024.x.geojson',
			sourceUrl: 'https://gdi.berlin.de/wfs/wl',
			fetchedAt: '2026-05-12T10:00:00.000Z',
			license: 'dl-de/by-2-0',
			sha256: 'b'.repeat(64),
			bundleGroup: 'B: Wohn-Daten',
			zoomThresholds: { min: 12, max: 18 },
			geometryType: 'Polygon',
			featureCount: 100
		}
	]
};

describe('buildLayerDetail', () => {
	it('liefert Detail-Objekt für bekannten Slug', () => {
		const d = buildLayerDetail('laerm-2023', 'de', sampleManifest);
		expect(d).not.toBeNull();
		expect(d?.slug).toBe('laerm-2023');
		expect(d?.lang).toBe('de');
		expect(d?.layerName).toMatch(/Lärm/);
		expect(d?.explain.long).toMatch(/Lärm-Gesamtbelastung/);
		expect(d?.meta.license).toBe('dl-de/zero-2-0');
	});

	it('null für unbekannten Slug', () => {
		const d = buildLayerDetail('does-not-exist-xyz', 'de', sampleManifest);
		expect(d).toBeNull();
	});

	it('liefert editorial-Config für wohnlagen-2024 (legal-Disclaimer)', () => {
		const d = buildLayerDetail('wohnlagen-2024', 'de', sampleManifest);
		expect(d?.editorial).toBeDefined();
		expect(d?.editorial?.disclaimerVariants).toContain('legal');
	});

	it('kein editorial für laerm-2023', () => {
		const d = buildLayerDetail('laerm-2023', 'de', sampleManifest);
		expect(d?.editorial).toBeUndefined();
	});

	it('lang wird durchgereicht (Phase-1 Hardcoded DE, Phase-2 Migration in Story 3.1)', () => {
		const d = buildLayerDetail('laerm-2023', 'en', sampleManifest);
		expect(d?.lang).toBe('en');
	});
});
