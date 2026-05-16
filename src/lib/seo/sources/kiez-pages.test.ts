import { describe, expect, it } from 'vitest';
import { buildKiezSitemapEntries, KIEZ_PAGES_SOURCE } from './kiez-pages.js';
import type { Manifest } from '$lib/data/types.js';
import type { SitemapSourceContext } from '../sitemap-builder.js';

const ORIGIN = 'https://navigator.berlin';

function fixtureManifest(): Manifest {
	return {
		schemaVersion: 1,
		generatedAt: '2026-05-16T07:03:25.286Z',
		layers: [
			{
				slug: 'lor-bezirksregion',
				filename: 'lor-bezirksregion.9479b010.geojson',
				sourceUrl:
					'https://daten.odis-berlin.de/de/dataset/lor_bezirksregionen_2021/data.geojson',
				fetchedAt: '2026-05-16T06:56:28.400Z',
				sourceUpdatedAt: '2021-01-01T00:00:00.000Z',
				license: 'dl-de/zero-2-0',
				sha256: '9479b010',
				bundleGroup: 'A: Boundaries',
				zoomThresholds: { min: 10, max: 14 },
				geometryType: 'Polygon',
				featureCount: 143
			}
		]
	};
}

function fixtureContext(overrides: Partial<SitemapSourceContext> = {}): SitemapSourceContext {
	return {
		origin: ORIGIN,
		locale: 'de',
		manifest: fixtureManifest(),
		buildTimestamp: '2026-05-16T08:00:00.000Z',
		kiezSlugs: ['boxhagener-kiez', 'karlshorst', 'schillerkiez'],
		...overrides
	};
}

describe('buildKiezSitemapEntries', () => {
	it('liefert leere Liste wenn keine Slugs', () => {
		expect(
			buildKiezSitemapEntries({
				origin: ORIGIN,
				slugs: [],
				lastmod: '2021-01-01T00:00:00.000Z'
			})
		).toEqual([]);
	});

	it('rendert ein SitemapEntry pro Slug', () => {
		const entries = buildKiezSitemapEntries({
			origin: ORIGIN,
			slugs: ['boxhagener-kiez', 'karlshorst'],
			lastmod: '2021-01-01T00:00:00.000Z'
		});
		expect(entries.map((e) => e.loc)).toEqual([
			'https://navigator.berlin/kiez/boxhagener-kiez',
			'https://navigator.berlin/kiez/karlshorst'
		]);
	});

	it('Entries haben changefreq monthly und priority 0.6', () => {
		const entries = buildKiezSitemapEntries({
			origin: ORIGIN,
			slugs: ['boxhagener-kiez'],
			lastmod: '2021-01-01T00:00:00.000Z'
		});
		expect(entries[0].changefreq).toBe('monthly');
		expect(entries[0].priority).toBe(0.6);
	});

	it('strippt trailing slash vom origin', () => {
		const entries = buildKiezSitemapEntries({
			origin: 'https://navigator.berlin/',
			slugs: ['boxhagener-kiez'],
			lastmod: '2021-01-01T00:00:00.000Z'
		});
		expect(entries[0].loc).toBe('https://navigator.berlin/kiez/boxhagener-kiez');
	});
});

describe('KIEZ_PAGES_SOURCE', () => {
	it('liefert für locale=en einen leeren Array (Phase-1 DE-only)', () => {
		expect(KIEZ_PAGES_SOURCE(fixtureContext({ locale: 'en' }))).toEqual([]);
	});

	it('liefert leere Liste wenn kiezSlugs fehlt', () => {
		expect(KIEZ_PAGES_SOURCE(fixtureContext({ kiezSlugs: undefined }))).toEqual([]);
		expect(KIEZ_PAGES_SOURCE(fixtureContext({ kiezSlugs: [] }))).toEqual([]);
	});

	it('rendert Entries mit lastmod aus dem lor-bezirksregion-Layer', () => {
		const entries = KIEZ_PAGES_SOURCE(fixtureContext());
		expect(entries).toHaveLength(3);
		expect(entries[0].lastmod).toBe('2021-01-01T00:00:00.000Z');
	});

	it('fällt auf fetchedAt zurück wenn sourceUpdatedAt fehlt', () => {
		const manifest = fixtureManifest();
		manifest.layers[0] = { ...manifest.layers[0], sourceUpdatedAt: undefined };
		const entries = KIEZ_PAGES_SOURCE(
			fixtureContext({ manifest, kiezSlugs: ['boxhagener-kiez'] })
		);
		expect(entries[0].lastmod).toBe('2026-05-16T06:56:28.400Z');
	});
});
