/**
 * Menschenlesbarer Quellen-Name aus der `wahl.source_url`. Geteilter Helper
 * (vormals dupliziert in `api/wahl/list/+server.ts` und
 * `(with-header)/wahl/[slug]/+page.server.ts`).
 */
export function sourceName(sourceUrl: string): string {
	if (sourceUrl.includes('bundeswahlleiterin')) return 'Bundeswahlleiterin';
	if (sourceUrl.includes('wahlen-berlin.de')) return 'Landeswahlleiterin Berlin';
	return 'Amt für Statistik Berlin-Brandenburg';
}
