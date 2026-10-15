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
				sourceUrl: 'https://daten.odis-berlin.de/de/dataset/lor_bezirksregionen_2021/data.geojson',
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
				lastmodBySlug: {}
			})
		).toEqual([]);
	});

	it('rendert ein SitemapEntry pro Slug', () => {
		const entries = buildKiezSitemapEntries({
			origin: ORIGIN,
			slugs: ['boxhagener-kiez', 'karlshorst'],
			lastmodBySlug: { karlshorst: '2026-10-14T00:00:00.000Z' }
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
			lastmodBySlug: {}
		});
		expect(entries[0].changefreq).toBe('monthly');
		expect(entries[0].priority).toBe(0.6);
	});

	it('strippt trailing slash vom origin', () => {
		const entries = buildKiezSitemapEntries({
			origin: 'https://navigator.berlin/',
			slugs: ['boxhagener-kiez'],
			lastmodBySlug: {}
		});
		expect(entries[0].loc).toBe('https://navigator.berlin/kiez/boxhagener-kiez');
	});
});

describe('KIEZ_PAGES_SOURCE', () => {
	it('i18n Block D1: liefert für locale=en /en/kiez/<slug>-URLs', () => {
		const locs = KIEZ_PAGES_SOURCE(fixtureContext({ locale: 'en' })).map((e) => e.loc);
		expect(locs).toHaveLength(3);
		expect(locs).toContain('https://navigator.berlin/en/kiez/karlshorst');
		expect(locs.every((loc) => loc.includes('/en/kiez/'))).toBe(true);
	});

	it('liefert leere Liste wenn kiezSlugs fehlt', () => {
		expect(KIEZ_PAGES_SOURCE(fixtureContext({ kiezSlugs: undefined }))).toEqual([]);
		expect(KIEZ_PAGES_SOURCE(fixtureContext({ kiezSlugs: [] }))).toEqual([]);
	});

	it('nutzt nicht das Grenzlayer-fetchedAt als lastmod', () => {
		const entries = KIEZ_PAGES_SOURCE(fixtureContext());
		expect(entries).toHaveLength(3);
		expect(entries.every((e) => e.lastmod === undefined)).toBe(true);
	});

	it('lastmod = späteres Datum aus Profil-generatedAt und Scores-generatedAt', () => {
		const entries = KIEZ_PAGES_SOURCE(
			fixtureContext({
				profileDates: {
					kiez: {
						karlshorst: { generatedAt: '2026-09-03T12:00:00.000Z' },
						schillerkiez: { generatedAt: '2026-11-01T00:00:00.000Z' }
					},
					bezirk: {}
				},
				scoresGeneratedAt: '2026-10-14T08:00:00.000Z'
			})
		);
		const byLoc = new Map(entries.map((e) => [e.loc, e.lastmod]));
		expect(byLoc.get(`${ORIGIN}/kiez/karlshorst`)).toBe('2026-10-14T08:00:00.000Z');
		expect(byLoc.get(`${ORIGIN}/kiez/schillerkiez`)).toBe('2026-11-01T00:00:00.000Z');
		// Kiez ohne Profil: nur das Scores-Datum
		expect(byLoc.get(`${ORIGIN}/kiez/boxhagener-kiez`)).toBe('2026-10-14T08:00:00.000Z');
	});

	it('EN-Seite nutzt translatedAt, wenn es das späteste Datum ist', () => {
		const entries = KIEZ_PAGES_SOURCE(
			fixtureContext({
				locale: 'en',
				kiezSlugs: ['karlshorst'],
				profileDates: {
					kiez: {
						karlshorst: {
							generatedAt: '2026-06-07T12:00:00.000Z',
							translatedAt: '2026-11-02T00:00:00.000Z'
						}
					},
					bezirk: {}
				},
				scoresGeneratedAt: '2026-10-14T08:00:00.000Z'
			})
		);
		expect(entries[0].lastmod).toBe('2026-11-02T00:00:00.000Z');
	});

	it('lässt lastmod weg bei ungültigen Datumswerten', () => {
		const entries = KIEZ_PAGES_SOURCE(
			fixtureContext({
				kiezSlugs: ['karlshorst'],
				profileDates: { kiez: { karlshorst: { generatedAt: 'kaputt' } }, bezirk: {} },
				scoresGeneratedAt: 'nope'
			})
		);
		expect(entries[0].lastmod).toBeUndefined();
	});
});
