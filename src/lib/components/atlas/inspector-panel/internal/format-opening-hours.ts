import type { LocaleOptions } from '../../internal/atlas-label-options.js';

/**
 * Story 15.4: OSM-`opening_hours`-Strings nutzen englische Kürzel (Mo Tu We Th Fr Sa Su,
 * Monatskürzel, "off"). Für die Anzeige übersetzen wir Token-genau ins Deutsche. Reine
 * Display-Funktion, keine Semantik-Änderung (Zeiten/Struktur bleiben unverändert).
 *
 * i18n Block B3a: `opts.locale` steuert, OB übersetzt wird. Ohne Angabe
 * bleibt das Alt-Verhalten (Boundary: DE) -- Token-Uebersetzung ins
 * Deutsche, wie bisher. Für `locale: 'en'` bleibt der Roh-OSM-String
 * unverändert (er ist bereits englisch, eine Rück-Uebersetzung wäre
 * unnötig und riskant für Tokens ausserhalb dieser Tabelle).
 */
const TOKEN_DE: Record<string, string> = {
	// Wochentage (nur die abweichenden; Mo/Fr/Sa bleiben gleich)
	Tu: 'Di',
	We: 'Mi',
	Th: 'Do',
	Su: 'So',
	// Monate (nur die abweichenden)
	Mar: 'Mär',
	May: 'Mai',
	Oct: 'Okt',
	Dec: 'Dez',
	// Schlüsselwörter
	off: 'geschlossen',
	PH: 'Feiertags',
	SH: 'Schulferien'
};

// Längere Tokens zuerst, damit z.B. "Mar" nicht von einem kürzeren Teil überschrieben wird.
const TOKENS = Object.keys(TOKEN_DE).sort((a, b) => b.length - a.length);

export function formatOpeningHours(value: string, opts?: LocaleOptions): string {
	if ((opts?.locale ?? 'de') !== 'de') return value;
	let out = value;
	for (const token of TOKENS) {
		out = out.replace(new RegExp(`\\b${token}\\b`, 'g'), TOKEN_DE[token]);
	}
	return out;
}

/** @deprecated Review-Fund: der Name suggerierte "immer DE" -- die Funktion
 * ist seit i18n Block B3a locale-fähig. Nutze `formatOpeningHours`. Bleibt
 * als Alias, bis alle Aufrufer umgestellt sind. */
export const formatOpeningHoursDe = formatOpeningHours;
