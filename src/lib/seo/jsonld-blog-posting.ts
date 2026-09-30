import type { WithContext } from 'schema-dts';
import type { UpdateEntry } from '$lib/content/updates/types.js';
import { sortByDateDesc } from '$lib/content/updates/load-updates.js';
import { localizeUpdateEntry } from '$lib/content/updates/localize-update-entry.js';
import { baseLocale, localizeHref, type Locale } from '$lib/paraglide/runtime';
import { localeToBcp47 } from './locale-meta.js';

/**
 * Story 2.2 T3.9: BlogPosting + Blog-Index-Generator.
 *
 * Migriert die inline-Implementierung aus Story 2.13 (`json-ld-updates.ts`,
 * markiert `// TODO Story 2.2 Refactor`) in die zentrale Generator-Bibliothek.
 * Bestehende Konsumenten in `/updates`-Routes wurden auf diese API umgestellt.
 *
 * Konsumenten: `routes/(with-header)/updates/+page.svelte` (Blog-Index),
 * `routes/(with-header)/updates/[slug]/+page.svelte` (BlogPosting).
 */

export interface OrganizationJsonLd {
	'@type': 'Organization';
	name: string;
	url?: string;
}

export interface WebPageReferenceJsonLd {
	'@type': 'WebPage';
	'@id': string;
}

export interface BlogPostingLeafJsonLd {
	'@type': 'BlogPosting';
	headline: string;
	datePublished: string;
	dateModified: string;
	author: OrganizationJsonLd;
	publisher: OrganizationJsonLd;
	mainEntityOfPage: WebPageReferenceJsonLd;
	articleSection: string;
	description: string;
	inLanguage: string;
	keywords?: string;
}

export interface BlogLeafJsonLd {
	'@type': 'Blog';
	name: string;
	description: string;
	url: string;
	inLanguage: string;
	publisher: OrganizationJsonLd;
	blogPost: BlogPostingLeafJsonLd[];
}

export type BlogPostingJsonLd = WithContext<BlogPostingLeafJsonLd>;
export type BlogJsonLd = WithContext<BlogLeafJsonLd>;

const PUBLISHER: OrganizationJsonLd = {
	'@type': 'Organization',
	name: 'Navigator Berlin',
	url: 'https://navigator.berlin/'
};

const AUTHOR: OrganizationJsonLd = PUBLISHER;

export interface BlogPostingInput {
	readonly entry: UpdateEntry;
	readonly origin: string;
	/** Seiten-Locale, Default `baseLocale`. Steuert Text, URL-Präfix und `inLanguage`. */
	readonly locale?: Locale;
	/** Überschreibt die Body-Fallback-Ableitung, wenn `entry` ohne Body geliefert wird (Detailseite). */
	readonly bodyIsDeFallback?: boolean;
}

function localizedUrl(origin: string, path: string, locale: Locale): string {
	return `${origin}${localizeHref(path, { locale })}`;
}

export function buildBlogPosting(input: BlogPostingInput): BlogPostingJsonLd {
	const origin = input.origin.replace(/\/+$/, '');
	const locale = input.locale ?? baseLocale;
	const url = localizedUrl(origin, `/updates/${input.entry.slug}`, locale);
	const localized = localizeUpdateEntry(input.entry, locale);
	const bodyIsDeFallback = input.bodyIsDeFallback ?? localized.bodyIsDeFallback;
	// Sprache des ausgelieferten Textes: fällt Titel, Summary oder Body auf DE zurück, ist es DE.
	const lang: Locale =
		locale === baseLocale
			? (input.entry.frontmatter.lang ?? baseLocale)
			: localized.titleIsDeFallback || localized.summaryIsDeFallback || bodyIsDeFallback
				? baseLocale
				: locale;
	const inLanguage = localeToBcp47(lang);
	const tags = input.entry.frontmatter.tags;
	const keywords = tags && tags.length > 0 ? tags.join(', ') : undefined;

	const out: BlogPostingJsonLd = {
		'@context': 'https://schema.org',
		'@type': 'BlogPosting',
		headline: localized.title,
		datePublished: input.entry.frontmatter.date,
		dateModified: input.entry.frontmatter.date,
		author: AUTHOR,
		publisher: PUBLISHER,
		mainEntityOfPage: { '@type': 'WebPage', '@id': url },
		articleSection: input.entry.frontmatter.category,
		description: localized.summary,
		inLanguage,
		...(keywords ? { keywords } : {})
	};
	return out;
}

export interface BlogIndexInput {
	readonly entries: readonly UpdateEntry[];
	readonly origin: string;
	readonly maxPosts?: number;
	/** Seiten-Locale, Default `baseLocale`. */
	readonly locale?: Locale;
	/** Überschreibt die DE-Standardbeschreibung des Blogs. */
	readonly description?: string;
}

const INDEX_MAX_POSTS_DEFAULT = 10;

export function buildBlogIndex(input: BlogIndexInput): BlogJsonLd {
	const max = input.maxPosts ?? INDEX_MAX_POSTS_DEFAULT;
	const sorted = sortByDateDesc(input.entries).slice(0, max);
	const origin = input.origin.replace(/\/+$/, '');
	const locale = input.locale ?? baseLocale;

	return {
		'@context': 'https://schema.org',
		'@type': 'Blog',
		name: 'Navigator Berlin · Updates',
		description: input.description ?? 'Daten-Updates, Features, Methodik-Änderungen.',
		url: localizedUrl(origin, '/updates', locale),
		inLanguage: localeToBcp47(locale),
		publisher: PUBLISHER,
		// Inhaltlich sind alle Posts BlogPostings; im Leaf-Type ist das auch der Constraint.
		blogPost: sorted.map((entry) => {
			const post = buildBlogPosting({ entry, origin, locale });
			// `@context` ist redundant in nested Item, aber harmlos. Leaf-Type erlaubt es nicht
			// direkt, also strippen wir es hier weg.
			const { ['@context']: _ctx, ...leaf } = post;
			void _ctx;
			return leaf;
		})
	};
}
