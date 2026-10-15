import { describe, expect, it } from 'vitest';
import { buildBezirkSitemapEntries, BEZIRK_PAGES_SOURCE } from './bezirk-pages.js';
import type { Manifest } from '$lib/data/types.js';
import type { SitemapSourceContext } from '../sitemap-builder.js';

const ORIGIN = 'https://navigator.berlin';

function fixtureManifest(): Manifest {
	return {
		schemaVersion: 1,
		generatedAt: '2026-05-16T07:03:25.286Z',
		layers: [
			{
				slug: 'bezirke',
				filename: 'bezirke.c8a6e03b.geojson',
				sourceUrl: 'https://daten.odis-berlin.de/de/dataset/bezirksgrenzen/data.geojson',
				fetchedAt: '2026-05-16T06:56:28.400Z',
				sourceUpdatedAt: '2024-01-01T00:00:00.000Z',
				license: 'dl-de/zero-2-0',
				sha256: 'c8a6e03b187dfdd622b1852774b545c45bacbf68fec68184224b585f90e5c6e7',
				bundleGroup: 'A: Boundaries',
				zoomThresholds: { min: 8, max: 12 },
				geometryType: 'Polygon',
				featureCount: 12
			}
		]
	};
}

function fixtureContext(overrides: Partial<SitemapSourceContext> = {}): SitemapSourceContext {
	return {
		origin: ORIGIN,
		locale: 'de',
		manifest: fixtureManifest(),
		bezirkSlugs: ['mitte', 'friedrichshain-kreuzberg', 'pankow'],
		...overrides
	};
}

describe('buildBezirkSitemapEntries', () => {
	it('liefert leere Liste wenn keine Slugs', () => {
		expect(
			buildBezirkSitemapEntries({
				origin: ORIGIN,
				slugs: [],
				lastmodBySlug: {}
			})
		).toEqual([]);
	});

	it('rendert ein SitemapEntry pro Slug', () => {
		const entries = buildBezirkSitemapEntries({
			origin: ORIGIN,
			slugs: ['mitte', 'friedrichshain-kreuzberg'],
			lastmodBySlug: {}
		});
		const locs = entries.map((e) => e.loc);
		expect(locs).toEqual([
			'https://navigator.berlin/bezirk/mitte',
			'https://navigator.berlin/bezirk/friedrichshain-kreuzberg'
		]);
	});

	it('Entries haben changefreq monthly und priority 0.7', () => {
		const entries = buildBezirkSitemapEntries({
			origin: ORIGIN,
			slugs: ['mitte'],
			lastmodBySlug: { mitte: '2026-10-14T08:00:00.000Z' }
		});
		expect(entries[0]?.changefreq).toBe('monthly');
		expect(entries[0]?.priority).toBeCloseTo(0.7, 5);
		expect(entries[0]?.lastmod).toBe('2026-10-14T08:00:00.000Z');
	});

	it('strippt trailing-slash vom Origin', () => {
		const entries = buildBezirkSitemapEntries({
			origin: 'https://navigator.berlin/',
			slugs: ['mitte'],
			lastmodBySlug: {}
		});
		expect(entries[0]?.loc).toBe('https://navigator.berlin/bezirk/mitte');
	});
});

describe('BEZIRK_PAGES_SOURCE', () => {
	it('i18n Block D1: liefert für locale=en /en/bezirk/<slug>-URLs', () => {
		const ctx = fixtureContext({ locale: 'en' });
		const locs = BEZIRK_PAGES_SOURCE(ctx).map((e) => e.loc);
		expect(locs).toHaveLength(3);
		expect(locs).toContain('https://navigator.berlin/en/bezirk/mitte');
		expect(locs.every((loc) => loc.includes('/en/bezirk/'))).toBe(true);
	});

	it('liest 3 Slugs aus ctx.bezirkSlugs', () => {
		const entries = BEZIRK_PAGES_SOURCE(fixtureContext());
		expect(entries).toHaveLength(3);
		expect(entries.map((e) => e.loc)).toContain('https://navigator.berlin/bezirk/mitte');
	});

	it('nutzt nicht das Grenzlayer-fetchedAt als lastmod', () => {
		const entries = BEZIRK_PAGES_SOURCE(fixtureContext());
		expect(entries).toHaveLength(3);
		expect(entries.every((e) => e.lastmod === undefined)).toBe(true);
	});

	it('lastmod = späteres Datum aus Profil-generatedAt und Scores-generatedAt', () => {
		const entries = BEZIRK_PAGES_SOURCE(
			fixtureContext({
				profileDates: {
					kiez: {},
					bezirk: { mitte: { generatedAt: '2026-11-01T00:00:00.000Z' } }
				},
				scoresGeneratedAt: '2026-10-14T08:00:00.000Z'
			})
		);
		const byLoc = new Map(entries.map((e) => [e.loc, e.lastmod]));
		expect(byLoc.get(`${ORIGIN}/bezirk/mitte`)).toBe('2026-11-01T00:00:00.000Z');
		expect(byLoc.get(`${ORIGIN}/bezirk/pankow`)).toBe('2026-10-14T08:00:00.000Z');
	});

	it('EN-Seite nutzt translatedAt', () => {
		const entries = BEZIRK_PAGES_SOURCE(
			fixtureContext({
				locale: 'en',
				bezirkSlugs: ['mitte'],
				profileDates: {
					kiez: {},
					bezirk: {
						mitte: {
							generatedAt: '2026-06-07T12:00:00.000Z',
							translatedAt: '2026-09-30T12:00:00.000Z'
						}
					}
				}
			})
		);
		expect(entries[0]?.lastmod).toBe('2026-09-30T12:00:00.000Z');
	});

	it('lässt lastmod weg bei ungültigen Datumswerten', () => {
		const entries = BEZIRK_PAGES_SOURCE(
			fixtureContext({
				bezirkSlugs: ['mitte'],
				profileDates: { kiez: {}, bezirk: { mitte: { generatedAt: 'kaputt' } } }
			})
		);
		expect(entries[0]?.lastmod).toBeUndefined();
	});

	it('liefert leere Liste wenn bezirkSlugs nicht im Context ist', () => {
		const ctx = fixtureContext();
		const reduced: SitemapSourceContext = {
			origin: ctx.origin,
			locale: ctx.locale,
			manifest: ctx.manifest
		};
		expect(BEZIRK_PAGES_SOURCE(reduced)).toEqual([]);
	});
});
