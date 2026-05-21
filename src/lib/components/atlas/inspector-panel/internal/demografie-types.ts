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
