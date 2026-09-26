/**
 * i18n Block B2, Entscheidung Matze 26.09. 2A: `title_en`/`summary_en` wo
 * vorhanden, sonst DE-Fallback (`titleIsDeFallback`/`summaryIsDeFallback`
 * signalisieren dem Client `lang="de"` auf dem jeweiligen Element). Die
 * Kategorie wird bereits hier locale-abhängig zu einem Anzeige-Label
 * aufgelöst, `category` selbst bleibt intern der Datenschlüssel.
 *
 * Pure Funktion (Review-Fund: vorher inline im `.map()` von
 * `+page.server.ts#loadUpdates`, ungetestet). Eigenes Modul statt Export aus
 * `+page.server.ts` -- SvelteKit erlaubt dort nur `load`/`prerender`/etc. als
 * Export, ein zusätzlicher Named-Export lässt den Build fehlschlagen
 * ("Invalid export").
 */
import { homeUpdateCategoryLabel } from '$lib/components/updates/category-label.js';
import type { Locale } from '$lib/paraglide/runtime';
import type { UpdateEntry } from './types.js';

export interface HomeUpdateTeaser {
	readonly slug: string;
	readonly title: string;
	/** true, wenn `title` mangels `title_en` auf die deutsche Fassung
	 * zurückfällt -- der Konsument markiert das Element dann mit
	 * `lang="de"` (WCAG 3.1.2). */
	readonly titleIsDeFallback: boolean;
	readonly date: string;
	/** locale-abhängig aufgelöstes Anzeige-Label, `category` selbst bleibt
	 * intern der Datenschlüssel. */
	readonly categoryLabel: string;
	readonly summary: string;
	readonly summaryIsDeFallback: boolean;
}

export function mapHomeUpdateEntry(entry: UpdateEntry, locale: Locale): HomeUpdateTeaser {
	// Review-Fund: ein leerer/nur-Whitespace `title_en`/`summary_en` (z. B.
	// `title_en: ''` im Frontmatter) soll NICHT als "vorhanden" zählen --
	// sonst rendert ein leerer Titel statt des DE-Fallbacks.
	const titleEn = entry.frontmatter.title_en?.trim() || undefined;
	const summaryEn = entry.frontmatter.summary_en?.trim() || undefined;
	return {
		slug: entry.slug,
		title: locale === 'de' ? entry.frontmatter.title_de : (titleEn ?? entry.frontmatter.title_de),
		titleIsDeFallback: locale !== 'de' && !titleEn,
		date: entry.frontmatter.date,
		categoryLabel: homeUpdateCategoryLabel(entry.frontmatter.category, locale),
		summary:
			locale === 'de' ? entry.frontmatter.summary_de : (summaryEn ?? entry.frontmatter.summary_de),
		summaryIsDeFallback: locale !== 'de' && !summaryEn
	};
}
