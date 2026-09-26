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

	it('Story 3: /berlin-wahlen fehlt in beiden solange wahlPortalEnabled aus ist', () => {
		const sitemapUrls = collectPrerenderedUrls({
			origin: ctx.origin,
			locale: ctx.locale,
			manifest: ctx.manifest,
			buildTimestamp: ctx.buildTimestamp
		}).map((e) => e.loc);
		const llmsUrls = collectLlmsSourceEntries(ctx).map((e) => e.loc);
		expect(sitemapUrls).not.toContain(`${ctx.origin}/berlin-wahlen`);
		expect(llmsUrls).not.toContain(`${ctx.origin}/berlin-wahlen`);
	});

	it('Story 3: /berlin-wahlen erscheint in beiden gemeinsam wenn wahlPortalEnabled an ist', () => {
		const sitemapUrls = collectPrerenderedUrls({
			origin: ctx.origin,
			locale: ctx.locale,
			manifest: ctx.manifest,
			buildTimestamp: ctx.buildTimestamp,
			wahlPortalEnabled: true
		}).map((e) => e.loc);
		const llmsUrls = collectLlmsSourceEntries({ ...ctx, wahlPortalEnabled: true }).map(
			(e) => e.loc
		);
		expect(sitemapUrls).toContain(`${ctx.origin}/berlin-wahlen`);
		expect(llmsUrls).toContain(`${ctx.origin}/berlin-wahlen`);
	});

	// Review-Fund: der Wahl-Detail-Zweig (ctx.wahlen) war in diesem
	// Konsistenz-Test ungetestet.
	// i18n Block A: EN-Locale blieb für beide Builder leer, weil das
	// Übersetzungs-Register (`translation-register.ts`) noch keine Seite
	// markierte.
	// i18n Block B: das Register markiert jetzt /berlin-wahlen + Detailseiten
	// für `en` -- die Sitemap folgt dem Register (Single Source of Truth),
	// llms.txt bleibt für `en` bewusst leer (Plan-Entscheidung „EN-llms.txt
	// NICHT in v1", `_user-input/plan-i18n-de-en-2026-08-22.md`). Die beiden
	// Builder dürfen hier also auseinanderlaufen -- die Konsistenz-Regel
	// dieser Datei gilt nur für locale=de.
	it('i18n Block B: locale=en liefert fuer die Sitemap /en/berlin-wahlen, llms.txt bleibt bewusst leer', () => {
		const sitemapUrls = collectPrerenderedUrls({
			origin: ctx.origin,
			locale: 'en',
			manifest: ctx.manifest,
			buildTimestamp: ctx.buildTimestamp,
			wahlPortalEnabled: true
		});
		const llmsUrls = collectLlmsSourceEntries({ ...ctx, locale: 'en', wahlPortalEnabled: true });
		expect(sitemapUrls.map((e) => e.loc)).toEqual([`${ctx.origin}/en/berlin-wahlen`]);
		expect(llmsUrls).toEqual([]);
	});

	it('i18n Block B: eine EN-Wahl-Detailseite landet nur in der Sitemap (registriert), nicht in llms.txt', () => {
		const sitemapUrls = collectPrerenderedUrls({
			origin: ctx.origin,
			locale: 'en',
			manifest: ctx.manifest,
			buildTimestamp: ctx.buildTimestamp,
			wahlen: [{ jahr: 2025, typ: 'btw', stimmtyp: 'zweitstimme' }]
		}).map((e) => e.loc);
		const llmsUrls = collectLlmsSourceEntries({
			...ctx,
			locale: 'en',
			wahlen: [
				{
					slug: '2025-btw-zweitstimme',
					name: 'Bundestagswahl 2025 · Zweitstimme',
					short: 'Quelle Bundeswahlleiterin',
					markdown: '## Bundestagswahl 2025 · Zweitstimme\n'
				}
			]
		}).map((e) => e.loc);
		expect(sitemapUrls).toContain(`${ctx.origin}/en/berlin-wahlen/2025-btw-zweitstimme`);
		expect(llmsUrls).toEqual([]);
	});

	it('Story 16: /berlin-wahlen/<slug> erscheint konsistent in Sitemap und llms.txt, kein /wahl-Pfad', () => {
		const sitemapUrls = collectPrerenderedUrls({
			origin: ctx.origin,
			locale: ctx.locale,
			manifest: ctx.manifest,
			buildTimestamp: ctx.buildTimestamp,
			wahlen: [{ jahr: 2025, typ: 'btw', stimmtyp: 'zweitstimme' }]
		}).map((e) => e.loc);
		const llmsUrls = collectLlmsSourceEntries({
			...ctx,
			wahlen: [
				{
					slug: '2025-btw-zweitstimme',
					name: 'Bundestagswahl 2025 · Zweitstimme',
					short: 'Quelle Bundeswahlleiterin',
					markdown: '## Bundestagswahl 2025 · Zweitstimme\n'
				}
			]
		}).map((e) => e.loc);

		const expectedUrl = `${ctx.origin}/berlin-wahlen/2025-btw-zweitstimme`;
		expect(sitemapUrls).toContain(expectedUrl);
		expect(llmsUrls).toContain(expectedUrl);
		expect(sitemapUrls.some((u) => u.includes('/wahl/'))).toBe(false);
		expect(llmsUrls.some((u) => u.includes('/wahl/'))).toBe(false);
	});
});
