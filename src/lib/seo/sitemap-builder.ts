import type { Manifest } from '$lib/data/types.js';
import { hasLayerDetailPage } from '$lib/data/layer-visibility.js';
import { baseLocale, locales, type Locale } from '$lib/paraglide/runtime';
import { isRouteTranslated, translatedLocalesFor } from './translation-register.js';
import { buildHreflangCluster } from './hreflang.js';
import { localizedPathname } from './canonical.js';
import { lastmodOfLayer, type ProfileDates } from './lastmod.js';

export interface SitemapAlternate {
	readonly hreflang: Locale | 'x-default';
	readonly href: string;
}

export interface SitemapEntry {
	readonly loc: string;
	readonly lastmod?: string;
	readonly changefreq?: 'daily' | 'weekly' | 'monthly' | 'yearly';
	readonly priority?: number;
	/**
	 * `xhtml:link rel="alternate"` entries for pages with a translated
	 * counterpart. Empty/omitted in Block A because the translation register
	 * (`translation-register.ts`) ships no entries yet.
	 */
	readonly alternates?: readonly SitemapAlternate[];
}

export interface SitemapIndexEntry {
	readonly loc: string;
	readonly lastmod?: string;
}

export interface SitemapSourceContext {
	readonly origin: string;
	readonly locale: Locale;
	readonly manifest: Manifest;
	/** Profil-Frontmatter-Daten je Slug (`generatedAt`, `translatedAt`) für Kiez/Bezirk-`lastmod`. */
	readonly profileDates?: {
		readonly kiez: Readonly<Record<string, ProfileDates>>;
		readonly bezirk: Readonly<Record<string, ProfileDates>>;
	};
	/** `generatedAt` von `kiez-scores.json` (Score-Stand der Kiez-/Bezirksseiten). */
	readonly scoresGeneratedAt?: string;
	/** Reserved for story 2.3 (bezirks-pages). Sources may consume this when present. */
	readonly bezirkSlugs?: readonly string[];
	/** Reserved for story 2.4 (kiez-pages). */
	readonly kiezSlugs?: readonly string[];
	/** Story 6.4, Story 16: wahl-Rows aus wahl-Tabelle für /berlin-wahlen/[slug]-Routes. */
	readonly wahlen?: readonly {
		readonly jahr: number;
		readonly typ: 'btw' | 'agh' | 'bvv';
		readonly stimmtyp: 'erststimme' | 'zweitstimme' | 'einstimme';
		/** Story 16: `lastmod`-Quelle, ohne Wert entfällt `lastmod` (`wahl-detail-pages.ts`). */
		readonly sourceUpdatedAt?: string | null;
	}[];
	/**
	 * Story 3 (Portal-Skeleton /berlin-wahlen): `featureFlags.wahlPortal`.
	 * Route rendert immer, taucht aber erst bei aktivem Flag in der Sitemap
	 * auf (muss synchron mit `LlmsSourceContext.wahlPortalEnabled` bleiben,
	 * sonst bricht `llms-sitemap-consistency.test.ts`).
	 */
	readonly wahlPortalEnabled?: boolean;
}

export type SitemapSource = (ctx: SitemapSourceContext) => SitemapEntry[];

/**
 * Escape XML special chars in text content / attribute values.
 * Per sitemap-0.9 spec, `&`, `<`, `>`, `'`, `"` must be entity-encoded.
 */
function escapeXml(input: string): string {
	return input
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}

/**
 * Render a list of {@link SitemapEntry} into Sitemap-Protocol-0.9 XML.
 *
 * Empty entries return a valid empty `<urlset>` (acceptable per spec).
 */
export function buildSitemapXml(entries: readonly SitemapEntry[]): string {
	const hasAlternates = entries.some((e) => (e.alternates?.length ?? 0) > 0);
	const urls = entries.map((e) => {
		const parts: string[] = [`<loc>${escapeXml(e.loc)}</loc>`];
		for (const alt of e.alternates ?? []) {
			parts.push(
				`<xhtml:link rel="alternate" hreflang="${escapeXml(alt.hreflang)}" href="${escapeXml(alt.href)}" />`
			);
		}
		if (e.lastmod) parts.push(`<lastmod>${escapeXml(e.lastmod)}</lastmod>`);
		if (e.changefreq) parts.push(`<changefreq>${e.changefreq}</changefreq>`);
		if (typeof e.priority === 'number') parts.push(`<priority>${e.priority.toFixed(1)}</priority>`);
		return `\t<url>\n\t\t${parts.join('\n\t\t')}\n\t</url>`;
	});
	const urlsetOpenTag = hasAlternates
		? '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">'
		: '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
	return ['<?xml version="1.0" encoding="UTF-8"?>', urlsetOpenTag, ...urls, '</urlset>', ''].join(
		'\n'
	);
}

