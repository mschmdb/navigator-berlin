/**
 * Forbidden-Token-Lint für Wahl-Editorial-Output (Story 6.3 AC-7).
 *
 * Wertungs-Begriffe und politisierende Framings sind in Wahl-UI/Doku verboten.
 * Daten beschreiben Stimmenanteile, keine Bewertung. Linter scannt Code-Files
 * + Markdown-Doku auf bekannte Anti-Patterns.
 *
 * Erweiterung: docs/wahldaten-methodik.md "Editorial-Disziplin"-Section
 * dokumentiert hinzuzufügende Tokens mit Begründung.
 */

export interface Pattern {
	readonly name: string;
	readonly regex: RegExp;
	readonly hint: string;
}

export const WAHL_FORBIDDEN_PATTERNS: readonly Pattern[] = [
	{
		name: 'hochburg',
		regex: /\bhochburg(?:en)?\b/i,
		hint: 'Begriff impliziert Dominanz/Eroberung. Ersatz: hoher Stimmenanteil, dominierende Partei (neutral)'
	},
	{
		name: 'rote-bezirke',
		regex:
			/\b(?:rote[nrms]?|blaue[nrms]?|gr(?:ü|ue)ne[nrms]?|schwarze[nrms]?|gelbe[nrms]?)\s+bezirke?n?\b/i,
		hint: 'Farb-Adjektive personalisieren Parteien. Ersatz: Bezirke mit dominierendem Parteianteil'
	},
	{
		name: 'wahlsieger',
		regex: /\bwahl(?:sieger|verlierer|gewinner)\b/i,
		hint: 'Wertung Sieger/Verlierer impliziert Wettkampf. Ersatz: stärkste Partei, niedrigster Anteil'
	},
	{
		name: 'stimmkoenig',
		regex: /\bstimm(?:k(?:ö|oe)nig|kaiser)\b/i,
		hint: 'Monarchische Metaphern unzulässig. Ersatz: stärkster Stimmenanteil'
	},
	{
		name: 'erdrutsch',
		regex: /\berdrutsch(?:sieg|wahl)?\b/i,
		hint: 'Naturkatastrophen-Metapher dramatisiert. Ersatz: deutlicher Vorsprung in Prozentpunkten'
	},
	{
		name: 'debakel',
		regex: /\bwahl(?:debakel|desaster|absturz)\b/i,
		hint: 'Wertende Katastrophen-Begriffe. Ersatz: deutlicher Rückgang gegenüber Vorwahl'
	},
	{
		name: 'lebenswert',
		regex: /\blebenswert\w*/i,
		hint: 'NS-belasteter Begriff. Generelles Verbot (siehe MEMORY feedback_no_lebenswert)'
	},
	{
		name: 'em-dash',
		regex: /—/,
		hint: 'em-dash verboten in UI/Doku/Code-Strings (siehe MEMORY feedback_no_em_dashes)'
	}
];

/**
 * EN-Pendant zu `WAHL_FORBIDDEN_PATTERNS` (i18n Block B, Spec-Boundary:
 * "EN bekommt eigene Forbidden-Tokens (nur auf en.json)"). Gilt NUR für
 * `messages/en.json`, nicht für Code-/Markdown-Dateien -- die englische
 * Wahl-Editorial-Prosa lebt ausschließlich in den Messages.
 */
export const WAHL_FORBIDDEN_PATTERNS_EN: readonly Pattern[] = [
	{
		name: 'stronghold',
		regex: /\bstrongholds?\b/i,
		hint: 'Implies dominance/conquest. Replace with: high vote share, dominant party (neutral)'
	},
	{
		name: 'colour-coded-districts',
		regex: /\b(?:red|blue|green|black|yellow)\s+districts?\b/i,
		hint: 'Colour adjectives personalise parties. Replace with: districts with a dominant party share'
	},
	{
		name: 'election-winner-loser',
		regex: /\belection\s+(?:winners?|losers?)\b/i,
		hint: 'Winner/loser framing implies a contest. Replace with: strongest party, lowest share'
	},
	{
		name: 'vote-king',
		regex: /\bvote\s+kings?\b/i,
		hint: 'Monarchical metaphors are not allowed. Replace with: strongest vote share'
	},
	{
		name: 'landslide',
		regex: /\blandslide(?:\s+(?:victory|win))?\b/i,
		hint: 'Natural-disaster metaphor dramatises. Replace with: clear margin in percentage points'
	},
	{
		name: 'election-debacle',
		regex: /\belection\s+(?:debacle|disaster|collapse)\b/i,
		hint: 'Judgemental catastrophe terms. Replace with: clear decline versus the previous election'
	},
	{
		name: 'em-dash',
		regex: /—/,
		hint: 'em-dash verboten in UI/Doku/Code-Strings (siehe MEMORY feedback_no_em_dashes)'
	}
];

export interface LintViolation {
	readonly token: string;
	readonly line: number;
	readonly snippet: string;
	readonly hint: string;
}

export interface LintResult {
	readonly ok: boolean;
	readonly violations: readonly LintViolation[];
}

export function lintWahlText(
	text: string,
	patterns: readonly Pattern[] = WAHL_FORBIDDEN_PATTERNS
): LintResult {
	const violations: LintViolation[] = [];
	const lines = text.split('\n');
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		for (const p of patterns) {
			if (p.regex.test(line)) {
				violations.push({
					token: p.name,
					line: i + 1,
					snippet: line.trim().slice(0, 140),
					hint: p.hint
				});
			}
		}
	}
	return { ok: violations.length === 0, violations };
}
