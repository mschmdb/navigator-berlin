import type { Manifest } from '$lib/data/types.js';

export interface SitemapEntry {
	readonly loc: string;
	readonly lastmod?: string;
	readonly changefreq?: 'daily' | 'weekly' | 'monthly' | 'yearly';
	readonly priority?: number;
}

export interface SitemapIndexEntry {
	readonly loc: string;
	readonly lastmod?: string;
}

export type SitemapLocale = 'de' | 'en';

export interface SitemapSourceContext {
	readonly origin: string;
	readonly locale: SitemapLocale;
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
	const urls = entries.map((e) => {
		const parts: string[] = [`<loc>${escapeXml(e.loc)}</loc>`];
		if (e.lastmod) parts.push(`<lastmod>${escapeXml(e.lastmod)}</lastmod>`);
		if (e.changefreq) parts.push(`<changefreq>${e.changefreq}</changefreq>`);
		if (typeof e.priority === 'number') parts.push(`<priority>${e.priority.toFixed(1)}</priority>`);
		return `\t<url>\n\t\t${parts.join('\n\t\t')}\n\t</url>`;
	});
	return [
		'<?xml version="1.0" encoding="UTF-8"?>',
		'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
		...urls,
		'</urlset>',
		''
	].join('\n');
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
	if (ctx.locale !== 'de') return [];
	return [
		{ loc: `${ctx.origin}/`, lastmod: ctx.buildTimestamp, changefreq: 'weekly' },
		{ loc: `${ctx.origin}/methodik`, lastmod: ctx.buildTimestamp, changefreq: 'monthly' },
		{ loc: `${ctx.origin}/lizenzen`, lastmod: ctx.buildTimestamp, changefreq: 'monthly' }
	];
};

/**
 * Sources one entry per manifest layer.
 *
 * Uses `fetchedAt` from each layer as `lastmod` (per story-2.1 dev-notes).
 * Phase 1: returns empty list for `locale === 'en'`.
 */
export const LAYER_DETAIL_SOURCE: SitemapSource = (ctx) => {
	if (ctx.locale !== 'de') return [];
	return ctx.manifest.layers.map((layer) => ({
		loc: `${ctx.origin}/layer/${layer.slug}`,
		lastmod: layer.fetchedAt,
		changefreq: 'monthly' as const
	}));
};

/**
 * All sources concatenated. Future stories (2.3 bezirks, 2.4 kiez, 2.9b ranking)
 * register new sources here without editing the per-language endpoint.
 */
const ALL_SOURCES: readonly SitemapSource[] = [STATIC_PAGES_SOURCE, LAYER_DETAIL_SOURCE];

export function collectPrerenderedUrls(ctx: SitemapSourceContext): SitemapEntry[] {
	const out: SitemapEntry[] = [];
	for (const source of ALL_SOURCES) {
		out.push(...source(ctx));
	}
	return out;
}
