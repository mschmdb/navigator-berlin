/**
 * Wahl-Slug → Geometrie-Layer-Slug (Story 6.4).
 *
 * Server-Side-Pendant zu scripts/wahlen/lib/sbb-geo-sources.ts WAHL_TO_GEO,
 * aber ohne Build-Skript-Imports (deshalb separate Datei in src/lib/data).
 *
 * Wahlen ohne Eintrag (btw13, agh11, bvv11) haben keine Geometrie →
 * Choropleth fällt auf Bezirks-12-Polygone zurück.
 *
 * agh23/bvv23 = Wiederholungswahl Sept 2023 auf den unveränderten
 * Wahlbezirken vom Sept 2021 → mapping auf ah21 (Polygone). Der eigene
 * ah23-Layer enthält Wahllokal-Punkte statt Polygone und ist für
 * Choropleth ungeeignet.
 */
export const WAHL_TO_GEO: ReadonlyMap<string, string> = new Map([
	['btw17', 'btw17'],
	['btw21', 'ah21'],
	['btw25', 'bt25'],
	['agh16', 'ah16'],
	['agh21', 'ah21'],
	['agh23', 'ah21'],
	['bvv16', 'ah16'],
	['bvv21', 'ah21'],
	['bvv23', 'ah21']
]);

export function wahlSlugFromTypJahr(typ: 'btw' | 'agh' | 'bvv', jahr: number): string {
	const jj = String(jahr).slice(-2);
	return `${typ}${jj}`;
}
