import type { SitemapEntry, SitemapSource } from '../sitemap-builder.js';

/**
 * Story 2.4 AC-6: Sitemap-Source für Kiez-Routes (143 LOR-Bezirksregionen).
 *
 * - `/kiez/{slug}`: priority 0.6, changefreq monthly.
 * - `lastmod` = `lor-bezirksregion`-Layer `sourceUpdatedAt` (fallback
 *   `fetchedAt`), da alle 143 Kiez-Pages aus derselben Quelle generiert werden.
 *
 * Phase 1 DE-only (memory `project_i18n_phase_1_de_only`): EN-Routes existieren
 * nicht. Source liefert für `locale === 'en'` einen leeren Array.
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
}

export function buildKiezSitemapEntries(input: BuildKiezSitemapEntriesInput): SitemapEntry[] {
	if (input.slugs.length === 0) return [];
	const origin = input.origin.replace(/\/+$/, '');
	return input.slugs.map((slug) => ({
		loc: `${origin}/kiez/${slug}`,
		lastmod: input.lastmod,
		changefreq: 'monthly' as const,
		priority: PRIORITY
	}));
}

export const KIEZ_PAGES_SOURCE: SitemapSource = (ctx) => {
	if (ctx.locale !== 'de') return [];
	const slugs = ctx.kiezSlugs;
	if (!slugs || slugs.length === 0) return [];
	const lorLayer = ctx.manifest.layers.find((l) => l.slug === 'lor-bezirksregion');
	const lastmod = lorLayer?.sourceUpdatedAt ?? lorLayer?.fetchedAt ?? ctx.buildTimestamp;
	return buildKiezSitemapEntries({ origin: ctx.origin, slugs, lastmod });
};
