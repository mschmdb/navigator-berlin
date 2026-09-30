import type { Locale } from '$lib/paraglide/runtime';
import type { UpdateEntry } from './types.js';

/**
 * Titel, Summary und Body eines Eintrags in der Seiten-Locale. Fehlt ein
 * EN-Feld (`title_en`, `summary_en`, Schwesterdatei `.en.md`), fällt genau
 * dieses Feld auf DE zurück. Das `*IsDeFallback`-Flag verlangt vom Konsumenten
 * `lang="de"` am betroffenen Element (WCAG 3.1.2).
 */
export interface LocalizedUpdate {
	readonly title: string;
	readonly summary: string;
	readonly body: string;
	readonly titleIsDeFallback: boolean;
	readonly summaryIsDeFallback: boolean;
	readonly bodyIsDeFallback: boolean;
}

export function localizeUpdateEntry(entry: UpdateEntry, locale: Locale): LocalizedUpdate {
	const { frontmatter } = entry;
	if (locale === 'de') {
		return {
			title: frontmatter.title_de,
			summary: frontmatter.summary_de,
			body: entry.body,
			titleIsDeFallback: false,
			summaryIsDeFallback: false,
			bodyIsDeFallback: false
		};
	}
	const titleEn = frontmatter.title_en?.trim() || undefined;
	const summaryEn = frontmatter.summary_en?.trim() || undefined;
	const bodyEn = entry.bodyEn?.trim() || undefined;
	return {
		title: titleEn ?? frontmatter.title_de,
		summary: summaryEn ?? frontmatter.summary_de,
		body: bodyEn ?? entry.body,
		titleIsDeFallback: !titleEn,
		summaryIsDeFallback: !summaryEn,
		bodyIsDeFallback: !bodyEn
	};
}
