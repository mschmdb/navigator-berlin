import { describe, it, expect } from 'vitest';
import {
	buildSitemapXml,
	buildSitemapIndexXml,
	collectPrerenderedUrls,
	STATIC_PAGES_SOURCE,
	WAHL_PORTAL_PAGE_SOURCE,
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
		const entries: SitemapEntry[] = [{ loc: 'https://navigator.berlin/x?a=1&b=2' }];
		const xml = buildSitemapXml(entries);
		expect(xml).toContain('https://navigator.berlin/x?a=1&amp;b=2');
	});

	it('returns valid empty urlset when no entries given', () => {
		const xml = buildSitemapXml([]);
		expect(xml).toContain('<urlset');
		expect(xml).toContain('</urlset>');
		expect(xml).not.toContain('<url>');
	});

	it('omits the xmlns:xhtml namespace when no entry has alternates', () => {
		const xml = buildSitemapXml([{ loc: 'https://navigator.berlin/methodik' }]);
		expect(xml).not.toContain('xmlns:xhtml');
		expect(xml).not.toContain('xhtml:link');
	});

	it('renders xhtml:link alternates + the xmlns:xhtml namespace for an entry with alternates', () => {
		const entries: SitemapEntry[] = [
			{
				loc: 'https://navigator.berlin/methodik',
				alternates: [
					{ hreflang: 'de', href: 'https://navigator.berlin/methodik' },
					{ hreflang: 'en', href: 'https://navigator.berlin/en/methodik' },
					{ hreflang: 'x-default', href: 'https://navigator.berlin/methodik' }
				]
			}
		];
		const xml = buildSitemapXml(entries);
		expect(xml).toContain(
			'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">'
		);
		expect(xml).toContain(
			'<xhtml:link rel="alternate" hreflang="de" href="https://navigator.berlin/methodik" />'
		);
		expect(xml).toContain(
			'<xhtml:link rel="alternate" hreflang="en" href="https://navigator.berlin/en/methodik" />'
		);
		expect(xml).toContain(
			'<xhtml:link rel="alternate" hreflang="x-default" href="https://navigator.berlin/methodik" />'
		);
	});

	it('only the sitemap-wide namespace is added once, even when just one of several entries has alternates', () => {
		const entries: SitemapEntry[] = [
			{ loc: 'https://navigator.berlin/lizenzen' },
			{
				loc: 'https://navigator.berlin/methodik',
				alternates: [{ hreflang: 'en', href: 'https://navigator.berlin/en/methodik' }]
			}
		];
		const xml = buildSitemapXml(entries);
		expect(xml.match(/xmlns:xhtml/g)?.length).toBe(1);
		expect(xml).toContain('<loc>https://navigator.berlin/lizenzen</loc>');
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
	it('emits root, /explore, Kühle-Orte-Landings, methodik, lizenzen for DE locale (Story 2.11 split)', () => {
		const entries = STATIC_PAGES_SOURCE(ctx());
		const locs = entries.map((e) => e.loc);
		expect(locs).toEqual([
			'https://navigator.berlin/',
			'https://navigator.berlin/explore',
			'https://navigator.berlin/kuehle-orte',
			'https://navigator.berlin/hitze',
			'https://navigator.berlin/methodik',
			'https://navigator.berlin/methodik/wahldaten',
			'https://navigator.berlin/lizenzen',
			'https://navigator.berlin/webmcp'
		]);
		expect(entries.every((e) => e.lastmod === '2026-05-16T08:00:00.000Z')).toBe(true);
	});

	it('skips EN locale entirely in phase 1 (returns empty)', () => {
		const entries = STATIC_PAGES_SOURCE(ctx({ locale: 'en' }));
		expect(entries).toEqual([]);
	});
});

