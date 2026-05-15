import { describe, expect, it } from 'vitest';
import type { LayerMetadata } from '$lib/data';
import {
	filterLayers,
	groupLayersByBundle,
	getLayerDisplayName,
	BUNDLE_ORDER
} from './layer-palette-filter.js';

function makeLayer(
	slug: string,
	bundle: LayerMetadata['bundleGroup'],
	overrides: Partial<LayerMetadata> = {}
): LayerMetadata {
	return {
		slug,
		filename: `${slug}.deadbeef.geojson`,
		sourceUrl: 'https://example.org/source',
		fetchedAt: '2026-01-01T00:00:00.000Z',
		license: 'dl-de/zero-2-0',
		sha256: 'a'.repeat(64),
		bundleGroup: bundle,
		zoomThresholds: { min: 8, max: 14 },
		geometryType: 'Polygon',
		featureCount: 1,
		...overrides
	};
}

const LAYERS: LayerMetadata[] = [
	makeLayer('bezirke', 'A: Boundaries'),
	makeLayer('plz', 'A: Boundaries'),
	makeLayer('bodenrichtwerte', 'B: Wohn-Daten'),
	makeLayer('laerm-2023', 'C: Umwelt'),
	makeLayer('stolpersteine', 'D: Memorial')
];

describe('filterLayers', () => {
	it('leere Query liefert alle Layer', () => {
		expect(filterLayers(LAYERS, '')).toHaveLength(LAYERS.length);
		expect(filterLayers(LAYERS, '   ')).toHaveLength(LAYERS.length);
	});

	it('matched auf Slug-Substring case-insensitive', () => {
		const out = filterLayers(LAYERS, 'BEZ');
		expect(out.map((l) => l.slug)).toEqual(['bezirke']);
	});

	it('matched auf Display-Name (LAYER_EXPLAIN_DE)', () => {
		const out = filterLayers(LAYERS, 'lärm');
		expect(out.map((l) => l.slug)).toEqual(['laerm-2023']);
	});

	it('matched substring auf Postleitzahlen → plz', () => {
		const out = filterLayers(LAYERS, 'postl');
		expect(out.map((l) => l.slug)).toEqual(['plz']);
	});

	it('matched Synonym „Lärm" auf laerm-2023', () => {
		const out = filterLayers(LAYERS, 'lärm');
		expect(out.map((l) => l.slug)).toContain('laerm-2023');
	});

	it('matched Synonym „laerm" ohne Umlaut auf laerm-2023 (NFD-Toleranz)', () => {
		const out = filterLayers(LAYERS, 'laerm');
		expect(out.map((l) => l.slug)).toContain('laerm-2023');
	});
});

describe('groupLayersByBundle', () => {
	it('gruppiert nach Bundle in BUNDLE_ORDER-Reihenfolge', () => {
		const groups = groupLayersByBundle(LAYERS);
		expect(groups.map((g) => g.bundle)).toEqual([
			'A: Boundaries',
			'B: Wohn-Daten',
			'C: Umwelt',
			'D: Memorial'
		]);
	});

	it('innerhalb Bundle alphabetisch nach Display-Name', () => {
		const groups = groupLayersByBundle(LAYERS);
		expect(groups[0].layers.map((l) => l.slug)).toEqual(['bezirke', 'plz']);
	});

	it('blendet leere Bundles aus', () => {
		const subset = LAYERS.slice(0, 2);
		const groups = groupLayersByBundle(subset);
		expect(groups).toHaveLength(1);
		expect(groups[0].bundle).toBe('A: Boundaries');
	});

	it('blendet Layer mit mapRelevant=false aus (Story 1.28, z.B. lor-planungsraum)', () => {
		const layers: LayerMetadata[] = [
			makeLayer('bezirke', 'A: Boundaries'),
			makeLayer('lor-planungsraum', 'A: Boundaries', { mapRelevant: false }),
			makeLayer('plz', 'A: Boundaries')
		];
		const groups = groupLayersByBundle(layers);
		expect(groups).toHaveLength(1);
		expect(groups[0].layers.map((l) => l.slug)).toEqual(['bezirke', 'plz']);
	});
});

describe('getLayerDisplayName', () => {
	it('liefert Slug-Fallback für unbekannten Slug', () => {
		expect(getLayerDisplayName('unknown')).toBe('unknown');
	});

	it('liefert deutschen Namen für bekannten Slug', () => {
		expect(getLayerDisplayName('bodenrichtwerte')).toBe('Bodenrichtwerte (EUR/m²)');
	});

	it('liefert "S-Bahn-Netz" für sbahn-netz (Story 1.13)', () => {
		expect(getLayerDisplayName('sbahn-netz')).toBe('S-Bahn-Netz');
	});
});

describe('BUNDLE_ORDER', () => {
	it('ist A → G (G = Kiez-Score, Story 1.28)', () => {
		expect(BUNDLE_ORDER).toEqual([
			'A: Boundaries',
			'B: Wohn-Daten',
			'C: Umwelt',
			'D: Memorial',
			'E: Soziale Infrastruktur',
			'F: Mobilität',
			'G: Kiez-Score'
		]);
	});
});
