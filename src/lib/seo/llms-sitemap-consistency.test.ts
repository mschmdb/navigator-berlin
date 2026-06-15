/**
 * Story 2.8 AC-5 / T3.3: Konsistenz-Test zwischen Sitemap und llms.txt.
 *
 * Sitemap (Story 2.1) und llms.txt müssen die gleichen kanonischen Page-URLs
 * exponieren. Drift = Drift-Risiko in beiden SEO- und LLM-Funnels.
 *
 * Erwartung Phase 1: Sitemap-URLs ⊂ llms.txt-URLs (llms.txt darf Bezirk- /
 * Kiez-Pages enthalten BEVOR die Sitemap-Source für sie existiert; Sitemap-
 * Routes ohne korrespondierende llms-Entry dürfen nicht.
 *
 * Da Sitemap heute nur Static + Layer sourct (Stories 2.3/2.4 Bezirk-/Kiez-
 * Sources kommen separat), ist die Schnittmenge zur Zeit Static + Layer.
 */

import { describe, it, expect } from 'vitest';
import type { Manifest } from '$lib/data/types.js';
import { collectPrerenderedUrls } from './sitemap-builder.js';
import { collectLlmsSourceEntries, type LlmsSourceContext } from './llms-builder.js';

const fixtureManifest: Manifest = {
	schemaVersion: 1,
	generatedAt: '2026-05-16T07:03:25.286Z',
	layers: [
		{
			slug: 'laerm-2023',
			filename: 'laerm-2023.abc.geojson',
			sourceUrl: 'https://example.com/laerm.geojson',
			fetchedAt: '2026-05-16T06:56:28.400Z',
			license: 'dl-de/zero-2-0',
			sha256: 'abc',
			bundleGroup: 'C: Umwelt',
			zoomThresholds: { min: 8, max: 12 },
			geometryType: 'Polygon',
			featureCount: 542
		},
		{
			slug: 'bezirke',
			filename: 'bezirke.def.geojson',
			sourceUrl: 'https://example.com/bezirke.geojson',
			fetchedAt: '2026-05-16T06:56:28.400Z',
			license: 'dl-de/zero-2-0',
			sha256: 'def',
			bundleGroup: 'A: Boundaries',
			zoomThresholds: { min: 8, max: 12 },
			geometryType: 'Polygon',
			featureCount: 12
		}
	]
};

const ctx: LlmsSourceContext = {
	origin: 'https://navigator.berlin',
	locale: 'de',
	manifest: fixtureManifest,
	buildTimestamp: '2026-05-16T07:00:00.000Z',
	bezirke: [],
	kieze: [],
	layer: []
};

describe('Sitemap ↔ llms.txt URL-Konsistenz', () => {
	it('every sitemap URL (outside feed-domains) is also exposed via llms.txt source entries', () => {
		// /updates-Routes haben eigene LLM-Discovery via RSS/Atom/JSON-Feed (Story 2.13).
		// llms.txt enumeriert nicht jeden Blog-Post, sondern editoriale Site-Struktur.
		const FEED_DOMAINS = ['/updates'];
		const isFeedRoute = (loc: string) =>
			FEED_DOMAINS.some((prefix) => loc.startsWith(`${ctx.origin}${prefix}`));

		const sitemapUrls = new Set(
			collectPrerenderedUrls({
				origin: ctx.origin,
				locale: ctx.locale,
				manifest: ctx.manifest,
				buildTimestamp: ctx.buildTimestamp
			})
				.map((e) => e.loc)
				.filter((loc) => !isFeedRoute(loc))
		);

		const llmsUrls = new Set(collectLlmsSourceEntries(ctx).map((e) => e.loc));

		const missing: string[] = [];
		for (const url of sitemapUrls) {
			if (!llmsUrls.has(url)) missing.push(url);
		}
		expect(missing).toEqual([]);
	});

	it('sitemap + llms.txt agree on layer-detail URLs from manifest', () => {
		const sitemap = collectPrerenderedUrls({
			origin: ctx.origin,
			locale: ctx.locale,
			manifest: ctx.manifest,
			buildTimestamp: ctx.buildTimestamp
		});
		const llms = collectLlmsSourceEntries(ctx);

		const sitemapLayerUrls = sitemap.map((e) => e.loc).filter((u) => u.includes('/layer/'));
		const llmsLayerUrls = llms.filter((e) => e.section === 'layer').map((e) => e.loc);

		expect(new Set(sitemapLayerUrls)).toEqual(new Set(llmsLayerUrls));
	});

	it('static page URLs (/, /methodik, /lizenzen) match between sitemap and llms', () => {
		const sitemap = collectPrerenderedUrls({
			origin: ctx.origin,
			locale: ctx.locale,
			manifest: ctx.manifest,
			buildTimestamp: ctx.buildTimestamp
		});
		const llms = collectLlmsSourceEntries(ctx);

		const staticPaths = ['/', '/methodik', '/lizenzen'];
		for (const path of staticPaths) {
			const target = `${ctx.origin}${path}`;
			expect(sitemap.some((e) => e.loc === target)).toBe(true);
			expect(llms.some((e) => e.loc === target)).toBe(true);
		}
	});

	it('llms.txt may include bezirk-/kiez-URLs that sitemap does not (story 2.3/2.4 future)', () => {
		const ctxWithExtras: LlmsSourceContext = {
			...ctx,
			bezirke: [{ slug: 'mitte', name: 'Mitte', markdown: '## Bezirk Mitte\n' }],
			kieze: [
				{
					slug: 'boxhagener-kiez',
					name: 'Boxhagener Kiez',
					bezirkSlug: 'friedrichshain-kreuzberg',
					markdown: '## Kiez Boxi\n',
					topRank: 1
				}
			]
		};

		const llms = collectLlmsSourceEntries(ctxWithExtras);
		// llms enthält Bezirk + Kiez, Sitemap (heute) nicht
		expect(llms.some((e) => e.section === 'bezirk')).toBe(true);
		expect(llms.some((e) => e.section === 'kiez')).toBe(true);
	});
});
