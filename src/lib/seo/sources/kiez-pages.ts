import type { SitemapEntry, SitemapSource } from '../sitemap-builder.js';
import { localizedPathname } from '../canonical.js';
import type { Locale } from '$lib/paraglide/runtime';
import { profileLastmod } from '../lastmod.js';

/**
 * Story 2.4 AC-6: Sitemap-Source für Kiez-Routes (143 LOR-Bezirksregionen).
 *
 * - `/kiez/{slug}`: priority 0.6, changefreq monthly.
 * - `lastmod` = späteres Datum aus Profil-Frontmatter (`generatedAt`, EN
 *   zusätzlich `translatedAt`) und `generatedAt` von `kiez-scores.json`
 *   (`profileLastmod`). Fehlen beide, entfällt `lastmod`. Das Datum des
 *   Grenzlayers (`fetchedAt`) sagt nichts über den Seiteninhalt.
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
	/** `lastmod` je Slug; fehlender Eintrag lässt `lastmod` weg. */
	readonly lastmodBySlug: Readonly<Record<string, string | undefined>>;
	readonly locale?: Locale;
}

export function buildKiezSitemapEntries(input: BuildKiezSitemapEntriesInput): SitemapEntry[] {
	if (input.slugs.length === 0) return [];
	const origin = input.origin.replace(/\/+$/, '');
	return input.slugs.map((slug) => {
		const lastmod = input.lastmodBySlug[slug];
		return {
			loc: `${origin}${localizedPathname(`/kiez/${slug}`, input.locale ?? 'de')}`,
			...(lastmod ? { lastmod } : {}),
			changefreq: 'monthly' as const,
			priority: PRIORITY
		};
	});
}

export const KIEZ_PAGES_SOURCE: SitemapSource = (ctx) => {
	const slugs = ctx.kiezSlugs;
	if (!slugs || slugs.length === 0) return [];
	const lastmodBySlug: Record<string, string | undefined> = {};
	for (const slug of slugs) {
		lastmodBySlug[slug] = profileLastmod(
			ctx.profileDates?.kiez[slug],
			ctx.locale,
			ctx.scoresGeneratedAt
		);
	}
	return buildKiezSitemapEntries({ origin: ctx.origin, slugs, lastmodBySlug, locale: ctx.locale });
};
