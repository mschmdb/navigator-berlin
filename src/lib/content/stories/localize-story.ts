import type { Locale } from '$lib/paraglide/runtime';
import type { StoryEntry } from './types.js';

/**
 * Titel, Summary und Body in der Seiten-Locale. Fehlt ein EN-Feld, fällt genau dieses
 * Feld auf DE zurück. Das `*IsDeFallback`-Flag verlangt `lang="de"` am Element (WCAG 3.1.2).
 */
export interface LocalizedStory {
	readonly title: string;
	readonly summary: string;
	readonly body: string;
	readonly titleIsDeFallback: boolean;
	readonly summaryIsDeFallback: boolean;
	readonly bodyIsDeFallback: boolean;
}

export function localizeStory(entry: StoryEntry, locale: Locale): LocalizedStory {
	const { frontmatter } = entry;
	if (locale === 'de') {
		return {
			title: frontmatter.title,
			summary: frontmatter.summary,
			body: entry.body,
			titleIsDeFallback: false,
			summaryIsDeFallback: false,
			bodyIsDeFallback: false
		};
	}
	const title = frontmatter.title_en?.trim() || undefined;
	const summary = frontmatter.summary_en?.trim() || undefined;
	const body = entry.bodyEn?.trim() || undefined;
	return {
		title: title ?? frontmatter.title,
		summary: summary ?? frontmatter.summary,
		body: body ?? entry.body,
		titleIsDeFallback: !title,
		summaryIsDeFallback: !summary,
		bodyIsDeFallback: !body
	};
}
