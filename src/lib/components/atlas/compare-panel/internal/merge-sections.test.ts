import { describe, expect, it } from 'vitest';
import { mergeCompareSections } from './merge-sections.js';
import type { LayerHit, LayerMetadata } from '$lib/data';

function meta(slug: string, bundle: LayerMetadata['bundleGroup']): LayerMetadata {
	return {
		slug,
		filename: `${slug}.geojson`,
		sourceUrl: 'https://daten.odis-berlin.de',
		fetchedAt: '2025-06-01T00:00:00Z',
		license: 'dl-de/zero-2-0',
		sha256: 'x',
		bundleGroup: bundle,
		zoomThresholds: { min: 9, max: 18 },
		geometryType: 'Polygon',
		featureCount: 1
	};
}

function hit(slug: string, value: unknown = 'x'): LayerHit {
	return {
		layer: slug,
		value,
		source: 'https://daten.odis-berlin.de',
		updatedAt: '2025-06-01T00:00:00Z',
		license: 'dl-de/zero-2-0'
	};
}

const layerMeta = [
	meta('bezirke', 'A: Boundaries'),
	meta('mietspiegel-wohnlage', 'B: Wohn-Daten'),
	meta('laerm-den', 'C: Umwelt'),
	meta('stolpersteine', 'D: Memorial'),
	meta('kitas-2024', 'E: Soziale Infrastruktur'),
	meta('ubahn-stationen', 'F: Mobilität')
];

describe('mergeCompareSections', () => {
	it('liefert SECTION_ORDER mit Union beider Adressen', () => {
		const a = [hit('bezirke', 'Mitte'), hit('laerm-den', 60)];
		const b = [hit('bezirke', 'Pankow'), hit('mietspiegel-wohnlage', { wol_mode: 'gut' })];
		const merged = mergeCompareSections(a, b, layerMeta);
		const keys = merged.map((s) => s.key);
		expect(keys).toEqual(['umwelt', 'wohn', 'sozial', 'mobilitaet', 'klima', 'boundaries']);
	});

	it('Section "boundaries" enthält Union (bezirke in beiden) als 1 Row', () => {
		const a = [hit('bezirke', 'Mitte')];
		const b = [hit('bezirke', 'Pankow')];
		const merged = mergeCompareSections(a, b, layerMeta);
		const boundaries = merged.find((s) => s.key === 'boundaries')!;
		expect(boundaries.rows).toHaveLength(1);
		expect(boundaries.rows[0]!.slug).toBe('bezirke');
		expect(boundaries.rows[0]!.hitA?.value).toBe('Mitte');
		expect(boundaries.rows[0]!.hitB?.value).toBe('Pankow');
	});

	it('Layer nur in A → Row mit hitB=null', () => {
		const a = [hit('laerm-den', 60)];
		const b: LayerHit[] = [];
		const merged = mergeCompareSections(a, b, layerMeta);
		const umwelt = merged.find((s) => s.key === 'umwelt')!;
		expect(umwelt.rows).toHaveLength(1);
		expect(umwelt.rows[0]!.hitA?.value).toBe(60);
		expect(umwelt.rows[0]!.hitB).toBeNull();
	});

	it('Layer nur in B → Row mit hitA=null', () => {
		const a: LayerHit[] = [];
		const b = [hit('kitas-2024', { count: 3 })];
		const merged = mergeCompareSections(a, b, layerMeta);
		const sozial = merged.find((s) => s.key === 'sozial')!;
		expect(sozial.rows).toHaveLength(1);
		expect(sozial.rows[0]!.hitA).toBeNull();
		expect(sozial.rows[0]!.hitB?.value).toEqual({ count: 3 });
	});

	it('leere Sections haben rows=[]', () => {
		const merged = mergeCompareSections([], [], layerMeta);
		for (const s of merged) {
			expect(s.rows).toEqual([]);
		}
	});

	it('ignoriert Layer ohne Meta-Entry (unbekannte Slugs)', () => {
		const a = [hit('unknown-slug', 'x')];
		const b: LayerHit[] = [];
		const merged = mergeCompareSections(a, b, layerMeta);
		const allRows = merged.flatMap((s) => s.rows);
		expect(allRows.every((r) => r.slug !== 'unknown-slug')).toBe(true);
	});

	it('Section-Label-Map wird gesetzt', () => {
		const merged = mergeCompareSections([], [], layerMeta);
		const labels = Object.fromEntries(merged.map((s) => [s.key, s.label]));
		expect(labels.boundaries).toBe('Lage & Verwaltung');
		expect(labels.klima).toBe('Klima');
	});

	it('boundaries-Section sortiert bezirke vor ortsteile vor plz', () => {
		const layerMetaExt = [
			...layerMeta,
			meta('plz', 'A: Boundaries'),
			meta('ortsteile', 'A: Boundaries')
		];
		const a = [hit('plz', '10245'), hit('ortsteile', 'Friedrichshain'), hit('bezirke', 'X')];
		const b: LayerHit[] = [];
		const merged = mergeCompareSections(a, b, layerMetaExt);
		const boundaries = merged.find((s) => s.key === 'boundaries')!;
		const slugs = boundaries.rows.map((r) => r.slug);
		expect(slugs).toEqual(['bezirke', 'ortsteile', 'plz']);
	});
});
