import type { SitemapEntry, SitemapSource } from '../sitemap-builder.js';
import { localizedPathname } from '../canonical.js';
import type { Locale } from '$lib/paraglide/runtime';

/**
 * Story 2.3 AC-6: Sitemap-Source für Bezirks-Routes (12 Bezirke).
 *
 * - `/bezirk/{slug}`: priority 0.7, changefreq monthly.
 * - `lastmod` = `bezirke`-Layer `fetchedAt` (fallback `sourceUpdatedAt`),
 *   da alle 12 Bezirks-Pages aus derselben Quelle generiert werden.
 *   fetchedAt-first signalisiert Crawlern Freshness (SEO-Recrawl).
 *
 * i18n Block D1: liefert je Locale `localizedPathname`-URLs, das zentrale
 * Register-Gate in `collectPrerenderedUrls` filtert.
 *
 * Die 12 Slugs werden zur Build-Zeit aus dem Bezirks-GeoJSON gelesen
 * (`Gemeinde_name`-Property → `normalizeSlug`) und via
 * `SitemapSourceContext.bezirkSlugs` durchgereicht. Das Lesen passiert in der
 * Sitemap-Endpoint-Route, nicht hier — pure-function-Test-bar.
 */

const PRIORITY = 0.7;

export interface BuildBezirkSitemapEntriesInput {
	readonly origin: string;
	readonly slugs: readonly string[];
	readonly lastmod: string;
	readonly locale?: Locale;
}

export function buildBezirkSitemapEntries(input: BuildBezirkSitemapEntriesInput): SitemapEntry[] {
	if (input.slugs.length === 0) return [];
	const origin = input.origin.replace(/\/+$/, '');
	return input.slugs.map((slug) => ({
		loc: `${origin}${localizedPathname(`/bezirk/${slug}`, input.locale ?? 'de')}`,
		lastmod: input.lastmod,
		changefreq: 'monthly' as const,
		priority: PRIORITY
	}));
}

export const BEZIRK_PAGES_SOURCE: SitemapSource = (ctx) => {
	const slugs = ctx.bezirkSlugs;
	if (!slugs || slugs.length === 0) return [];
	const bezirkeLayer = ctx.manifest.layers.find((l) => l.slug === 'bezirke');
	// fetchedAt (Daten-Refresh ins Build) vor sourceUpdatedAt (Daten-Vintage 2024):
	// truthful + signalisiert Crawlern Freshness statt "uralt, skip".
	const lastmod = bezirkeLayer?.fetchedAt ?? bezirkeLayer?.sourceUpdatedAt ?? ctx.buildTimestamp;
	return buildBezirkSitemapEntries({ origin: ctx.origin, slugs, lastmod, locale: ctx.locale });
};
