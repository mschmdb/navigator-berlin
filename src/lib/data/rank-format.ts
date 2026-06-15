/**
 * Anti-Stigma-konforme Rang-Beschriftung (Story 11.4, ADR-015).
 *
 * Für starke bis mittlere Werte den exakten Rang („Platz 12 von 143"), für das
 * schwächste Viertel (Quartil 4) bewusst nur „unteres Viertel" statt „Platz 143
 * von 143". `null` → Gedankenstrich.
 */
export function formatRank(rang: number | null, quartil: number | null, total: number): string {
	if (rang === null || total <= 0) return '–';
	if (quartil === 4) return 'unteres Viertel';
	return `Platz ${rang} von ${total}`;
}
