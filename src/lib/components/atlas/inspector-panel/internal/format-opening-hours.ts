/**
 * Story 15.4: OSM-`opening_hours`-Strings nutzen englische Kürzel (Mo Tu We Th Fr Sa Su,
 * Monatskürzel, "off"). Für die Anzeige übersetzen wir Token-genau ins Deutsche. Reine
 * Display-Funktion, keine Semantik-Änderung (Zeiten/Struktur bleiben unverändert).
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

export function formatOpeningHoursDe(value: string): string {
	let out = value;
	for (const token of TOKENS) {
		out = out.replace(new RegExp(`\\b${token}\\b`, 'g'), TOKEN_DE[token]);
	}
	return out;
}