/**
 * Render a sitemap-index XML (per-language sub-sitemaps).
 */
export function buildSitemapIndexXml(entries: readonly SitemapIndexEntry[]): string {
	const sitemaps = entries.map((e) => {
		const parts: string[] = [`<loc>${escapeXml(e.loc)}</loc>`];
		if (e.lastmod) parts.push(`<lastmod>${escapeXml(e.lastmod)}</lastmod>`);
		return `\t<sitemap>\n\t\t${parts.join('\n\t\t')}\n\t</sitemap>`;
	});
	return [
		'<?xml version="1.0" encoding="UTF-8"?>',
		'<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
		...sitemaps,
		'</sitemapindex>',
		''
	].join('\n');
}

/**
 * Sources the static pages: `/`, `/explore`, `/methodik`, `/lizenzen`, ...
 *
 * i18n Block D1: emits an entry for every locale (`localizedPathname`). The
 * central register gate in {@link collectPrerenderedUrls} drops every
 * non-base-locale entry that `translation-register.ts` does not mark as
 * translated, so this source needs no `ctx.locale` guard. `/impressum` and
 * `/datenschutz` stay out (DE-only legal pages), and so does the `noindex`
 * page `/methodik/cross-layer-templates`.
 *
 * No `lastmod` (S5): these pages carry no content date. Neither the build
 * time nor the commit history (absent in the Docker build) says anything
 * about content changes.
 */
export const STATIC_PAGES_SOURCE: SitemapSource = (ctx) => {
	const page = (
		path: string,
		changefreq: SitemapEntry['changefreq'],
		priority?: number
	): SitemapEntry => ({
		loc: `${ctx.origin}${localizedPathname(path, ctx.locale)}`,
		changefreq,
		...(priority === undefined ? {} : { priority })
	});
	return [
		page('/', 'weekly', 1.0),
		page('/explore', 'weekly', 0.9),
		// Saison-Landings (Epic 16, Kälte): saisonale Suchintention, deshalb hohe Priorität
		// und wöchentliche Change-Frequency. Die Kühle-Orte-Landing leitet seit GH-110 auf /hitze um.
		page('/hitze', 'weekly', 0.8),
		page('/kaelte', 'weekly', 0.8),
		// S7: Übersichtsseiten mit Linklisten auf alle Kiez-, Bezirks- und Layer-Seiten.
		page('/kieze', 'monthly', 0.7),
		page('/bezirke', 'monthly', 0.7),
		page('/daten', 'monthly', 0.7),
		page('/methodik', 'monthly'),
		page('/methodik/kiez-score', 'monthly'),
		// Story 3: Bestandslücke geschlossen, die Seite existiert bereits (Story 2).
		page('/methodik/wahldaten', 'monthly'),
		page('/lizenzen', 'monthly'),
		page('/architektur', 'monthly'),
		page('/webmcp', 'monthly'),
		page('/ueber', 'monthly')
	];
};

/**
 * Sources the Wahlportal main page (`/berlin-wahlen`).
 *
 * i18n Block B: separate from {@link STATIC_PAGES_SOURCE} because this is
 * the first static (non-detail-page) route registered as translated
 * (`translation-register.ts`) -- it emits an entry for every active locale
 * (locale-prefixed `loc` via `localizedPathname`), gated only by
 * `wahlPortalEnabled`. `collectPrerenderedUrls` filters out any
 * non-base-locale entry that is not actually registered as translated, so
 * this source itself needs no `ctx.locale` guard.
 */
export const WAHL_PORTAL_PAGE_SOURCE: SitemapSource = (ctx) => {
	if (!ctx.wahlPortalEnabled) return [];
	return [
		{
			loc: `${ctx.origin}${localizedPathname('/berlin-wahlen', ctx.locale)}`,
			changefreq: 'weekly' as const,
			priority: 0.8
		}
	];
};

/**
 * Sources one entry per manifest layer.
 *
 * `lastmod` = `sourceUpdatedAt`, but `fetchedAt` when that is missing, invalid
 * or a year placeholder (`YYYY-01-01`, S8); future dates and invalid values
 * drop out, none valid drops `lastmod`.
 * i18n Block D1: emits `localizedPathname` URLs for every locale, the
 * register gate filters.
 */
