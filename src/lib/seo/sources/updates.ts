import type { SitemapEntry, SitemapSource } from '../sitemap-builder.js';
import type { UpdateEntry } from '$lib/content/updates/types.js';
import { baseLocale } from '$lib/paraglide/runtime';
import { loadUpdatesFromModules, sortByDateDesc } from '$lib/content/updates/load-updates.js';

/**
 * Story 2.13 AC-10: Sitemap-Source für Updates-Routes.
 *
 * - `/updates`-Index: priority 0.6, lastmod = neuestes Entry-Datum.
 * - Per-Entry `/updates/{slug}`: priority 0.7, lastmod = `date`-Frontmatter.
 *
 * Nur DE (i18n C4d): `/en/updates` ist übersetzt, steht aber bewusst nicht in
 * `sitemap-en.xml` (Entscheidung Spec C4d, wie `STATIC_PAGES_SOURCE`). Für
 * `locale !== baseLocale` liefert die Source daher einen leeren Array.
 */

export interface BuildUpdatesSitemapEntriesInput {
	readonly entries: readonly UpdateEntry[];
	readonly origin: string;
}

const INDEX_PRIORITY = 0.6;
const DETAIL_PRIORITY = 0.7;

export function buildUpdatesSitemapEntries(input: BuildUpdatesSitemapEntriesInput): SitemapEntry[] {
	if (input.entries.length === 0) return [];
	const origin = input.origin.replace(/\/+$/, '');
	const sorted = sortByDateDesc(input.entries);
	const latestDate = sorted[0]!.frontmatter.date;

	const out: SitemapEntry[] = [
		{
			loc: `${origin}/updates`,
			lastmod: latestDate,
			changefreq: 'weekly',
			priority: INDEX_PRIORITY
		}
	];

	for (const entry of sorted) {
		out.push({
			loc: `${origin}/updates/${entry.slug}`,
			lastmod: entry.frontmatter.date,
			changefreq: 'monthly',
			priority: DETAIL_PRIORITY
		});
	}

	return out;
}

/**
 * SitemapSource das Build-Time MD-Files unter `_content/updates/` lädt.
 * Wird in `$lib/seo/sitemap-builder.ts ALL_SOURCES` registriert.
 */
export const UPDATES_PAGES_SOURCE: SitemapSource = (ctx) => {
	if (ctx.locale !== baseLocale) return [];
	// Build-Time-Glob. eager:true → Module sync verfügbar.
	const modules = import.meta.glob('/_content/updates/*.md', {
		eager: true,
		query: '?raw',
		import: 'default'
	}) as Record<string, string>;
	let entries: UpdateEntry[];
	try {
		entries = loadUpdatesFromModules(modules);
	} catch {
		// Schema-Verstoß fängt Build via Index-Route ab. Sitemap silent-degraded.
		return [];
	}
	return buildUpdatesSitemapEntries({ entries, origin: ctx.origin });
};
