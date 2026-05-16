/**
 * Story 2.8 AC-7 + Story 2.5b (FAQ-Stigma-Lint): zentralisierte Wörter-Blacklist
 * für editoriale Begriffs-Hygiene in allen LLM-Markdown-Outputs.
 *
 * Trigger: Memory `feedback_no_lebenswert` (Begriff NS-belastet, niemals in UI /
 * Code / Doku). Die Familie „lebenswert/lebensqualität" wird in jeder gerenderten
 * Markdown-Section vom Renderer geprüft; Hit = Build-Fail-Indikator + Replacement
 * mit `[REDAKTIONSFEHLER]`.
 *
 * DRY: re-used von `src/lib/server/llms/*-renderer.ts` (Story 2.8) und
 * `scripts/render-faq.ts` (Story 2.5b, future).
 */

export const BANNED_WORDS: readonly string[] = Object.freeze([
	'lebenswert',
	'lebensqualität'
]);

export interface LintResult {
	readonly hits: readonly string[];
	readonly cleaned: string;
}

/**
 * Prüft Text gegen `BANNED_WORDS` als Wort-Präfix-Match (deutsche Flexion).
 *
 * Match-Regel:
 * - case-insensitive
 * - Wort-Grenze davor (`\b`), beliebige Flexions-Endung danach (`\w*`)
 * - Substrings ohne Wort-Grenze (z.B. „Lebensmittel" enthält nicht den Lemma-Stamm
 *   „lebenswert" oder „lebensqualität", aber „Lebensmittel" matched gegen
 *   „lebens..." NICHT, weil der Lemma-Suffix `wert`/`qualität` fehlt)
 *
 * `cleaned` ersetzt jede Trefferstelle durch `[REDAKTIONSFEHLER]`. Aufrufer kann
 * die `hits`-Liste loggen + Build abbrechen, oder den `cleaned`-String einfach
 * weiterreichen, je nach Schwere.
 */
export function lintForBannedWords(text: string): LintResult {
	const hits = new Set<string>();
	let cleaned = text;
	for (const lemma of BANNED_WORDS) {
		// `\b` + lemma + Flexions-Suffix (Buchstaben). `i`-Flag matched Groß/Klein.
		const pattern = new RegExp(`\\b${lemma}\\w*`, 'gi');
		const matches = text.match(pattern);
		if (matches && matches.length > 0) {
			hits.add(lemma);
			cleaned = cleaned.replace(pattern, '[REDAKTIONSFEHLER]');
		}
	}
	return {
		hits: Array.from(hits),
		cleaned
	};
}
