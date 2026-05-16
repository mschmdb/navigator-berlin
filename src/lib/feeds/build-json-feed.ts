import type { UpdateEntry } from '$lib/content/updates/types.js';
import { sortByDateDesc } from '$lib/content/updates/load-updates.js';
import { renderMarkdownBody } from '$lib/content/updates/render-markdown.js';

/**
 * Story 2.13 AC-7: JSON Feed 1.1 Builder.
 * Spec: https://jsonfeed.org/version/1.1
 */

export interface JsonFeedItem {
	readonly id: string;
	readonly url: string;
	readonly title: string;
	readonly content_text: string;
	readonly content_html?: string;
	readonly summary: string;
	readonly date_published: string;
	readonly tags?: readonly string[];
	readonly language?: 'de' | 'en';
}

export interface JsonFeed {
	readonly version: 'https://jsonfeed.org/version/1.1';
	readonly title: string;
	readonly home_page_url: string;
	readonly feed_url: string;
	readonly description: string;
	readonly language: 'de' | 'en';
	readonly items: readonly JsonFeedItem[];
}

export interface BuildJsonFeedInput {
	readonly entries: readonly UpdateEntry[];
	readonly origin: string;
	readonly maxItems?: number;
}

const MAX_ITEMS_DEFAULT = 50;

export function buildJsonFeed(input: BuildJsonFeedInput): JsonFeed {
	const max = input.maxItems ?? MAX_ITEMS_DEFAULT;
	const sorted = sortByDateDesc(input.entries).slice(0, max);
	const origin = input.origin.replace(/\/+$/, '');

	const items: JsonFeedItem[] = sorted.map((entry) => {
		const id = `${origin}/updates/${entry.slug}`;
		return {
			id,
			url: id,
			title: entry.frontmatter.title_de,
			content_text: entry.frontmatter.summary_de,
			content_html: renderMarkdownBody(entry.body),
			summary: entry.frontmatter.summary_de,
			date_published: `${entry.frontmatter.date}T00:00:00.000Z`,
			tags: entry.frontmatter.tags,
			language: entry.frontmatter.lang ?? 'de'
		};
	});

	return {
		version: 'https://jsonfeed.org/version/1.1',
		title: 'Navigator Berlin · Updates',
		home_page_url: `${origin}/updates`,
		feed_url: `${origin}/updates/feed.json`,
		description: 'Daten-Updates, Features, Methodik-Änderungen.',
		language: 'de',
		items
	};
}
