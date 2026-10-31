import { localizeStory } from '$lib/content/stories/localize-story.js';
import { sortStoriesByDateDesc } from '$lib/content/stories/load-stories.js';
import type { StoryEntry } from '$lib/content/stories/types.js';
import { baseLocale, localizeHref, type Locale } from '$lib/paraglide/runtime';
import type {
	BlogJsonLd,
	BlogPostingJsonLd,
	BlogPostingLeafJsonLd
} from './jsonld-blog-posting.js';
import { organizationRef } from './jsonld-organization.js';
import { localeToBcp47 } from './locale-meta.js';

/**
 * JSON-LD für die Data Stories: `BlogPosting` je Beitrag, `Blog` für die Übersicht.
 * Die Typen stammen aus `jsonld-blog-posting.ts`, der Updates-Generator bleibt unberührt.
 */

const SECTION = 'Berlin Data Stories';
const DEFAULT_IMAGE_PATH = '/og/page/home.png';
export const STORIES_IMAGE_PATH = '/og/page/stories.png';

/** Beiträge mit Komposition (`visual` oder `preview`) tragen das Stories-Bild. */
export function storyImagePath(entry: StoryEntry): string {
	return entry.frontmatter.visual || entry.frontmatter.preview
		? STORIES_IMAGE_PATH
		: DEFAULT_IMAGE_PATH;
}

function url(origin: string, path: string, locale: Locale): string {
	return `${origin}${localizeHref(path, { locale })}`;
}

export interface StoryPostingInput {
	readonly entry: StoryEntry;
	readonly origin: string;
	readonly locale?: Locale;
	/** Überschreibt die Body-Fallback-Ableitung, wenn `entry` ohne Body kommt (Detailseite). */
	readonly bodyIsDeFallback?: boolean;
	readonly image?: string;
}

export function buildStoryPosting(input: StoryPostingInput): BlogPostingJsonLd {
	const origin = input.origin.replace(/\/+$/, '');
	const locale = input.locale ?? baseLocale;
	const localized = localizeStory(input.entry, locale);
	const { hasEnglishBody } = input.entry;
	const bodyIsDeFallback =
		input.bodyIsDeFallback ??
		(hasEnglishBody === undefined ? localized.bodyIsDeFallback : !hasEnglishBody);
	// Fällt Titel, Summary oder Body auf DE zurück, ist die Seite deutsch.
	const lang: Locale =
		localized.titleIsDeFallback || localized.summaryIsDeFallback || bodyIsDeFallback
			? baseLocale
			: locale;
	const keywords = input.entry.frontmatter.series;
	return {
		'@context': 'https://schema.org',
		'@type': 'BlogPosting',
		headline: localized.title,
		datePublished: input.entry.frontmatter.date,
		dateModified: input.entry.frontmatter.date,
		image: input.image ?? `${origin}${storyImagePath(input.entry)}`,
		author: organizationRef(origin),
		publisher: organizationRef(origin),
		mainEntityOfPage: {
			'@type': 'WebPage',
			'@id': url(origin, `/stories/${input.entry.slug}`, locale)
		},
		articleSection: SECTION,
		description: localized.summary,
		inLanguage: localeToBcp47(lang),
		...(keywords ? { keywords } : {})
	};
}

export interface StoriesIndexInput {
	readonly entries: readonly StoryEntry[];
	readonly origin: string;
	readonly locale?: Locale;
	readonly name: string;
	readonly description: string;
}

export function buildStoriesIndex(input: StoriesIndexInput): BlogJsonLd {
	const origin = input.origin.replace(/\/+$/, '');
	const locale = input.locale ?? baseLocale;
	return {
		'@context': 'https://schema.org',
		'@type': 'Blog',
		name: input.name,
		description: input.description,
		url: url(origin, '/stories', locale),
		inLanguage: localeToBcp47(locale),
		image: `${origin}${STORIES_IMAGE_PATH}`,
		publisher: organizationRef(origin),
		blogPost: sortStoriesByDateDesc(input.entries).map((entry): BlogPostingLeafJsonLd => {
			const { ['@context']: _ctx, ...leaf } = buildStoryPosting({ entry, origin, locale });
			void _ctx;
			return leaf;
		})
	};
}
