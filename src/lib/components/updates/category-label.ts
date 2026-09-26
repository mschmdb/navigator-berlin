import type { UpdateCategory } from '$lib/content/updates/types.js';
import { m } from '$lib/paraglide/messages.js';
import type { Locale } from '$lib/paraglide/runtime';

/**
 * Story 2.13: DE-Labels für die 5 Category-Enum-Werte.
 * Phase 1 DE-only (memory `project_i18n_phase_1_de_only`). EN-Translations in Phase 3.
 */
export const CATEGORY_LABEL_DE: Record<UpdateCategory, string> = {
	'daten-update': 'Daten-Update',
	feature: 'Feature',
	methodik: 'Methodik',
	datenquelle: 'Datenquelle',
	lizenz: 'Lizenz',
	presse: 'Presse'
};

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
 * Formatiert ISO-`YYYY-MM-DD` zu `15. Mai 2026` (DE-Locale).
 * Browser-Intl.DateTimeFormat, falls vorhanden, sonst Fallback-Mapping.
 */
const DE_MONTH_NAMES = [
	'Januar',
	'Februar',
	'März',
	'April',
	'Mai',
	'Juni',
	'Juli',
	'August',
	'September',
	'Oktober',
	'November',
	'Dezember'
];

/**
 * i18n Block B2 Review-Fund: locale-abhängiges Anzeige-Label für die
 * Home-Updates-Teaser-Kategorie-Badge. DE bleibt bewusst der ROHE
 * Frontmatter-Slug (z. B. "daten-update"), byte-identisch zum
 * Vor-Block-B2-Verhalten der Startseite (Story 2.11 zeigte dort nie
 * `CATEGORY_LABEL_DE`, nur den rohen `category`-Wert). EN nutzt eine
 * ausgeschriebene Paraglide-Message. Einzige Label-Quelle neben
 * `CATEGORY_LABEL_DE` (das bleibt für `/updates` unverändert, Boundary
 * "keine anderen Seiten übersetzen").
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

export function formatDateDe(isoDate: string): string {
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
	if (!match) return isoDate;
	const year = match[1]!;
	const month = parseInt(match[2]!, 10);
	const day = parseInt(match[3]!, 10);
	const monthName = DE_MONTH_NAMES[month - 1] ?? '';
	return `${day}. ${monthName} ${year}`;
}
