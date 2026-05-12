// TODO Story 3.1: i18n-Migration → Paraglide-Messages `layer.explain.{slug}`.
export const LAYER_EXPLAIN_DE: Record<string, string> = {
	bezirke: 'Verwaltungsbezirk Berlins (12 insgesamt)',
	ortsteile: 'Statistischer Ortsteil innerhalb des Bezirks',
	plz: 'Postleitzahlen-Region',
	'lor-prognoseraum': 'LOR-Prognoseraum (Senatsverwaltung-Gliederung)',
	'lor-bezirksregion': 'LOR-Bezirksregion (Kiez-Ebene, 138 in Berlin)',
	'lor-planungsraum': 'LOR-Planungsraum (feinste Ebene)',
	'mietspiegel-wohnlage': 'Wohnlagen-Bewertung im Berliner Mietspiegel',
	bodenrichtwerte: 'Durchschnittlicher Grundstückspreis pro Quadratmeter',
	gebaeudealter: 'Baujahr-Klasse der Gebäude im Gebiet',
	'laerm-den': 'Straßenverkehrs-Lärmpegel Tag/Abend/Nacht (24h-Mittel)',
	'laerm-night': 'Straßenverkehrs-Lärmpegel nur Nacht (22–6 Uhr)',
	solarpotenzial: 'Geschätztes Solar-Energie-Potenzial des Daches',
	klimaanalyse: 'Klimafunktionsraum-Bewertung (Senatsverwaltung)',
	stolpersteine: 'Gedenkstein für Opfer des Nationalsozialismus',
	trinkbrunnen: 'Öffentlicher Trinkwasser-Brunnen (Mai–Oktober aktiv)'
};

export function explainLayer(slug: string): string {
	return LAYER_EXPLAIN_DE[slug] ?? '';
}
