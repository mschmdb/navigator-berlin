import { collectNumbers, type ProfileInput } from './input.js';

/**
 * Fakten-Lint für KI-Profile (Story 11.7). Prüft, dass jede Zahl im Prosa-Text
 * aus der Datenbasis stammt, und verbietet Gedankenstriche. Reine Funktionen,
 * der Runner (`lint-profiles.ts`) liest Files + DB.
 */

export interface LintResult {
	readonly ok: boolean;
	/** Zahlen im Text ohne Deckung in den Daten. */
	readonly unbackedNumbers: number[];
	/** true, wenn em-dash/en-dash gefunden. */
	readonly hasDash: boolean;
	/** Gefundene Stigma-Begriffe (Kriminalität/Sicherheit), die nicht in Profile gehören. */
	readonly stigmaHits: string[];
}

/**
 * Stigma-Begriffe (Story 14.8, ADR-019): Kriminalität ist Karten-Kontext, darf NICHT in die
 * Prosa lecken („gefährlicher Kiez" = Redlining im Fließtext). Auch Sozial-Stigma-Wortfeld.
 * Bewusst eng gefasst, um Lebensqualitäts-Prosa nicht zu blockieren.
 */
const STIGMA_PATTERNS: readonly RegExp[] = [
	/kriminalit/i, // Kriminalität / Kriminalitäts-
	/kriminell/i,
	/verbrech/i, // Verbrechen
	/straftat/i,
	/\bdelikt/i,
	/einbruch|einbrüch/i,
	/\braub(?:überfall|delikt|es|s)?\b/i,
	/gefährlich/i,
	/(?:un)?sicher(?:e[rsn]?)?\s+(?:kiez|gegend|wohngegend|viertel|lage|ecke)/i,
	/sicherheitslage/i,
	/\bverwahrlos/i
];

function findStigma(text: string): string[] {
	const hits: string[] = [];
	for (const re of STIGMA_PATTERNS) {
		const m = re.exec(text);
		if (m) hits.push(m[0]);
	}
	return [...new Set(hits.map((h) => h.toLowerCase()))];
}

/** Extrahiert alle Zahlen aus deutschem Prosatext (Dezimal-Komma oder -Punkt). */
export function extractNumbers(text: string): number[] {
	const out: number[] = [];
	for (const m of text.matchAll(/\d+(?:[.,]\d+)?/g)) {
		const n = Number(m[0].replace(',', '.'));
		if (Number.isFinite(n)) out.push(n);
	}
	return out;
}

/** Eine Prosa-Zahl ist gedeckt, wenn sie einem Datenwert nahekommt (1-Dezimal-
 * Rundung) oder dessen ganzzahliger Rundung entspricht ("fast 28" für 27,9 → 28;
 * "rund 34" für 34,45 → 34). */
function isBacked(n: number, allowed: readonly number[]): boolean {
	for (const a of allowed) {
		if (Math.abs(n - a) < 0.1) return true;
		if (Math.round(a) === Math.round(n)) return true;
	}
	return false;
}

export function factLint(text: string, input: ProfileInput): LintResult {
	const allowed = collectNumbers(input);
	const unbacked = extractNumbers(text).filter((n) => !isBacked(n, allowed));
	const hasDash = /[—–]/.test(text);
	const stigmaHits = findStigma(text);
	return {
		ok: unbacked.length === 0 && !hasDash && stigmaHits.length === 0,
		unbackedNumbers: [...new Set(unbacked)],
		hasDash,
		stigmaHits
	};
}
