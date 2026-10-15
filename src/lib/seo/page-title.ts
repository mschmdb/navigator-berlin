export const BRAND = 'navigator.berlin';
export const PAGE_TITLE_MAX = 60;
const BRAND_SUFFIX = ` | ${BRAND}`;

/** Erster Kandidat innerhalb von `max`; passt keiner, gilt der letzte (kürzeste). */
export function firstFitting(candidates: readonly string[], max: number): string {
	return candidates.find((c) => c.length <= max) ?? candidates[candidates.length - 1];
}

/**
 * Kerntitel plus „ | navigator.berlin". Passt das nicht in 60 Zeichen, entfällt
 * die Marke; der Kerntitel bleibt immer vollständig.
 */
export function buildPageTitle(core: string): string {
	const trimmed = core.trim();
	return firstFitting([`${trimmed}${BRAND_SUFFIX}`, trimmed], PAGE_TITLE_MAX);
}
