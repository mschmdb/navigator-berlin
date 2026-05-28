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
		buildTimestamp: '2026-05-16T08:00:00.000Z',
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
				lastmod: '2024-01-01T00:00:00.000Z'
			})
		).toEqual([]);
	});

	it('rendert ein SitemapEntry pro Slug', () => {
		const entries = buildBezirkSitemapEntries({
			origin: ORIGIN,
			slugs: ['mitte', 'friedrichshain-kreuzberg'],
			lastmod: '2024-01-01T00:00:00.000Z'
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
			lastmod: '2024-01-01T00:00:00.000Z'
		});
		expect(entries[0]?.changefreq).toBe('monthly');
		expect(entries[0]?.priority).toBeCloseTo(0.7, 5);
		expect(entries[0]?.lastmod).toBe('2024-01-01T00:00:00.000Z');
	});

	it('strippt trailing-slash vom Origin', () => {
		const entries = buildBezirkSitemapEntries({
			origin: 'https://navigator.berlin/',
			slugs: ['mitte'],
			lastmod: '2024-01-01T00:00:00.000Z'
		});
		expect(entries[0]?.loc).toBe('https://navigator.berlin/bezirk/mitte');
	});
});

describe('BEZIRK_PAGES_SOURCE', () => {
	it('liefert leere Liste für locale=en (Phase 1 DE-only)', () => {
		const ctx = fixtureContext({ locale: 'en' });
		expect(BEZIRK_PAGES_SOURCE(ctx)).toEqual([]);
	});

	it('liest 3 Slugs aus ctx.bezirkSlugs', () => {
		const entries = BEZIRK_PAGES_SOURCE(fixtureContext());
		expect(entries).toHaveLength(3);
		expect(entries.map((e) => e.loc)).toContain('https://navigator.berlin/bezirk/mitte');
	});

	it('nutzt fetchedAt (Daten-Refresh) von bezirke-Layer als lastmod', () => {
		const entries = BEZIRK_PAGES_SOURCE(fixtureContext());
		expect(entries[0]?.lastmod).toBe('2026-05-16T06:56:28.400Z');
	});

	it('faellt auf sourceUpdatedAt zurueck wenn fetchedAt fehlt', () => {
		const ctx = fixtureContext();
		const manifest: Manifest = {
			...ctx.manifest,
			// Simuliert ein Manifest ohne fetchedAt (test-only Cast: Feld ist eigentlich required).
			layers: ctx.manifest.layers.map((l) => ({ ...l, fetchedAt: undefined as unknown as string }))
		};
		const entries = BEZIRK_PAGES_SOURCE({ ...ctx, manifest });
		expect(entries[0]?.lastmod).toBe('2024-01-01T00:00:00.000Z');
	});

	it('liefert leere Liste wenn bezirkSlugs nicht im Context ist', () => {
		const ctx = fixtureContext();
		const reduced: SitemapSourceContext = {
			origin: ctx.origin,
			locale: ctx.locale,
			manifest: ctx.manifest,
			buildTimestamp: ctx.buildTimestamp
		};
		expect(BEZIRK_PAGES_SOURCE(reduced)).toEqual([]);
	});
});
