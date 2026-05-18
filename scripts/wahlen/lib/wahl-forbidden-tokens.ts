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

export function lintWahlText(text: string): LintResult {
	const violations: LintViolation[] = [];
	const lines = text.split('\n');
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		for (const p of WAHL_FORBIDDEN_PATTERNS) {
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
