/**
 * Waehlt eine Schema.org-Dataset-`description`, die Googles Laengenregel erfuellt
 * (50–5000 Zeichen). Liefert den ersten Kandidaten im gueltigen Bereich, sonst
 * den Fallback.
 *
 * Hintergrund: GSC meldete am 2026-06-01 auf `/lizenzen` „Ungültige Stringlänge
 * in Feld description" für 21 Datasets. Ursache: ein nicht-leeres aber kurzes
 * `explain.short` (<50) gewann per `||` gegen ein gueltiges `explain.long`. Die
 * Laengenpruefung schliesst zu kurze und zu lange Kandidaten aus.
 */
const MIN_LENGTH = 50;
const MAX_LENGTH = 5000;

export function pickDatasetDescription(
	candidates: readonly (string | null | undefined)[],
	fallback: string
): string {
	for (const candidate of candidates) {
		if (candidate && candidate.length >= MIN_LENGTH && candidate.length <= MAX_LENGTH) {
			return candidate;
		}
	}
	return fallback;
}
