import type { SitemapEntry, SitemapSource } from '../sitemap-builder.js';
import { localizedPathname } from '../canonical.js';
import type { Locale } from '$lib/paraglide/runtime';

/**
 * Story 2.9b T4.3: Sitemap-Source für die Ranking-Page.
 *
 * i18n Block D1: liefert je Locale `localizedPathname`-URLs, das zentrale
 * Register-Gate in `collectPrerenderedUrls` filtert.
 *
 * Page ist Editorial-Single-Page, deshalb feste URL + monatlich-changefreq.
 * `lastmod` greift auf `buildTimestamp` zurück weil keine eigene
 * Datenquelle die Page-Aktualität feiner trackt.
 */

const PATH = '/umwelt-infrastruktur-score';
const PRIORITY = 0.7;

export interface BuildRankingSitemapEntryInput {
	readonly origin: string;
	readonly lastmod: string;
	readonly locale?: Locale;
}

export function buildRankingSitemapEntry(input: BuildRankingSitemapEntryInput): SitemapEntry {
	const origin = input.origin.replace(/\/+$/, '');
	return {
		loc: `${origin}${localizedPathname(PATH, input.locale ?? 'de')}`,
		lastmod: input.lastmod,
		changefreq: 'monthly' as const,
		priority: PRIORITY
	};
}

export const RANKING_PAGE_SOURCE: SitemapSource = (ctx) => {
	return [
		buildRankingSitemapEntry({
			origin: ctx.origin,
			lastmod: ctx.buildTimestamp,
			locale: ctx.locale
		})
	];
};
