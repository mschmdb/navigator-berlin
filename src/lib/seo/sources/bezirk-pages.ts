import type { SitemapEntry, SitemapSource } from '../sitemap-builder.js';
import { localizedPathname } from '../canonical.js';
import type { Locale } from '$lib/paraglide/runtime';
import { profileLastmod } from '../lastmod.js';

/**
 * Story 2.3 AC-6: Sitemap-Source für Bezirks-Routes (12 Bezirke).
 *
 * - `/bezirk/{slug}`: priority 0.7, changefreq monthly.
 * - `lastmod` = späteres Datum aus Profil-Frontmatter (`generatedAt`, EN
 *   zusätzlich `translatedAt`) und `generatedAt` von `kiez-scores.json`
 *   (`profileLastmod`). Fehlen beide, entfällt `lastmod`. Das Datum des
 *   Grenzlayers (`fetchedAt`) sagt nichts über den Seiteninhalt.
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
	/** `lastmod` je Slug; fehlender Eintrag lässt `lastmod` weg. */
	readonly lastmodBySlug: Readonly<Record<string, string | undefined>>;
	readonly locale?: Locale;
}

export function buildBezirkSitemapEntries(input: BuildBezirkSitemapEntriesInput): SitemapEntry[] {
	if (input.slugs.length === 0) return [];
	const origin = input.origin.replace(/\/+$/, '');
	return input.slugs.map((slug) => {
		const lastmod = input.lastmodBySlug[slug];
		return {
			loc: `${origin}${localizedPathname(`/bezirk/${slug}`, input.locale ?? 'de')}`,
			...(lastmod ? { lastmod } : {}),
			changefreq: 'monthly' as const,
			priority: PRIORITY
		};
	});
}

export const BEZIRK_PAGES_SOURCE: SitemapSource = (ctx) => {
	const slugs = ctx.bezirkSlugs;
	if (!slugs || slugs.length === 0) return [];
	const lastmodBySlug: Record<string, string | undefined> = {};
	for (const slug of slugs) {
		lastmodBySlug[slug] = profileLastmod(
			ctx.profileDates?.bezirk[slug],
			ctx.locale,
			ctx.scoresGeneratedAt
		);
	}
	return buildBezirkSitemapEntries({
		origin: ctx.origin,
		slugs,
		lastmodBySlug,
		locale: ctx.locale
	});
};
