import type { Manifest } from '$lib/data/types.js';
import { baseLocale, locales, type Locale } from '$lib/paraglide/runtime';
import { isRouteTranslated, translatedLocalesFor } from './translation-register.js';
import { buildHreflangCluster } from './hreflang.js';
import { localizedPathname } from './canonical.js';

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
	/**
	 * ISO-8601 build timestamp used as fallback `lastmod` for pages without a
	 * dedicated data-source (e.g. methodik / lizenzen / root).
	 */
	readonly buildTimestamp: string;
	/** Reserved for story 2.3 (bezirks-pages). Sources may consume this when present. */
	readonly bezirkSlugs?: readonly string[];
	/** Reserved for story 2.4 (kiez-pages). */
	readonly kiezSlugs?: readonly string[];
	/** Story 6.4, Story 16: wahl-Rows aus wahl-Tabelle für /berlin-wahlen/[slug]-Routes. */
	readonly wahlen?: readonly {
		readonly jahr: number;
		readonly typ: 'btw' | 'agh' | 'bvv';
		readonly stimmtyp: 'erststimme' | 'zweitstimme' | 'einstimme';
		/** Story 16: `lastmod`-Quelle, sonst Jahres-Fallback (`wahl-detail-pages.ts`). */
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
 * Sources DE-only static pages: `/`, `/methodik`, `/lizenzen`.
 *
 * Phase 1 (memory `project_i18n_phase_1_de_only`): EN routes do not exist, so
 * we return an empty list for `locale === 'en'`. Story 3.1/3.2 will lift this
 * restriction by adding `/en/...` pages and remapping the source accordingly.
 *
 * `lastmod` uses the build timestamp as recommended by story-2.1 dev-notes
 * (Open-Question 4 resolution: build-timestamp over `git log` to avoid flaky
 * `child_process.execSync` calls during prerender).
 */
export const STATIC_PAGES_SOURCE: SitemapSource = (ctx) => {
	if (ctx.locale !== baseLocale) return [];
	return [
		{ loc: `${ctx.origin}/`, lastmod: ctx.buildTimestamp, changefreq: 'weekly', priority: 1.0 },
		{
			loc: `${ctx.origin}/explore`,
			lastmod: ctx.buildTimestamp,
			changefreq: 'weekly',
			priority: 0.9
		},
		// Kühle-Orte-Landings (Epic 16): in-Atlas + Hitze-Spin-off. Saisonale Suchintention,
		// deshalb hohe Priorität und wöchentliche Change-Frequency.
		{
			loc: `${ctx.origin}/kuehle-orte`,
			lastmod: ctx.buildTimestamp,
			changefreq: 'weekly',
			priority: 0.8
		},
		{
			loc: `${ctx.origin}/hitze`,
			lastmod: ctx.buildTimestamp,
			changefreq: 'weekly',
			priority: 0.8
		},
		{ loc: `${ctx.origin}/methodik`, lastmod: ctx.buildTimestamp, changefreq: 'monthly' },
		// Story 3: Bestandslücke geschlossen, die Seite existiert bereits (Story 2).
		{
			loc: `${ctx.origin}/methodik/wahldaten`,
			lastmod: ctx.buildTimestamp,
			changefreq: 'monthly'
		},
		{ loc: `${ctx.origin}/lizenzen`, lastmod: ctx.buildTimestamp, changefreq: 'monthly' },
		{ loc: `${ctx.origin}/webmcp`, lastmod: ctx.buildTimestamp, changefreq: 'monthly' }
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
			lastmod: ctx.buildTimestamp,
			changefreq: 'weekly' as const,
			priority: 0.8
		}
	];
};

/**
 * Sources one entry per manifest layer.
 *
 * Uses `fetchedAt` from each layer as `lastmod` (per story-2.1 dev-notes).
 * Phase 1: returns empty list for `locale === 'en'`.
 */
export const LAYER_DETAIL_SOURCE: SitemapSource = (ctx) => {
	if (ctx.locale !== baseLocale) return [];
	// Build-only-Layer (weder Karte noch Inspector) haben keine Detail-Seite → nicht in Sitemap.
	return ctx.manifest.layers
		.filter((layer) => !(layer.inspectorRelevant === false && layer.mapRelevant === false))
		.map((layer) => ({
			loc: `${ctx.origin}/layer/${layer.slug}`,
			lastmod: layer.fetchedAt,
			changefreq: 'monthly' as const
		}));
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
import { BEZIRK_PAGES_SOURCE } from './sources/bezirk-pages.js';
import { KIEZ_PAGES_SOURCE } from './sources/kiez-pages.js';
import { RANKING_PAGE_SOURCE } from './sources/ranking-page.js';
import { WAHL_DETAIL_SOURCE } from './sources/wahl-detail-pages.js';

const ALL_SOURCES: readonly SitemapSource[] = [
	STATIC_PAGES_SOURCE,
	WAHL_PORTAL_PAGE_SOURCE,
	LAYER_DETAIL_SOURCE,
	UPDATES_PAGES_SOURCE,
	BEZIRK_PAGES_SOURCE,
	KIEZ_PAGES_SOURCE,
	RANKING_PAGE_SOURCE,
	WAHL_DETAIL_SOURCE
];

function pathnameFromLoc(loc: string, originPrefix: string): string {
	return loc.startsWith(originPrefix) ? loc.slice(originPrefix.length) || '/' : loc;
}

/**
 * Central register gate: most sources above still return `[]` for a
 * non-base locale (Phase 1 pattern, kept for now); `WAHL_PORTAL_PAGE_SOURCE`
 * and `WAHL_DETAIL_SOURCE` (Block B) emit for every locale. Either way, this
 * is the authoritative check -- only pages `translation-register.ts`
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
