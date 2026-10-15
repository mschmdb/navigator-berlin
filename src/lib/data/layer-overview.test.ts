import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { explainLayer } from '$lib/components/atlas/inspector-panel/internal/layer-explain.js';
import { getLayerDisplayName } from '$lib/components/atlas/internal/layer-palette-filter.js';
import { hasLayerDetailPage } from './layer-visibility.js';
import { groupLayersForOverview, layersOutsideBundles } from './layer-overview.js';
import type { LayerMetadata } from './types.js';

function layer(slug: string, overrides: Partial<LayerMetadata> = {}): LayerMetadata {
	return {
		slug,
		filename: `${slug}.geojson`,
		sourceUrl: 'https://example.com',
		fetchedAt: '2026-01-01T00:00:00.000Z',
		license: 'dl-de/zero-2-0',
		sha256: 'x',
		bundleGroup: 'C: Umwelt',
		zoomThresholds: { min: 8, max: 12 },
		geometryType: 'Polygon',
		featureCount: 1,
		...overrides
	};
}

describe('groupLayersForOverview', () => {
	const layers = [
		layer('laerm-2023'),
		layer('bezirke', { bundleGroup: 'A: Boundaries' }),
		layer('denkmal-2024', {
			bundleGroup: 'D: Memorial',
			inspectorRelevant: false,
			mapRelevant: false
		}),
		layer('stolpersteine', { bundleGroup: 'D: Memorial', mapRelevant: false })
	];

	it('folgt der Themenreihenfolge und laesst leere Gruppen weg', () => {
		const groups = groupLayersForOverview(layers, 'de');
		expect(groups.map((g) => g.bundle)).toEqual(['A: Boundaries', 'C: Umwelt', 'D: Memorial']);
	});

	it('schliesst Layer ohne Detailseite aus, behaelt Layer mit Inspector', () => {
		const groups = groupLayersForOverview(layers, 'de');
		const memorial = groups.find((g) => g.bundle === 'D: Memorial');
		expect(memorial?.layers.map((l) => l.slug)).toEqual(['stolpersteine']);
	});

	it('nutzt lokalisierte Themen-Labels und Layer-Namen', () => {
		const de = groupLayersForOverview(layers, 'de');
		const en = groupLayersForOverview(layers, 'en');
		expect(de[1]?.label).toBe('Umwelt');
		expect(en[1]?.label).toBe('Environment');
		expect(de[1]?.layers[0]?.name).toBe('Lärmbelastung 2023');
		expect(en[1]?.layers[0]?.name).not.toBe('Lärmbelastung 2023');
	});

	it('sortiert Layer innerhalb eines Themas nach Namen', () => {
		const groups = groupLayersForOverview([layer('luft-2023'), layer('laerm-2023')], 'de');
		expect(groups[0]?.layers.map((l) => l.slug)).toEqual(['laerm-2023', 'luft-2023']);
	});

	it('gibt leere Liste fuer leeres Manifest', () => {
		expect(groupLayersForOverview([], 'de')).toEqual([]);
	});
});

describe('layersOutsideBundles', () => {
	it('findet Layer mit Detailseite, deren Gruppe nicht in BUNDLE_ORDER steht', () => {
		const odd = layer('mystery', { bundleGroup: 'Z: Neu' as LayerMetadata['bundleGroup'] });
		const buildOnly = layer('intern', {
			bundleGroup: 'Z: Neu' as LayerMetadata['bundleGroup'],
			inspectorRelevant: false,
			mapRelevant: false
		});
		expect(layersOutsideBundles([layer('laerm-2023'), odd, buildOnly])).toEqual(['mystery']);
	});

	it('liefert für bekannte Gruppen eine leere Liste', () => {
		expect(layersOutsideBundles([layer('laerm-2023')])).toEqual([]);
	});
});

describe('echtes Manifest', () => {
	const manifest = JSON.parse(
		readFileSync(resolve(process.cwd(), 'static/layers/MANIFEST.json'), 'utf-8')
	) as { layers: LayerMetadata[] };
	const detailLayers = manifest.layers.filter((l) => hasLayerDetailPage(l));

	it('verliert keinen Layer mit Detailseite', () => {
		expect(layersOutsideBundles(manifest.layers)).toEqual([]);
		const grouped = groupLayersForOverview(manifest.layers, 'de').flatMap((g) => g.layers);
		expect(grouped.map((l) => l.slug).sort()).toEqual(detailLayers.map((l) => l.slug).sort());
	});

	it('jeder Layer mit Detailseite hat EN-Namen und EN-Kurztext', () => {
		for (const { slug } of detailLayers) {
			const name = getLayerDisplayName(slug, { locale: 'en' });
			expect(name, `EN-Name ${slug}`).not.toBe(slug);
			expect(explainLayer(slug, { locale: 'en' }).length, `EN-Explain ${slug}`).toBeGreaterThan(0);
			expect(explainLayer(slug, { locale: 'de' }).length, `DE-Explain ${slug}`).toBeGreaterThan(0);
		}
	});
});
