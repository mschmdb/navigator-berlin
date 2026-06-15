/**
 * Demografie-Kontext pro LOR-Planungsraum (Story 10.5). Neutraler Kontext, kein
 * Score-Input (ADR-015). Anteile als 0-1, Quotienten je 100 Erwerbsfähige.
 */
export interface KiezDemografieData {
	einwohner: number;
	dichteEwKm2: number | null;
	anteilKinder0bis6: number;
	anteilKinder6bis12: number;
	anteilSenioren65plus: number;
	jugendquotient: number | null;
	altenquotient: number | null;
	erwerbsanteil: number | null;
	datenstand: string;
	quelle: string;
	lizenz: string;
}

/**
 * Räumlicher Bezug des Bevölkerungsprofils. 'standort' = LOR-Planungsraum am Marker
 * (feinste Einheit, 542), 'kiez' = LOR-Bezirksregion (143), 'bezirk' = Bezirk (12).
 */
export type DemografieScope = 'standort' | 'kiez' | 'bezirk';

/** Demografie pro Scope, von der Inspector-Ebene aufgelöst (Story 10.5). */
export interface DemografieByScope {
	standort: KiezDemografieData | null;
	kiez: KiezDemografieData | null;
	bezirk: KiezDemografieData | null;
}
