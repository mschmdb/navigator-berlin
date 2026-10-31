import type { SitemapEntry, SitemapSource } from '../sitemap-builder.js';
import {
	loadStoriesFromModules,
	sortStoriesByDateDesc
} from '$lib/content/stories/load-stories.js';
import type { StoryEntry } from '$lib/content/stories/types.js';
import { localizedPathname } from '../canonical.js';
import { latestLastmod, validLastmod } from '../lastmod.js';
import type { Locale } from '$lib/paraglide/runtime';

/**
 * Sitemap-Quelle für die Data Stories: `/stories`-Index (priority 0.6, lastmod = jüngster
 * Beitrag) und jeder Beitrag `/stories/{slug}` (priority 0.7, lastmod = `date`).
 * Das zentrale Register-Gate in `collectPrerenderedUrls` filtert EN-Einträge ohne `.en.md`.
 */

export interface BuildStoriesSitemapEntriesInput {
	readonly entries: readonly StoryEntry[];
	readonly origin: string;
	readonly locale?: Locale;
}

const INDEX_PRIORITY = 0.6;
const DETAIL_PRIORITY = 0.7;

export function buildStoriesSitemapEntries(input: BuildStoriesSitemapEntriesInput): SitemapEntry[] {
	if (input.entries.length === 0) return [];
	const origin = input.origin.replace(/\/+$/, '');
	const locale = input.locale ?? 'de';
	const sorted = sortStoriesByDateDesc(input.entries);
	const latest = latestLastmod(sorted.map((e) => e.frontmatter.date));

	const out: SitemapEntry[] = [
		{
			loc: `${origin}${localizedPathname('/stories', locale)}`,
			...(latest ? { lastmod: latest } : {}),
			changefreq: 'weekly',
			priority: INDEX_PRIORITY
		}
	];
	for (const entry of sorted) {
		const lastmod = validLastmod(entry.frontmatter.date);
		out.push({
			loc: `${origin}${localizedPathname(`/stories/${entry.slug}`, locale)}`,
			...(lastmod ? { lastmod } : {}),
			changefreq: 'monthly',
			priority: DETAIL_PRIORITY
		});
	}
	return out;
}

/** Registriert in `ALL_SOURCES` (`sitemap-builder.ts`). */
export const STORIES_PAGES_SOURCE: SitemapSource = (ctx) => {
	const modules = import.meta.glob('/_content/stories/*.md', {
		eager: true,
		query: '?raw',
		import: 'default'
	}) as Record<string, string>;
	let entries: StoryEntry[];
	try {
		entries = loadStoriesFromModules(modules);
	} catch {
		// Schema-Verstöße bricht der Build über die Index-Route ab.
		return [];
	}
	return buildStoriesSitemapEntries({ entries, origin: ctx.origin, locale: ctx.locale });
};
