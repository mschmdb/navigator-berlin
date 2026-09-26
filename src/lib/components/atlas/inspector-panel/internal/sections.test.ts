import { describe, expect, it } from 'vitest';
import { groupHitsBySection, sectionLabel, SECTION_ORDER, SECTION_LABELS } from './sections.js';
import type { LayerHit, LayerMetadata } from '$lib/data';

function meta(slug: string, bundle: LayerMetadata['bundleGroup']): LayerMetadata {
	return {
		slug,
		filename: `${slug}.geojson`,
		sourceUrl: 'https://example.org',
		fetchedAt: '2025-01-01T00:00:00Z',
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
		source: 'https://example.org',
		updatedAt: '2025-01-01T00:00:00Z',
		license: 'dl-de/zero-2-0'
	};
}

describe('groupHitsBySection', () => {
	it('liefert immer 5 Sektionen in fester Reihenfolge', () => {
		const sections = groupHitsBySection([], []);
		expect(sections.map((s) => s.key)).toEqual([...SECTION_ORDER]);
	});

	it('Bundle A → boundaries', () => {
		const layerMeta = [meta('bezirke', 'A: Boundaries')];
		const result = groupHitsBySection([hit('bezirke', 'Mitte')], layerMeta);
		expect(result.find((s) => s.key === 'boundaries')?.hits).toHaveLength(1);
	});

	it('Bundle B → wohn', () => {
		const layerMeta = [meta('mietspiegel-wohnlage', 'B: Wohn-Daten')];
		const result = groupHitsBySection([hit('mietspiegel-wohnlage', 'gut')], layerMeta);
		expect(result.find((s) => s.key === 'wohn')?.hits).toHaveLength(1);
	});

	it('Bundle C → umwelt', () => {
		const layerMeta = [meta('laerm-den', 'C: Umwelt')];
		const result = groupHitsBySection([hit('laerm-den', 60)], layerMeta);
		expect(result.find((s) => s.key === 'umwelt')?.hits).toHaveLength(1);
	});

	it('Bundle D (Memorial) erzeugt keine eigene Section mehr (ADR-015 Story 9.6)', () => {
		const layerMeta = [meta('stolpersteine', 'D: Memorial')];
		const result = groupHitsBySection([hit('stolpersteine', { person: 'X' })], layerMeta);
		expect(result.some((s) => (s.key as string) === 'memorial')).toBe(false);
	});

	it('Unbekannter slug wird ignoriert', () => {
		const result = groupHitsBySection([hit('mystery-slug')], []);
		const total = result.reduce((acc, s) => acc + s.hits.length, 0);
		expect(total).toBe(0);
	});

	it('Boundaries werden hierarchisch sortiert (Bezirk → Ortsteil → PLZ)', () => {
		const layerMeta = [
			meta('plz', 'A: Boundaries'),
			meta('bezirke', 'A: Boundaries'),
			meta('ortsteile', 'A: Boundaries')
		];
		const hits = [
			hit('plz', '10243'),
			hit('bezirke', 'Friedrichshain'),
			hit('ortsteile', 'Friedrichshain-Süd')
		];
		const result = groupHitsBySection(hits, layerMeta);
		const order = result.find((s) => s.key === 'boundaries')?.hits.map((h) => h.layer);
		expect(order).toEqual(['bezirke', 'ortsteile', 'plz']);
	});

	// i18n Block B3a: ohne `opts.locale` bleibt DE (Boundary), matched
	// SECTION_LABELS (DE-only-Direktimporter wie Compare-Panel/LLM-Export).
	it('liefert DE-Section-Labels ohne opts, EN mit { locale: "en" }', () => {
		const result = groupHitsBySection([], []);
		expect(result.find((s) => s.key === 'umwelt')?.label).toBe(SECTION_LABELS.umwelt);
		const resultEn = groupHitsBySection([], [], { locale: 'en' });
		expect(resultEn.find((s) => s.key === 'umwelt')?.label).toBe('Environment');
	});
});

describe('sectionLabel', () => {
	it('liefert DE ohne opts, matched SECTION_LABELS', () => {
		for (const key of Object.keys(SECTION_LABELS) as (keyof typeof SECTION_LABELS)[]) {
			expect(sectionLabel(key)).toBe(SECTION_LABELS[key]);
		}
	});

	it('liefert EN mit { locale: "en" }', () => {
		expect(sectionLabel('boundaries', { locale: 'en' })).toBe('Location & administration');
		expect(sectionLabel('klima', { locale: 'en' })).toBe('Climate');
	});
});
