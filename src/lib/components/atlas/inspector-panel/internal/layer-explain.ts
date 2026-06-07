// TODO Story 3.1: i18n-Migration → Paraglide-Messages `layer.{slug}.short` / `layer.{slug}.long`.

export interface LayerExplain {
	readonly short: string;
	readonly long: string;
	readonly unit?: string;
	readonly valueScaleExplain?: string;
}

export type LayerExplainKind = 'short' | 'long';

const EMPTY_EXPLAIN: LayerExplain = { short: '', long: '' };

export const LAYER_EXPLAIN_DE: Record<string, LayerExplain> = {
	// A: Boundaries
	bezirke: {
		short: 'Verwaltungsbezirk Berlins (12 insgesamt)',
		long: 'Politisch-administrative Gliederung Berlins in 12 Bezirke. Jeder Bezirk hat eigenes Bezirksamt, Bezirksbürgermeister:in und eigenständige Schul-, Sport- und Gesundheitsämter. Quelle: ODIS Berlin (dl-de/zero).'
	},
	ortsteile: {
		short: 'Statistischer Ortsteil innerhalb des Bezirks',
		long: 'Berlin gliedert sich in 96 Ortsteile, historisch oft eigenständige Gemeinden. Genutzt für Statistik, Adress-Zuordnung und Identifikation (z.B. „Ich wohne in Friedrichshain"). Quelle: ODIS Berlin.'
	},
	plz: {
		short: 'Postleitzahlen-Region',
		long: 'Berliner Postleitzahlen-Gebiete. Eine PLZ kann mehrere Kieze oder Ortsteile umfassen, deckt sich also nicht mit Bezirks- oder Ortsteilgrenzen. Quelle: ODIS Berlin.'
	},

	// B: Wohn-Daten
	bodenrichtwerte: {
		short: 'Durchschnittlicher Grundstückspreis pro Quadratmeter (Stand 2026)',
		long: 'Vom Berliner Gutachterausschuss jährlich festgestellte Lagewerte für unbebauten Boden. Indikator für Bodenwert, kein Marktpreis und kein Mietpreis. Differenziert nach Nutzungsart (Wohnen, Gewerbe, Mischgebiet).',
		unit: '€/m²',
		valueScaleExplain: 'Höher = teurer (Innenstadt-Lagen oft >5000 €/m², Rand-Lagen <500 €/m²)'
	},
	'wohnlagen-2024': {
		short: 'Wohnlagen-Bewertung im Berliner Mietspiegel 2024 (Aggregat pro Planungsraum)',
		long: 'Aggregierte Wohnlagen-Einstufung aus dem Berliner Mietspiegel 2024 pro Planungsraum. Konkrete €/m² siehe offizieller Mietspiegel-Rechner. Einstufung beruht auf Lage, Verkehrsanbindung, Versorgung und Wohnumfeld.',
		valueScaleExplain: '1 einfach, 2 mittel, 3 gut, 4 sehr gut, 5 bestlage (Mietspiegel-Definition)'
	},
	'milieuschutz-erhaltungsmiete': {
		short: 'Milieuschutzgebiet (soziale Erhaltungsverordnung §172 BauGB)',
		long: 'Gebiet mit sozialer Erhaltungsverordnung. Schützt vor Verdrängung durch Modernisierung, Umwandlung in Eigentumswohnungen und Luxussanierung. Mietsteigerungen und Umbauten brauchen Genehmigung des Bezirks.'
	},
	'milieuschutz-staedtebau': {
		short: 'Städtebauliche Erhaltungsverordnung (Stadtbildschutz nach §172 BauGB)',
		long: 'Gebiet mit städtebaulicher Erhaltungsverordnung zum Schutz des städtebaulichen Erscheinungsbildes. Abriss oder Veränderungen brauchen Genehmigung, häufig in Altbau- oder Gründerzeit-Quartieren.'
	},
	'mss-gesamtindex-2025': {
		short: 'Strukturelle soziale Lage je Planungsraum (MSS 2025, SenStadt Berlin)',
		long: 'Monitoring Soziale Stadtentwicklung 2025: aggregierter Gesamtindex aus Status- und Dynamik-Indikatoren pro LOR-Planungsraum (rund 7.500 Einwohner:innen). Strukturelle Aggregat-Größe, keine Bewertung einzelner Adressen oder Personen. Quelle: Senatsverwaltung für Stadtentwicklung Berlin.',
		valueScaleExplain:
			'Status hoch / mittel / niedrig / sehr niedrig kombiniert mit Dynamik positiv / stabil / negativ. Niedriger Status bedeutet nicht „schlechter Kiez", sondern strukturelle Unterschiede in Einkommen, Beschäftigung und Bildung.'
	},

	// C: Umwelt — Umweltatlas 2023
	'laerm-2023': {
		short: 'Lärmbelastung im Stadtteil (Umweltatlas 2023)',
		long: 'Kategorisierte Lärm-Gesamtbelastung pro Planungsraum aus dem Berliner Umweltatlas 2023. Berücksichtigt Straßen-, Schienen- und Fluglärm. Indikator für Verdrängung der Wohnruhe.',
		valueScaleExplain: 'niedrig (gut) bis sehr hoch (problematisch)'
	},
	'luft-2023': {
		short: 'Luftbelastung im Stadtteil (Umweltatlas 2023)',
		long: 'Kategorisierte Luftqualität pro Planungsraum: Stickoxide und Feinstaub. Datengrundlage: Berliner Umweltatlas 2023, Verkehrsmodell plus Messstationen.',
		valueScaleExplain: 'niedrig (gut) bis sehr hoch (problematisch)'
	},
	'gruenversorgung-2023': {
		short: 'Grünversorgung im Stadtteil (Umweltatlas 2023)',
		long: 'Pro-Kopf-Versorgung mit nutzbarem öffentlichem Grün im Planungsraum. Indikator für Erholungsräume und Klimaresilienz. Kategorisch von niedrig bis sehr hoch.',
		valueScaleExplain: 'niedrig = wenig Grün, sehr hoch = gut versorgt'
	},
	'bioklima-2023': {
		short: 'Thermische Belastung im Sommer (Umweltatlas 2023)',
		long: 'Bioklimatische Belastung an Hitzetagen pro Planungsraum: Hitzeinsel-Effekt, Versiegelung, Kühlung durch Grün. Relevant für Hitzeschutz besonders älterer Menschen und chronisch Kranker.',
		valueScaleExplain: 'niedrig bis sehr hoch (Hitzestress-Risiko)'
	},
	'umweltgerechtigkeit-2023': {
		short: 'Umweltgerechtigkeit gesamt: Mehrfachbelastung im Stadtteil',
		long: 'Kombinierter Indikator aus Lärm, Luft, Bioklima und Grünversorgung zusammen mit dem sozialen Status. Identifiziert Mehrfachbelastung in benachteiligten Stadtteilen (Berliner Umweltgerechtigkeitsbericht 2023).',
		valueScaleExplain: 'niedrig bis sehr hoch (kumulierte Belastung)'
	},

	// C: Umwelt — Klimaanalyse 2022
	'klima-pet-2022': {
		short: 'Gefühlte Temperatur an Hitzetagen um 14 Uhr (Klimaanalyse 2022)',
		long: 'Physiologisch Äquivalente Temperatur (PET) als Maß für die gefühlte Hitzebelastung an einem Sommertag um 14 Uhr. Berücksichtigt Lufttemperatur, Strahlung, Wind und Feuchte. Die Karte deckt Siedlung, Straßenraum und Grünflächen ab. Gewässer wie Seen und Kanäle tragen keinen PET-Wert und bleiben leer. Quelle: Berliner Klimaanalyse 2022.',
		unit: '°C',
		valueScaleExplain: 'unter 32 °C neutral, 32 bis 41 °C warm bis heiß, über 41 °C extrem heiß'
	},
	'klima-kaltlufteinwirkbereich-2022': {
		short: 'Bereich, der nachts von Kaltluft aus dem Umland gekühlt wird',
		long: 'Stadtgebiete, die nachts von der Kaltluft-Produktion aus Wäldern, Wiesen und Parks profitieren. Wichtig für sommerliche Nachtkühlung und Stadtklima-Resilienz. Quelle: Berliner Klimaanalyse 2022.'
	},
	'klima-leitbahnkorridor-2022': {
		short: 'Korridor, durch den nachts Kaltluft in die Stadt strömt',
		long: 'Talraum-Strukturen, Straßenzüge oder Freiflächen, durch die nachts Kaltluft aus dem Umland in die Stadt strömt. Bebauung in diesen Korridoren bremst die Kühlung. Quelle: Berliner Klimaanalyse 2022.'
	},

	// D: Memorial
	stolpersteine: {
		short: 'Gedenkstein für Opfer des Nationalsozialismus',
		long: 'Vor letzten frei gewählten Wohnorten verlegte Messing-Plaketten, die Namen und Schicksal von NS-Opfern bewahren. Konzept Gunter Demnig. Daten aus OpenStreetMap, kuratiert von lokalen Stolpersteine-Initiativen.'
	},
	'denkmal-2024': {
		short: 'Eingetragenes Bau- oder Gartendenkmal Berlins',
		long: 'Objekte aus der Berliner Denkmalliste (Landesdenkmalamt). Umfasst Baudenkmale, Gartendenkmale, Bodendenkmale und Denkmalbereiche. Datengrundlage für Heritage-Dichte-Aggregat pro Bezirk/Kiez.'
	},
	trinkbrunnen: {
		short: 'Öffentlicher Trinkwasser-Brunnen (Mai bis Oktober aktiv)',
		long: 'Von den Berliner Wasserbetrieben betriebener öffentlicher Trinkbrunnen. Saisonal aktiv: Mai bis Oktober wegen Frostschutz. Standort-Daten aus OpenStreetMap (ODbL 1.0).'
	},

	// E: Soziale Infrastruktur
	'kitas-2024': {
		short: 'Kindertagesstätte (Kita)',
		long: 'Anerkannte Berliner Kindertageseinrichtung 2024. Trägerschaft öffentlich, kirchlich oder frei. Quelle: Senatsverwaltung für Bildung, Jugend und Familie.'
	},
	'schulen-2024': {
		short: 'Allgemeinbildende Schule (Stand 2024)',
		long: 'Grundschule, Sekundarschule, Gemeinschaftsschule oder Gymnasium im Berliner Schulverzeichnis 2024. Quelle: Senatsverwaltung für Bildung.'
	},
	'einschulbereiche-2024': {
		short: 'Einschulbereich: Grundschule für die Kinder dieses Gebiets',
		long: 'Räumlich definierter Grundschulbezirk. Kinder werden in der Regel der Schule des Einschulbereichs zugewiesen, in dem sie wohnen. Ausnahmen möglich. Quelle: Senatsverwaltung Bildung, Stand 2024.'
	},
	'krankenhaeuser-plan': {
		short: 'Plan-Krankenhaus aus dem Berliner Krankenhausplan',
		long: 'Im Berliner Krankenhausplan aufgeführte Klinik mit gesetzlichem Versorgungsauftrag. Quelle: Senatsverwaltung für Wissenschaft, Gesundheit und Pflege.'
	},
	'krankenhaeuser-weitere': {
		short: 'Weiteres Krankenhaus außerhalb des Krankenhausplans',
		long: 'Private oder spezialisierte Klinik außerhalb des Berliner Krankenhausplans, häufig Privatklinik oder Rehabilitations-Einrichtung. Quelle: Senatsverwaltung Gesundheit.'
	},
	'sportanlagen-2024': {
		short: 'Öffentlich oder vereinsgenutzte Sportanlage',
		long: 'Sportstätte (Sportplatz, Sporthalle, Schwimmbecken, Tennisplatz) im Bezirklichen Sportstättenverzeichnis 2024. Quelle: Senatsverwaltung für Inneres und Sport.'
	},
	gruenanlagen: {
		short: 'Öffentliche Grünanlage (Park, Schmuckplatz, Stadtwald)',
		long: 'Öffentlich gewidmete Grünfläche zur Naherholung: Park, Schmuckplatz, Stadtplatz, Spielplatz oder Stadtwald. Pflege durch die Grünflächenämter der Bezirke.'
	},
	spielplaetze: {
		short: 'Öffentlicher Spielplatz',
		long: 'Öffentlich zugänglicher Kinderspielplatz mit Spielgeräten, gepflegt durch das Grünflächenamt des Bezirks. Quelle: Berliner Grünanlagen-Register.'
	},
	'nahversorgung-lebensmittel': {
		short: 'Lebensmittel-Nahversorgung (Supermarkt, Discounter, Spätkauf, Bäcker)',
		long: 'Geschäfte der täglichen Lebensmittelversorgung: Supermarkt, Discounter, Convenience/Spätkauf und Bäckerei. Fließt als Dichte-Term in die Versorgungs-Dimension des Kiez-Scores. Standort-Daten aus OpenStreetMap (ODbL 1.0).'
	},
	'nahversorgung-apotheke': {
		short: 'Apotheke',
		long: 'Öffentliche Apotheke für Arzneimittel und gesundheitsnahe Grundversorgung. Teil des Nahversorgungs-Terms der Versorgungs-Dimension. Standort-Daten aus OpenStreetMap (ODbL 1.0).'
	},
	'nahversorgung-post': {
		short: 'Post- oder Paketstelle',
		long: 'Postfiliale, Paketshop oder Postdienststelle für Brief- und Paketversand. Teil des Nahversorgungs-Terms der Versorgungs-Dimension. Standort-Daten aus OpenStreetMap (ODbL 1.0).'
	},
	schwimmbaeder: {
		short: 'Öffentliches Schwimmbad oder Schwimmhalle',
		long: 'Berliner Bäder-Betriebe (BBB) und vergleichbare Einrichtungen: Hallenbad, Sommerbad, Kombibad oder Strandbad. Saisonale Öffnungszeiten beachten.'
	},

	// F: Mobilität
	'radverkehrsnetz-2025': {
		short: 'Radverkehrsnetz 2025 mit Vorrangrouten',
		long: 'Berliner Radverkehrsnetz inklusive Radvorrangrouten 2025. Hauptrouten für den Alltagsradverkehr, ausgebaut nach Berliner Mobilitätsgesetz. Quelle: SenMVKU.'
	},
	'fahrradstrassen-2024': {
		short: 'Fahrradstraße: Radverkehr hat Vorrang',
		long: 'Straße, die für den Fahrradverkehr gewidmet ist (Zeichen 244.1 StVO). Andere Fahrzeuge dürfen nur ausnahmsweise und mit Schrittgeschwindigkeit fahren. Stand 2024.'
	},
	'ubahn-stationen': {
		short: 'U-Bahn-Station (BVG)',
		long: 'BVG-U-Bahn-Bahnhof. 9 Linien, rund 175 Stationen im Netz. Quelle: BVG / VBB-GTFS.'
	},
	'sbahn-stationen': {
		short: 'S-Bahn-Station',
		long: 'S-Bahn-Berlin-Bahnhof. 16 Linien, rund 170 Stationen in Berlin und Umland. Quelle: VBB-GTFS / Deutsche Bahn.'
	},
	'tram-haltestellen': {
		short: 'Straßenbahn-Haltestelle (BVG)',
		long: 'BVG-Straßenbahn-Haltestelle, vor allem im Ostteil der Stadt. 22 Linien. Quelle: BVG GTFS.'
	},
	'bus-haltestellen': {
		short: 'Bushaltestelle (BVG)',
		long: 'BVG-Bushaltestelle, Stadt- und Regionalbusse. Über 7000 Haltestellen in Berlin. Quelle: BVG GTFS.'
	},
	'ubahn-netz': {
		short: 'U-Bahn-Linie (BVG)',
		long: 'BVG-U-Bahn-Linienverlauf, 9 Linien (U1 bis U9). Quelle: BVG Geo-Daten.'
	},
	'tram-netz': {
		short: 'Straßenbahn-Linie (BVG)',
		long: 'BVG-Straßenbahn-Linienverlauf, vor allem im Ostteil Berlins, 22 Linien. Quelle: BVG Geo-Daten.'
	},
	'sbahn-netz': {
		short: 'S-Bahn-Linien-Netz Berlin (Betreiber: S-Bahn Berlin GmbH)',
		long: 'Linienverlauf des Berliner S-Bahn-Netzes, betrieben von der S-Bahn Berlin GmbH (DB-Konzern-Tochter). 16 Linien, rund 330 km Streckennetz, dichteste Verkehrsachsen in Berlin und Umland. Quelle: OpenStreetMap-Routen-Relationen (ODbL 1.0).'
	},

	// G: Kiez-Score (Story 1.28 · virtuelle Aggregat-Layer pro LOR-Planungsraum)
	'kiez-score-gesamt': {
		short: 'Umwelt- & Infrastruktur-Score gesamt pro Planungsraum (0–100)',
		long: 'Ungewichtetes Mittel der fünf Dimensionen (Ruhe & Luft, Grün & Hitze, Mobilität, Versorgung, Wohnschutz) pro LOR-Planungsraum. Misst nur Größen mit eindeutiger Besser-Richtung. Methodik: /methodik/kiez-score.',
		valueScaleExplain: 'Höher = besser über alle fünf Dimensionen'
	},
	'kiez-score-ruhe-luft': {
		short: 'Aggregat „Ruhe & Luft" pro Planungsraum (0–100, Kiez-Score)',
		long: 'Gewichtete Aggregation aus Lärm und Luftbelastung pro LOR-Planungsraum. Cloud-Dancer-Skala: niedrig = stärker belastet, hoch = ruhiger und sauberer. Methodik: /methodik/kiez-score.',
		valueScaleExplain: 'Höher = ruhiger und sauberer'
	},
	'kiez-score-gruen-hitze': {
		short: 'Aggregat „Grün & Hitze" pro Planungsraum (0–100, Kiez-Score)',
		long: 'Grünversorgung und Grünanlagen-Nähe plus thermische Resilienz (Bioklima, PET-Hitzebelastung, Kaltluft-Einwirkbereich, Leitbahnkorridor) pro Planungsraum, gewichtet auf 0–100. Methodik: /methodik/kiez-score.',
		valueScaleExplain: 'Höher = mehr nutzbares Grün und besserer Hitzeschutz'
	},
	'kiez-score-mobilitaet': {
		short: 'Aggregat „Mobilität" pro Planungsraum (0–100, Kiez-Score)',
		long: 'Distance-basiert vom Planungsraum-Centroid zu nächster U-Bahn, S-Bahn, Tram und Bus plus Radverkehrs-Presence. Pro Adresse wird der Wert mit der exakten Adress-Distance überschrieben. Methodik: /methodik/kiez-score.',
		valueScaleExplain: 'Höher = besser angebunden'
	},
	'kiez-score-versorgung': {
		short: 'Aggregat „Versorgung" pro Planungsraum (0–100, Kiez-Score)',
		long: 'Distance vom Planungsraum-Centroid zu nächster Kita, Schule, Plan-Krankenhaus und Spielplatz. Threshold pro POI individuell (Kita 500 m, Schule 800 m, Krankenhaus 2.000 m, Spielplatz 400 m). Methodik: /methodik/kiez-score.',
		valueScaleExplain: 'Höher = bessere Versorgung mit Familien- und Gesundheits-Infrastruktur'
	},
	'kiez-score-wohnschutz': {
		short: 'Aggregat „Wohnschutz" pro Planungsraum (0–100, Kiez-Score)',
		long: 'Verdrängungsschutz: Anteil der Fläche in einem Milieuschutzgebiet (Erhaltungssatzung Wohnraum oder städtebaulich) pro Planungsraum. Positiv-eindeutig: Schutz vorhanden = besser für Bewohner. Methodik: /methodik/kiez-score.',
		valueScaleExplain: 'Höher = mehr Schutz vor Verdrängung'
	},

	// I: Demografie (Story 10.0 · neutraler Kontext, kein Score-Input)
	'einwohner-dichte-2024': {
		short: 'Einwohnerdichte pro LOR-Planungsraum (EW/km², 31.12.2024)',
		long: 'Einwohner je Quadratkilometer pro LOR-Planungsraum. Neutraler Demografie-Kontext, keine Wertung: dicht ist nicht besser oder schlechter als locker. Quelle: Amt für Statistik Berlin-Brandenburg (CC BY 4.0).',
		unit: 'EW/km²',
		valueScaleExplain: 'Höher = dichter besiedelt, ohne Qualitätswertung'
	},

	// Legacy / non-Manifest-Slugs (Story 1.3 Re-Run TODO):
	// referenziert in value-formatters.ts und Tests, halten wir bis Refactor.
	'mietspiegel-wohnlage': {
		short: 'Wohnlagen-Bewertung im Berliner Mietspiegel',
		long: 'Veraltete Wohnlagen-Quelle (vor 2024). Aktuelle Daten siehe Layer „wohnlagen-2024".'
	},
	'lor-prognoseraum': {
		short: 'LOR-Prognoseraum (Senatsverwaltung-Gliederung)',
		long: 'Lebensweltlich orientierter Raum, Ebene Prognoseraum. Grobste der drei LOR-Ebenen, genutzt für Bevölkerungsprognosen.'
	},
	'lor-bezirksregion': {
		short: 'LOR-Bezirksregion (Kiez-Ebene, 138 in Berlin)',
		long: 'Lebensweltlich orientierter Raum, Ebene Bezirksregion. Mittel-Ebene der LOR-Gliederung, häufig als „Kiez-Ebene" verwendet.'
	},
	'lor-planungsraum': {
		short: 'LOR-Planungsraum (feinste Ebene)',
		long: 'Lebensweltlich orientierter Raum, Ebene Planungsraum. Feinste der drei LOR-Ebenen, Grundlage für sozialräumliche Statistik.'
	},
	'laerm-den': {
		short: 'Straßenverkehrs-Lärmpegel Tag/Abend/Nacht (24h-Mittel)',
		long: 'Lärmpegel als 24-Stunden-Mittelwert (Day-Evening-Night). Legacy-Slug aus früherem Strassenlärm-Datensatz.',
		unit: 'dB'
	},
	'laerm-night': {
		short: 'Straßenverkehrs-Lärmpegel nur Nacht (22 bis 6 Uhr)',
		long: 'Lärmpegel als Nacht-Mittelwert. Legacy-Slug aus früherem Strassenlärm-Datensatz.',
		unit: 'dB'
	},
	solarpotenzial: {
		short: 'Geschätztes Solar-Energie-Potenzial des Daches',
		long: 'Modelliertes jährliches PV-Ertragspotenzial pro Dachfläche. Legacy-Slug.',
		unit: 'kWh/m²'
	},
	klimaanalyse: {
		short: 'Klimafunktionsraum-Bewertung (Senatsverwaltung)',
		long: 'Klimafunktionale Bewertung städtischer Flächen. Legacy-Slug, ersetzt durch klima-pet-2022 und Verwandte.'
	},
	gebaeudealter: {
		short: 'Baujahr-Klasse der Gebäude im Gebiet',
		long: 'Aggregierte Baujahr-Klassifikation der Gebäudebestände. Legacy-Slug ohne aktive Manifest-Quelle.'
	},
	'wahlbezirke-btw17': {
		short: 'Wahlbezirks-Grenzen Bundestagswahl 2017',
		long: 'Geometrie der Berliner Wahlbezirke zur Bundestagswahl 2017. Grundlage zur räumlichen Zuordnung der Wahlergebnisse auf der feinsten Ebene.'
	},
	'wahlbezirke-ah16': {
		short: 'Wahlbezirks-Grenzen Abgeordnetenhauswahl 2016',
		long: 'Geometrie der Berliner Wahlbezirke zur Abgeordnetenhauswahl 2016. Grundlage zur räumlichen Zuordnung der Wahlergebnisse auf der feinsten Ebene.'
	},
	'wahlbezirke-ah21': {
		short: 'Wahlbezirks-Grenzen Abgeordnetenhauswahl 2021',
		long: 'Geometrie der Berliner Wahlbezirke zur Abgeordnetenhauswahl 2021. Grundlage zur räumlichen Zuordnung der Wahlergebnisse auf der feinsten Ebene.'
	},
	'wahlbezirke-ah23': {
		short: 'Wahlbezirks-Grenzen Wiederholungswahl 2023',
		long: 'Geometrie der Berliner Wahlbezirke zur Wiederholungswahl des Abgeordnetenhauses 2023. Grundlage zur räumlichen Zuordnung der Wahlergebnisse auf der feinsten Ebene.'
	},
	'wahlbezirke-bt25': {
		short: 'Wahlbezirks-Grenzen Bundestagswahl 2025',
		long: 'Geometrie der Berliner Wahlbezirke zur Bundestagswahl 2025. Grundlage zur räumlichen Zuordnung der Wahlergebnisse auf der feinsten Ebene.'
	}
};

export function getLayerExplain(slug: string, kind: LayerExplainKind): string {
	const entry = LAYER_EXPLAIN_DE[slug];
	if (!entry) return '';
	return entry[kind];
}

export function getLayerExplainEntry(slug: string): LayerExplain {
	return LAYER_EXPLAIN_DE[slug] ?? EMPTY_EXPLAIN;
}

export function explainLayer(slug: string): string {
	return getLayerExplain(slug, 'short');
}

export interface LayerExternalLink {
	readonly href: string;
	readonly label: string;
}

const LAYER_EXTERNAL_LINK: Record<string, LayerExternalLink> = {
	'wohnlagen-2024': {
		href: 'https://mietspiegel.berlin.de/',
		label: 'Mietpreise im Berliner Mietspiegel-Rechner nachschlagen'
	}
};

export function getLayerExternalLink(slug: string): LayerExternalLink | null {
	return LAYER_EXTERNAL_LINK[slug] ?? null;
}
