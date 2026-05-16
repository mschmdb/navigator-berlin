/**
 * Story 2.5b: Sub-Slot-Helper für Wohnen-Cluster.
 *
 * Quellen:
 * - Mietspiegel-Wohnlage 2024 (ordinal-kategorisch: einfach / mittel / gut),
 * - Monitoring Soziale Stadtentwicklung (MSS, ordinal: niedrig / mittel / hoch),
 * - Bodenrichtwerte (BRW, numerisch in €/m² Grundstückspreis).
 *
 * Sprachliche Disziplin (Memory `project_compare_editorial_profiles`,
 * `feedback_no_lebenswert`): KEINE evaluativen Adjektive wie „gut/schlecht"
 * über ganze Kieze; ausschließlich kategoriale Beschreibungen aus der Quelle.
 */

export type WohnlageDe = 'einfache Wohnlage' | 'mittlere Wohnlage' | 'gute Wohnlage' | 'unbekannt';

const WOHNLAGE_MAP: Record<string, WohnlageDe> = {
	einfach: 'einfache Wohnlage',
	'einfache wohnlage': 'einfache Wohnlage',
	mittel: 'mittlere Wohnlage',
	'mittlere wohnlage': 'mittlere Wohnlage',
	gut: 'gute Wohnlage',
	'gute wohnlage': 'gute Wohnlage'
};

export function describeWohnlageDe(raw: string | null | undefined): WohnlageDe {
	if (!raw) return 'unbekannt';
	return WOHNLAGE_MAP[raw.trim().toLowerCase()] ?? 'unbekannt';
}

export type MssDe = 'niedrig' | 'mittel' | 'hoch' | 'sehr hoch' | 'unbekannt';

const MSS_MAP: Record<string, MssDe> = {
	niedrig: 'niedrig',
	mittel: 'mittel',
	hoch: 'hoch',
	'sehr hoch': 'sehr hoch'
};

export function describeMssDe(raw: string | null | undefined): MssDe {
	if (!raw) return 'unbekannt';
	return MSS_MAP[raw.trim().toLowerCase()] ?? 'unbekannt';
}

/**
 * Stigma-disziplinierte Beschreibung der MSS-Kategorie für FAQ-Antworten.
 * Bezieht sich immer auf den Aggregat-Raum (Bezirk/Kiez), niemals auf einzelne
 * Adressen. Vermeidet wertende Begriffe wie „schlechte Lage" oder „sozial schwach".
 */
export function mssBeschreibungDe(raw: string | null | undefined): string {
	const cat = describeMssDe(raw);
	switch (cat) {
		case 'niedrig':
			return 'Der Index zeigt für diesen Raum aktuell wenig sozio-ökonomische Belastung.';
		case 'mittel':
			return 'Der Index liegt im mittleren Bereich der Berliner Verteilung.';
		case 'hoch':
			return 'Der Index zeigt überdurchschnittliche sozio-ökonomische Belastung im Berliner Vergleich.';
		case 'sehr hoch':
			return 'Der Index gehört zur höchsten Belastungsstufe in der Berliner Klassifikation.';
		default:
			return 'Für diesen Raum liegt aktuell keine MSS-Einstufung im Datensatz vor.';
	}
}
