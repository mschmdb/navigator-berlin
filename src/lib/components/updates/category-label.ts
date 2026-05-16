import type { UpdateCategory } from '$lib/content/updates/types.js';

/**
 * Story 2.13: DE-Labels für die 5 Category-Enum-Werte.
 * Phase 1 DE-only (memory `project_i18n_phase_1_de_only`). EN-Translations in Phase 3.
 */
export const CATEGORY_LABEL_DE: Record<UpdateCategory, string> = {
	'daten-update': 'Daten-Update',
	feature: 'Feature',
	methodik: 'Methodik',
	datenquelle: 'Datenquelle',
	lizenz: 'Lizenz'
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
	lizenz: 'border-warning bg-bg text-warning-strong'
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

export function formatDateDe(isoDate: string): string {
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
	if (!match) return isoDate;
	const year = match[1]!;
	const month = parseInt(match[2]!, 10);
	const day = parseInt(match[3]!, 10);
	const monthName = DE_MONTH_NAMES[month - 1] ?? '';
	return `${day}. ${monthName} ${year}`;
}
