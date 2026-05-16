/**
 * Story 2.5b: Sub-Slot-Helper für Grün-Cluster.
 *
 * Werte stammen aus `gruenversorgung-2023` (ordinal-kategorisch pro Planungsraum)
 * plus aggregierte Zähler `gruenanlagenCount` / `spielplaetzeCount` aus
 * separaten Punkt-Layern.
 */

export type GruenCategoryDe = 'gut' | 'mittel' | 'gering' | 'unbekannt';

const NORMALISATION: Record<string, GruenCategoryDe> = {
	hoch: 'gut',
	'sehr hoch': 'gut',
	mittel: 'mittel',
	niedrig: 'gering',
	gering: 'gering'
};

export function describeGruenversorgungDe(raw: string | null | undefined): GruenCategoryDe {
	if (!raw) return 'unbekannt';
	return NORMALISATION[raw.trim().toLowerCase()] ?? 'unbekannt';
}

export function gruenErklaerungDe(raw: string | null | undefined): string {
	const cat = describeGruenversorgungDe(raw);
	switch (cat) {
		case 'gut':
			return 'Die Berliner Senatsverwaltung stuft die Grünversorgung pro Einwohnerin hier als ausreichend ein.';
		case 'mittel':
			return 'Die Grünversorgung pro Einwohnerin liegt im mittleren Bereich der Berliner Verteilung.';
		case 'gering':
			return 'Die Grünversorgung pro Einwohnerin liegt unter dem Berliner Richtwert von 6 m² pro Person.';
		default:
			return 'Für diesen Bereich liegt im Datensatz keine Grünversorgungs-Kategorie vor.';
	}
}
