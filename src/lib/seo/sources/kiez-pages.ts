import type { SitemapEntry, SitemapSource } from '../sitemap-builder.js';
import { localizedPathname } from '../canonical.js';
import type { Locale } from '$lib/paraglide/runtime';

/**
 * Story 2.4 AC-6: Sitemap-Source für Kiez-Routes (143 LOR-Bezirksregionen).
 *
 * - `/kiez/{slug}`: priority 0.6, changefreq monthly.
 * - `lastmod` = `lor-bezirksregion`-Layer `fetchedAt` (fallback
 *   `sourceUpdatedAt`), da alle 143 Kiez-Pages aus derselben Quelle generiert
 *   werden. fetchedAt-first signalisiert Crawlern Freshness (SEO-Recrawl).
 *
 * i18n Block D1: liefert je Locale `localizedPathname`-URLs, das zentrale
 * Register-Gate in `collectPrerenderedUrls` filtert.
 *
 * Slugs werden zur Build-Zeit aus `lor-bezirksregion`-GeoJSON gelesen
 * (`BZR_NAME` → `normalizeSlug`) und via `SitemapSourceContext.kiezSlugs`
 * durchgereicht. Pure-Function-testbar.
 */

const PRIORITY = 0.6;

export interface BuildKiezSitemapEntriesInput {
	readonly origin: string;
	readonly slugs: readonly string[];
	readonly lastmod: string;
	readonly locale?: Locale;
}

export function buildKiezSitemapEntries(input: BuildKiezSitemapEntriesInput): SitemapEntry[] {
	if (input.slugs.length === 0) return [];
	const origin = input.origin.replace(/\/+$/, '');
	return input.slugs.map((slug) => ({
		loc: `${origin}${localizedPathname(`/kiez/${slug}`, input.locale ?? 'de')}`,
		lastmod: input.lastmod,
		changefreq: 'monthly' as const,
		priority: PRIORITY
	}));
}

export const KIEZ_PAGES_SOURCE: SitemapSource = (ctx) => {
	const slugs = ctx.kiezSlugs;
	if (!slugs || slugs.length === 0) return [];
	const lorLayer = ctx.manifest.layers.find((l) => l.slug === 'lor-bezirksregion');
	// fetchedAt (Daten-Refresh ins Build) vor sourceUpdatedAt (Daten-Vintage 2021):
	// truthful + signalisiert Crawlern Freshness statt "uralt, skip".
	const lastmod = lorLayer?.fetchedAt ?? lorLayer?.sourceUpdatedAt ?? ctx.buildTimestamp;
	return buildKiezSitemapEntries({ origin: ctx.origin, slugs, lastmod, locale: ctx.locale });
};