export const LAYER_DETAIL_SOURCE: SitemapSource = (ctx) => {
	// Build-only-Layer (weder Karte noch Inspector) haben keine Detail-Seite → nicht in Sitemap.
	return ctx.manifest.layers
		.filter((layer) => hasLayerDetailPage(layer))
		.map((layer) => {
			const lastmod = lastmodOfLayer(layer.sourceUpdatedAt, layer.fetchedAt);
			return {
				loc: `${ctx.origin}${localizedPathname(`/layer/${layer.slug}`, ctx.locale)}`,
				...(lastmod ? { lastmod } : {}),
				changefreq: 'monthly' as const
			};
		});
};

/**
 * All sources concatenated. Future stories (2.4 kiez, 2.9b ranking)
 * register new sources here without editing the per-language endpoint.
 *
 * Story 2.13 (`UPDATES_PAGES_SOURCE`): `/updates`-Index + alle `/updates/{slug}` Detail-Routes
 * (`$lib/seo/sources/updates.ts`, Build-Time-MD-Glob).
 *
 * Story 2.3 (`BEZIRK_PAGES_SOURCE`): 12 `/bezirk/{slug}` Detail-Routes; konsumiert
 * Slug-Liste via `SitemapSourceContext.bezirkSlugs` (Endpoint-Route ist verantwortlich
 * fürs Slug-Reading aus dem Bezirks-GeoJSON).
 */
import { UPDATES_PAGES_SOURCE } from './sources/updates.js';
import { STORIES_PAGES_SOURCE } from './sources/stories.js';
import { BEZIRK_PAGES_SOURCE } from './sources/bezirk-pages.js';
import { KIEZ_PAGES_SOURCE } from './sources/kiez-pages.js';
import { RANKING_PAGE_SOURCE } from './sources/ranking-page.js';
import { WAHL_DETAIL_SOURCE } from './sources/wahl-detail-pages.js';

const ALL_SOURCES: readonly SitemapSource[] = [
	STATIC_PAGES_SOURCE,
	WAHL_PORTAL_PAGE_SOURCE,
	LAYER_DETAIL_SOURCE,
	UPDATES_PAGES_SOURCE,
	STORIES_PAGES_SOURCE,
	BEZIRK_PAGES_SOURCE,
	KIEZ_PAGES_SOURCE,
	RANKING_PAGE_SOURCE,
	WAHL_DETAIL_SOURCE
];

function pathnameFromLoc(loc: string, originPrefix: string): string {
	return loc.startsWith(originPrefix) ? loc.slice(originPrefix.length) || '/' : loc;
}

/**
 * Central register gate: every source emits localized URLs for every
 * locale (i18n Block D1). This is the authoritative check -- only pages `translation-register.ts`
 * actually marks as translated survive here for a non-base locale. Prevents
 * an un-registered page from silently appearing in `sitemap-en.xml` just
 * because a source forgot the guard.
 *
 * i18n Block B: also attaches `xhtml:link` alternates (AC "Sitemap ...
 * xhtml:link-Alternates") to every entry that has a real cross-locale
 * counterpart per the translation register -- reuses `buildHreflangCluster`
 * (the same cluster `SeoHead` renders into `<link rel="alternate">`) so both
 * stay consistent by construction. A page with no translated counterpart
 * gets no `alternates` (matches Block A's "kein hreflang-Paar" behavior).
 */
export function collectPrerenderedUrls(ctx: SitemapSourceContext): SitemapEntry[] {
	const out: SitemapEntry[] = [];
	for (const source of ALL_SOURCES) {
		out.push(...source(ctx));
	}
	const originPrefix = ctx.origin.replace(/\/+$/, '');
	const filtered =
		ctx.locale === baseLocale
			? out
			: out.filter((entry) =>
					isRouteTranslated(pathnameFromLoc(entry.loc, originPrefix), ctx.locale)
				);
	return filtered.map((entry) => {
		const pathname = pathnameFromLoc(entry.loc, originPrefix);
		const translated = translatedLocalesFor(pathname, locales);
		if (translated.length === 0) return entry;
		const alternates = buildHreflangCluster({
			origin: ctx.origin,
			pathname,
			locales: [baseLocale, ...translated]
		});
		return { ...entry, alternates };
	});
}
