/**
 * Wahl-Slug → Geometrie-Layer-Slug (Story 6.4).
 *
 * Server-Side-Pendant zu scripts/wahlen/lib/sbb-geo-sources.ts WAHL_TO_GEO,
 * aber ohne Build-Skript-Imports (deshalb separate Datei in src/lib/data).
 *
 * Wahlen ohne Eintrag (btw13, agh11, bvv11) haben keine Geometrie →
 * Choropleth fällt auf Bezirks-12-Polygone zurück.
 */
export const WAHL_TO_GEO: ReadonlyMap<string, string> = new Map([
	['btw17', 'btw17'],
	['btw21', 'ah21'],
	['btw25', 'bt25'],
	['agh16', 'ah16'],
	['agh21', 'ah21'],
	['agh23', 'ah23'],
	['bvv16', 'ah16'],
	['bvv21', 'ah21'],
	['bvv23', 'ah23']
]);

export function wahlSlugFromTypJahr(typ: 'btw' | 'agh' | 'bvv', jahr: number): string {
	const jj = String(jahr).slice(-2);
	return `${typ}${jj}`;
}
