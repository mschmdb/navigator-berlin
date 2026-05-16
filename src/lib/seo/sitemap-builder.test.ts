import { describe, it, expect } from 'vitest';
import {
	buildSitemapXml,
	buildSitemapIndexXml,
	collectPrerenderedUrls,
	STATIC_PAGES_SOURCE,
	LAYER_DETAIL_SOURCE,
	type SitemapEntry,
	type SitemapSourceContext
} from './sitemap-builder.js';
import type { Manifest } from '$lib/data/types.js';

const ORIGIN = 'https://navigator.berlin';

function fixtureManifest(): Manifest {
	return {
		schemaVersion: 1,
		generatedAt: '2026-05-16T07:03:25.286Z',
		layers: [
			{
				slug: 'bezirke',
				filename: 'bezirke.c8a6e03b.geojson',
				sourceUrl: 'https://example.com/bezirke.geojson',
				fetchedAt: '2026-05-16T06:56:28.400Z',
				sourceUpdatedAt: '2024-01-01T00:00:00.000Z',
				license: 'dl-de/zero-2-0',
				sha256: 'abc',
				bundleGroup: 'A: Boundaries',
				zoomThresholds: { min: 8, max: 12 },
				geometryType: 'Polygon',
				featureCount: 12
			},
			{
				slug: 'mietspiegel-2024',
				filename: 'mietspiegel-2024.deadbeef.geojson',
				sourceUrl: 'https://example.com/mietspiegel.geojson',
				fetchedAt: '2026-04-01T00:00:00.000Z',
				license: 'dl-de/zero-2-0',
				sha256: 'def',
				bundleGroup: 'B: Wohn-Daten',
				zoomThresholds: { min: 10, max: 16 },
				geometryType: 'Polygon',
				featureCount: 8000,
				mapRelevant: false
			},
			{
				slug: 'klima-pet',
				filename: 'klima-pet.cafebabe.geojson',
				sourceUrl: 'https://example.com/klima-pet.geojson',
				fetchedAt: '2026-04-15T00:00:00.000Z',
				license: 'dl-de/by-2-0',
				sha256: 'ghi',
				bundleGroup: 'C: Umwelt',
				zoomThresholds: { min: 10, max: 16 },
				geometryType: 'Polygon',
				featureCount: 5000
			}
		]
	};
}

function ctx(overrides: Partial<SitemapSourceContext> = {}): SitemapSourceContext {
	return {
		origin: ORIGIN,
		locale: 'de',
		manifest: fixtureManifest(),
		buildTimestamp: '2026-05-16T08:00:00.000Z',
		...overrides
	};
}

describe('buildSitemapXml', () => {
	it('renders sitemap-0.9 XML for a list of entries', () => {
		const entries: SitemapEntry[] = [
			{ loc: 'https://navigator.berlin/', lastmod: '2026-05-16T08:00:00.000Z' },
			{ loc: 'https://navigator.berlin/methodik', lastmod: '2026-05-16T08:00:00.000Z' }
		];
		const xml = buildSitemapXml(entries);
		expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
		expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
		expect(xml).toContain('<loc>https://navigator.berlin/</loc>');
		expect(xml).toContain('<lastmod>2026-05-16T08:00:00.000Z</lastmod>');
		expect(xml).toContain('<loc>https://navigator.berlin/methodik</loc>');
		expect(xml).toContain('</urlset>');
	});

	it('renders entries without lastmod when not provided', () => {
		const entries: SitemapEntry[] = [{ loc: 'https://navigator.berlin/' }];
		const xml = buildSitemapXml(entries);
		expect(xml).toContain('<loc>https://navigator.berlin/</loc>');
		expect(xml).not.toContain('<lastmod>');
	});

	it('escapes XML special chars in loc', () => {
		const entries: SitemapEntry[] = [
			{ loc: 'https://navigator.berlin/x?a=1&b=2' }
		];
		const xml = buildSitemapXml(entries);
		expect(xml).toContain('https://navigator.berlin/x?a=1&amp;b=2');
	});

	it('returns valid empty urlset when no entries given', () => {
		const xml = buildSitemapXml([]);
		expect(xml).toContain('<urlset');
		expect(xml).toContain('</urlset>');
		expect(xml).not.toContain('<url>');
	});
});

describe('buildSitemapIndexXml', () => {
	it('renders sitemap-index XML for a list of sub-sitemaps', () => {
		const xml = buildSitemapIndexXml([
			{ loc: 'https://navigator.berlin/sitemap-de.xml', lastmod: '2026-05-16T08:00:00.000Z' }
		]);
		expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
		expect(xml).toContain('<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
		expect(xml).toContain('<sitemap>');
		expect(xml).toContain('<loc>https://navigator.berlin/sitemap-de.xml</loc>');
		expect(xml).toContain('<lastmod>2026-05-16T08:00:00.000Z</lastmod>');
	});
});

describe('STATIC_PAGES_SOURCE', () => {
	it('emits root, methodik, lizenzen for DE locale', () => {
		const entries = STATIC_PAGES_SOURCE(ctx());
		const locs = entries.map((e) => e.loc);
		expect(locs).toEqual([
			'https://navigator.berlin/',
			'https://navigator.berlin/methodik',
			'https://navigator.berlin/lizenzen'
		]);
		expect(entries.every((e) => e.lastmod === '2026-05-16T08:00:00.000Z')).toBe(true);
	});

	it('skips EN locale entirely in phase 1 (returns empty)', () => {
		const entries = STATIC_PAGES_SOURCE(ctx({ locale: 'en' }));
		expect(entries).toEqual([]);
	});
});

describe('LAYER_DETAIL_SOURCE', () => {
	it('emits one entry per manifest layer for DE', () => {
		const entries = LAYER_DETAIL_SOURCE(ctx());
		expect(entries.length).toBe(3);
		const slugs = entries.map((e) => e.loc).sort();
		expect(slugs).toEqual([
			'https://navigator.berlin/layer/bezirke',
			'https://navigator.berlin/layer/klima-pet',
			'https://navigator.berlin/layer/mietspiegel-2024'
		]);
	});

	it('uses layer fetchedAt as lastmod', () => {
		const entries = LAYER_DETAIL_SOURCE(ctx());
		const bezirkeEntry = entries.find((e) => e.loc.endsWith('/bezirke'));
		expect(bezirkeEntry?.lastmod).toBe('2026-05-16T06:56:28.400Z');
	});

	it('returns empty for EN locale (phase 1)', () => {
		const entries = LAYER_DETAIL_SOURCE(ctx({ locale: 'en' }));
		expect(entries).toEqual([]);
	});
});

describe('collectPrerenderedUrls', () => {
	it('aggregates static pages and layer detail entries', () => {
		const entries = collectPrerenderedUrls(ctx());
		expect(entries.length).toBe(6); // 3 static + 3 layers
	});

	it('returns empty for EN locale phase 1', () => {
		const entries = collectPrerenderedUrls(ctx({ locale: 'en' }));
		expect(entries).toEqual([]);
	});
});
