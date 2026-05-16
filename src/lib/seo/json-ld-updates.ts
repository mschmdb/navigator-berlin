import type { UpdateEntry } from '$lib/content/updates/types.js';
import { sortByDateDesc } from '$lib/content/updates/load-updates.js';

/**
 * Story 2.13 AC-9: BlogPosting + Blog JSON-LD Generators.
 *
 * **TODO Story 2.2 Refactor:** zentrale JSON-LD-Generator-Bibliothek (`$lib/seo/json-ld/`)
 * übernimmt diese Funktionen. Inline-Implementation hier ist Pragmatic-Fix, weil
 * Story 2.2 noch nicht im Sprint und 2.13-AC-9 nicht warten kann.
 *
 * Spec: https://schema.org/BlogPosting · https://schema.org/Blog
 */

const PUBLISHER = {
	'@type': 'Organization' as const,
	name: 'Navigator Berlin',
	url: 'https://navigator.berlin/'
};

const AUTHOR = PUBLISHER;

export interface BlogPostingJsonLd {
	readonly '@context': 'https://schema.org';
	readonly '@type': 'BlogPosting';
	readonly headline: string;
	readonly datePublished: string;
	readonly dateModified: string;
	readonly author: typeof AUTHOR;
	readonly publisher: typeof PUBLISHER;
	readonly mainEntityOfPage: {
		readonly '@type': 'WebPage';
		readonly '@id': string;
	};
	readonly articleSection: string;
	readonly description: string;
	readonly inLanguage: string;
	readonly keywords?: string;
}

export interface BlogIndexJsonLd {
	readonly '@context': 'https://schema.org';
	readonly '@type': 'Blog';
	readonly name: string;
	readonly description: string;
	readonly url: string;
	readonly inLanguage: string;
	readonly publisher: typeof PUBLISHER;
	readonly blogPost: readonly BlogPostingJsonLd[];
}

export interface BuildBlogPostingInput {
	readonly entry: UpdateEntry;
	readonly origin: string;
}

export function buildBlogPostingJsonLd(input: BuildBlogPostingInput): BlogPostingJsonLd {
	const origin = input.origin.replace(/\/+$/, '');
	const url = `${origin}/updates/${input.entry.slug}`;
	const lang = input.entry.frontmatter.lang ?? 'de';
	const inLanguage = lang === 'en' ? 'en-US' : 'de-DE';
	const tags = input.entry.frontmatter.tags;
	const keywords = tags && tags.length > 0 ? tags.join(', ') : undefined;

	const out: BlogPostingJsonLd = {
		'@context': 'https://schema.org',
		'@type': 'BlogPosting',
		headline: input.entry.frontmatter.title_de,
		datePublished: input.entry.frontmatter.date,
		dateModified: input.entry.frontmatter.date,
		author: AUTHOR,
		publisher: PUBLISHER,
		mainEntityOfPage: { '@type': 'WebPage', '@id': url },
		articleSection: input.entry.frontmatter.category,
		description: input.entry.frontmatter.summary_de,
		inLanguage,
		...(keywords ? { keywords } : {})
	};
	return out;
}

export interface BuildBlogIndexInput {
	readonly entries: readonly UpdateEntry[];
	readonly origin: string;
	readonly maxPosts?: number;
}

const INDEX_MAX_POSTS_DEFAULT = 10;

export function buildBlogIndexJsonLd(input: BuildBlogIndexInput): BlogIndexJsonLd {
	const max = input.maxPosts ?? INDEX_MAX_POSTS_DEFAULT;
	const sorted = sortByDateDesc(input.entries).slice(0, max);
	const origin = input.origin.replace(/\/+$/, '');

	return {
		'@context': 'https://schema.org',
		'@type': 'Blog',
		name: 'Navigator Berlin · Updates',
		description: 'Daten-Updates, Features, Methodik-Änderungen.',
		url: `${origin}/updates`,
		inLanguage: 'de-DE',
		publisher: PUBLISHER,
		blogPost: sorted.map((entry) => buildBlogPostingJsonLd({ entry, origin }))
	};
}
