import type { SitemapEntry, SitemapSource } from '../sitemap-builder.js';

/**
 * Story 2.9b T4.3: Sitemap-Source für die Ranking-Page.
 *
 * Phase-1 DE-only (Memory `project_i18n_phase_1_de_only`): nur eine
 * Locale-Variante. Liefert für locale=en leeres Array.
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
}

export function buildRankingSitemapEntry(input: BuildRankingSitemapEntryInput): SitemapEntry {
	const origin = input.origin.replace(/\/+$/, '');
	return {
		loc: `${origin}${PATH}`,
		lastmod: input.lastmod,
		changefreq: 'monthly' as const,
		priority: PRIORITY
	};
}

export const RANKING_PAGE_SOURCE: SitemapSource = (ctx) => {
	if (ctx.locale !== 'de') return [];
	return [buildRankingSitemapEntry({ origin: ctx.origin, lastmod: ctx.buildTimestamp })];
};
