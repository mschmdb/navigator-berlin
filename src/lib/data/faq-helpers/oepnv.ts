/**
 * Story 2.5b: Sub-Slot-Helper für Mobilität-Cluster (ÖPNV-Dichte).
 *
 * Werte stammen aus `oepnv-composite` (Stops pro km²), aggregiert aus
 * BVG/VBB-Stops + S-Bahn-Stationen pro Bezirksregion.
 */

export type OepnvDichte = 'sehr dicht' | 'dicht' | 'mittel' | 'dünn' | 'unbekannt';

export function describeOepnvDichte(stopsPerKm2: number | null | undefined): OepnvDichte {
	if (stopsPerKm2 === null || stopsPerKm2 === undefined) return 'unbekannt';
	if (stopsPerKm2 >= 20) return 'sehr dicht';
	if (stopsPerKm2 >= 12) return 'dicht';
	if (stopsPerKm2 >= 6) return 'mittel';
	return 'dünn';
}

export function oepnvErklaerungDe(stopsPerKm2: number | null | undefined): string {
	const cat = describeOepnvDichte(stopsPerKm2);
	switch (cat) {
		case 'sehr dicht':
			return 'Das entspricht dem Niveau innerstädtischer Bezirke, mit Tram- und Bus-Halten in kurzem Fußweg-Abstand.';
		case 'dicht':
			return 'Das Netz erreicht typische Werte für gemischte Innenstadt-Lagen mit gutem Anschluss an U- oder S-Bahn.';
		case 'mittel':
			return 'Das Netz liegt im Berliner Mittelfeld, vorrangig getragen durch Bus und Tram.';
		case 'dünn':
			return 'Die Haltedichte liegt unter dem Berliner Schnitt, lange Wege zum nächsten Halt sind möglich.';
		default:
			return 'Für diesen Bereich liegt keine ÖPNV-Dichte im Aggregat vor.';
	}
}

export function formatStopsPerKm2(value: number): string {
	return value.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}
