import type { UpdateCategory } from '$lib/content/updates/types.js';
import { m } from '$lib/paraglide/messages.js';
import { formatLongDate } from '$lib/i18n/format.js';
import type { Locale } from '$lib/paraglide/runtime';

/**
 * Anzeige-Label je Kategorie in der Seiten-Locale (Paraglide-Messages
 * `update_category_*`). Ohne `locale` gilt die aktuelle Locale. Die
 * Startseiten-Badge nutzt weiter `homeUpdateCategoryLabel`.
 */
export function categoryLabel(category: UpdateCategory, locale?: Locale): string {
	const options = locale ? { locale } : undefined;
	switch (category) {
		case 'daten-update':
			return m.update_category_daten_update(undefined, options);
		case 'feature':
			return m.update_category_feature(undefined, options);
		case 'methodik':
			return m.update_category_methodik(undefined, options);
		case 'datenquelle':
			return m.update_category_datenquelle(undefined, options);
		case 'lizenz':
			return m.update_category_lizenz(undefined, options);
		case 'presse':
			return m.update_category_presse(undefined, options);
	}
}

/**
 * Token-Mapping pro Category zu CSS-Klassen.
 * Keine Rot-Grün-Palette, kein Marketing-Akzent. Konsistent mit Story 1.31 Choropleth-Disziplin.
 * Plex-Mono-Border-Stil mit dezenten Hintergrund-Variationen.
 */
export const CATEGORY_BADGE_CLASSES: Record<UpdateCategory, string> = {
	'daten-update': 'border-rule bg-bg-elevated text-ink',
	feature: 'border-accent bg-bg text-accent',
	methodik: 'border-rule bg-bg-elevated text-ink-muted',
	datenquelle: 'border-rule bg-bg text-ink',
	// Lizenz dezent severity-warning weil Lizenz-Änderungen aufmerksamkeits-relevant
	lizenz: 'border-warning bg-bg text-warning-strong',
	presse: 'border-rule bg-bg-elevated text-ink'
};

/**
 * i18n Block B2 Review-Fund: locale-abhängiges Anzeige-Label für die
 * Home-Updates-Teaser-Kategorie-Badge. DE bleibt bewusst der ROHE
 * Frontmatter-Slug (z. B. "daten-update"), byte-identisch zum
 * Vor-Block-B2-Verhalten der Startseite (Story 2.11 zeigte dort nie
 * ein ausgeschriebenes Label, nur den rohen `category`-Wert). EN nutzt eine
 * ausgeschriebene Paraglide-Message. Die Seiten `/updates` nutzen
 * `categoryLabel` (auch DE ausgeschrieben).
 */
export function homeUpdateCategoryLabel(category: UpdateCategory, locale: Locale): string {
	if (locale === 'de') return category;
	const options = { locale };
	switch (category) {
		case 'daten-update':
			return m.update_category_daten_update(undefined, options);
		case 'feature':
			return m.update_category_feature(undefined, options);
		case 'methodik':
			return m.update_category_methodik(undefined, options);
		case 'datenquelle':
			return m.update_category_datenquelle(undefined, options);
		case 'lizenz':
			return m.update_category_lizenz(undefined, options);
		case 'presse':
			return m.update_category_presse(undefined, options);
	}
}

/**
 * Formatiert ISO-`YYYY-MM-DD` in der Seiten-Locale: DE `15. Mai 2026`,
 * EN `15 May 2026` (`formatLongDate`). Nicht parsebarer Input kommt
 * unverändert zurück.
 */
export function formatUpdateDate(isoDate: string, locale?: Locale): string {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return isoDate;
	return formatLongDate(isoDate, { locale });
}