describe('WAHL_PORTAL_PAGE_SOURCE (i18n Block B: /berlin-wahlen main page, split out of STATIC_PAGES_SOURCE)', () => {
	it('leer wenn wahlPortalEnabled nicht gesetzt ist (Flag aus)', () => {
		const entries = WAHL_PORTAL_PAGE_SOURCE(ctx());
		expect(entries).toEqual([]);
	});

	it('emittiert /berlin-wahlen (DE, kein Praefix) wenn wahlPortalEnabled=true', () => {
		const entries = WAHL_PORTAL_PAGE_SOURCE(ctx({ wahlPortalEnabled: true }));
		expect(entries).toHaveLength(1);
		expect(entries[0].loc).toBe('https://navigator.berlin/berlin-wahlen');
	});

	it('emittiert /en/berlin-wahlen fuer locale=en (die zentrale Register-Gate filtert spaeter, nicht hier)', () => {
		const entries = WAHL_PORTAL_PAGE_SOURCE(ctx({ wahlPortalEnabled: true, locale: 'en' }));
		expect(entries).toHaveLength(1);
		expect(entries[0].loc).toBe('https://navigator.berlin/en/berlin-wahlen');
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
	it('aggregates static pages and layer detail entries plus updates pages', () => {
		const entries = collectPrerenderedUrls(ctx());
		// 3 static + 3 layers + 1 updates-index + N updates-detail (real glob from _content/updates).
		// Floor: 6 minimum (static + layers) without the updates source.
		expect(entries.length).toBeGreaterThanOrEqual(6);
		const locs = entries.map((e) => e.loc);
		expect(locs).toContain('https://navigator.berlin/methodik');
		expect(locs).toContain('https://navigator.berlin/layer/bezirke');
	});

	it('returns empty for EN locale when nothing is registered as translated (e.g. wahlPortalEnabled off)', () => {
		const entries = collectPrerenderedUrls(ctx({ locale: 'en' }));
		expect(entries).toEqual([]);
	});

	it('i18n Block B: EN locale includes /en/berlin-wahlen once wahlPortalEnabled + register entry exist', () => {
		const entries = collectPrerenderedUrls(ctx({ locale: 'en', wahlPortalEnabled: true }));
		const locs = entries.map((e) => e.loc);
		expect(locs).toEqual(['https://navigator.berlin/en/berlin-wahlen']);
	});

	it('i18n Block B: /berlin-wahlen (DE) gets an EN alternate once registered + enabled', () => {
		const entries = collectPrerenderedUrls(ctx({ wahlPortalEnabled: true }));
		const portal = entries.find((e) => e.loc === 'https://navigator.berlin/berlin-wahlen');
		expect(portal?.alternates).toEqual([
			{ hreflang: 'de', href: 'https://navigator.berlin/berlin-wahlen' },
			{ hreflang: 'en', href: 'https://navigator.berlin/en/berlin-wahlen' },
			{ hreflang: 'x-default', href: 'https://navigator.berlin/berlin-wahlen' }
		]);
	});

	it('a page with no translated counterpart gets no alternates', () => {
		const entries = collectPrerenderedUrls(ctx());
		// `/impressum` und `/datenschutz` bleiben dauerhaft DE, stehen aber nicht in der Sitemap.
		// Als Sitemap-Seite ohne EN-Gegenstück dient eine Layer-Detailseite (Register-Eintrag
		// erst im Abschluss-Block).
		const layer = entries.find((e) => e.loc === 'https://navigator.berlin/layer/mietspiegel-2024');
		expect(layer).toBeDefined();
		expect(layer?.alternates).toBeUndefined();
	});

	it('i18n Block C4c: /hitze, /kuehle-orte und /lizenzen (DE) bekommen ihren EN-Alternate', () => {
		const entries = collectPrerenderedUrls(ctx());
		for (const path of ['/hitze', '/kuehle-orte', '/lizenzen']) {
			const entry = entries.find((e) => e.loc === `https://navigator.berlin${path}`);
			expect(entry?.alternates, path).toEqual([
				{ hreflang: 'de', href: `https://navigator.berlin${path}` },
				{ hreflang: 'en', href: `https://navigator.berlin/en${path}` },
				{ hreflang: 'x-default', href: `https://navigator.berlin${path}` }
			]);
		}
	});

	it('i18n Block C4a: /methodik (DE) gets its EN alternate once registered', () => {
		const entries = collectPrerenderedUrls(ctx());
		const methodik = entries.find((e) => e.loc === 'https://navigator.berlin/methodik');
		expect(methodik?.alternates).toEqual([
			{ hreflang: 'de', href: 'https://navigator.berlin/methodik' },
			{ hreflang: 'en', href: 'https://navigator.berlin/en/methodik' },
			{ hreflang: 'x-default', href: 'https://navigator.berlin/methodik' }
		]);
	});

	it('i18n Block B: a wahl-detail slug (DE) also gets its EN alternate', () => {
		const entries = collectPrerenderedUrls(
			ctx({ wahlen: [{ jahr: 2025, typ: 'btw', stimmtyp: 'zweitstimme' }] })
		);
		const detail = entries.find((e) => e.loc.endsWith('/berlin-wahlen/2025-btw-zweitstimme'));
		expect(detail?.alternates?.some((a) => a.hreflang === 'en')).toBe(true);
	});
});
