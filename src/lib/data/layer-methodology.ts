// TODO Story 3.1: i18n-Migration → Paraglide-Messages `layer.methodik.{slug}.*`.

export const AGGREGATION_LEVELS = [
	'address',
	'lor-planungsraum',
	'lor-bezirksregion',
	'lor-prognoseraum',
	'bezirk',
	'block',
	'point-osm'
] as const;

export type AggregationLevel = (typeof AGGREGATION_LEVELS)[number];

export interface LayerMethodology {
	readonly calculation?: string;
	readonly coverageGaps?: string[];
	readonly omissions?: string[];
	readonly relatedLayers?: string[];
	readonly aggregationLevel?: AggregationLevel;
	readonly updateFrequency?: string;
	readonly authority?: string;
}

const SENATSVW_UMWELT =
	'Senatsverwaltung für Mobilität, Verkehr, Klimaschutz und Umwelt · Umweltatlas Berlin';
const ODIS = 'ODIS Berlin · Open Data Informationsstelle';
const OSM = 'OpenStreetMap-Contributors';
const SENATSVW_BILDUNG = 'Senatsverwaltung für Bildung, Jugend und Familie';
const SENATSVW_GESUNDHEIT = 'Senatsverwaltung für Wissenschaft, Gesundheit und Pflege';
const BVG = 'BVG · Berliner Verkehrsbetriebe (GTFS-Export VBB)';
const SBAHN = 'S-Bahn Berlin GmbH (DB-Konzern) · Routen aus OpenStreetMap-Relationen';

export const LAYER_METHODOLOGY_DE: Record<string, LayerMethodology> = {
	bezirke: {
		calculation:
			'Polygone der 12 Berliner Verwaltungsbezirke aus dem Berliner Geoportal, vereinfacht via mapshaper visvalingam mit keep-shapes.',
		aggregationLevel: 'bezirk',
		updateFrequency: 'sehr selten (administrative Änderungen)',
		authority: ODIS,
		relatedLayers: ['ortsteile', 'plz']
	},
	ortsteile: {
		calculation:
			'Polygone der 96 statistischen Ortsteile, historisch oft eigene Gemeinden vor der Eingemeindung 1920. Quelle ODIS Berlin.',
		aggregationLevel: 'bezirk',
		updateFrequency: 'sehr selten',
		authority: ODIS,
		relatedLayers: ['bezirke', 'plz']
	},
	plz: {
		calculation:
			'Postleitzahlen-Gebiete für Berlin. Eine PLZ kann mehrere Ortsteile schneiden, deckt sich also nicht mit politischen Grenzen.',
		aggregationLevel: 'bezirk',
		updateFrequency: 'selten (Anpassung durch Deutsche Post)',
		authority: ODIS,
		relatedLayers: ['bezirke', 'ortsteile']
	},

	bodenrichtwerte: {
		calculation:
			'Vom Berliner Gutachterausschuss jährlich festgestellte Lagewerte für unbebauten Boden, blockweise aggregiert. Wert pro Quadratmeter, differenziert nach Nutzungsart.',
		aggregationLevel: 'block',
		updateFrequency: 'jährlich',
		authority: 'Geschäftsstelle des Gutachterausschusses für Grundstückswerte in Berlin',
		coverageGaps: [
			'Nur unbebaute Vergleichsbasis. Bebaute Grundstücke werden indirekt abgeleitet.',
			'Sonderlagen (Bahnflächen, Friedhöfe, Wasser) erscheinen ohne Wert.'
		],
		omissions: [
			'Kein Mietpreis und kein Verkaufspreis. Mietspiegel-Werte gehören zu wohnlagen-2024.',
			'Keine Spekulations- oder Marktpreis-Indikation.'
		],
		relatedLayers: ['wohnlagen-2024']
	},
	'wohnlagen-2024': {
		calculation:
			'Wohnlagen-Aggregat aus dem Berliner Mietspiegel 2024 pro LOR-Planungsraum, vom IBB Wohnungsmarktbericht abgeleitet. Ordinalskala einfach bis bestlage.',
		aggregationLevel: 'lor-planungsraum',
		updateFrequency: 'alle zwei Jahre (Mietspiegel-Zyklus)',
		authority: 'Senatsverwaltung für Stadtentwicklung, Bauen und Wohnen · Mietspiegel-Geschäftsstelle',
		coverageGaps: [
			'Pro Planungsraum nur ein Wert. Block-Mikrolagen verschwinden.',
			'Gewerbe- und Mischgebiete erscheinen ggf. ohne Wohnlagen-Eintrag.'
		],
		omissions: [
			'Konkrete €/m² liefert nur der offizielle Mietspiegel-Rechner unter mietspiegel.berlin.de.',
			'Keine Aussage zu Wohnqualität im Sinne von „besser oder schlechter wohnen".'
		],
		relatedLayers: ['bodenrichtwerte', 'milieuschutz-erhaltungsmiete']
	},
	'milieuschutz-erhaltungsmiete': {
		calculation:
			'Polygone der sozialen Erhaltungsverordnungen nach §172 BauGB. Schutz vor Verdrängung durch Modernisierung und Umwandlung.',
		aggregationLevel: 'block',
		updateFrequency: 'unregelmäßig (Bezirksbeschlüsse)',
		authority: 'Senatsverwaltung für Stadtentwicklung, Bauen und Wohnen · Bezirksämter',
		omissions: [
			'Schutz vor Mieterhöhung kann Umzugschancen mindern. Layer wertet das nicht.'
		],
		relatedLayers: ['milieuschutz-staedtebau', 'wohnlagen-2024']
	},
	'milieuschutz-staedtebau': {
		calculation:
			'Polygone der städtebaulichen Erhaltungsverordnungen nach §172 BauGB zum Schutz des Stadtbildes (häufig Altbau- oder Gründerzeit-Quartiere).',
		aggregationLevel: 'block',
		updateFrequency: 'unregelmäßig',
		authority: 'Bezirksämter Berlin · Bauämter',
		relatedLayers: ['milieuschutz-erhaltungsmiete']
	},

	'laerm-2023': {
		calculation:
			'Modellierte Lärm-Gesamtbelastung pro LOR-Planungsraum aus dem Berliner Umweltatlas 2023. Aggregation in Kategorien gering bis sehr hoch.',
		aggregationLevel: 'lor-planungsraum',
		updateFrequency: 'alle 5 Jahre (EU-Umgebungslärm-Richtlinie)',
		authority: SENATSVW_UMWELT,
		coverageGaps: [
			'Modellwerte, keine flächendeckenden Mess-Stationen.',
			'Innenraum-Lärm in Wohnungen bleibt unberücksichtigt.'
		],
		omissions: [
			'Keine Trennung nach Quelle (Straße, Schiene, Flug) auf dieser Aggregat-Ebene.',
			'Nachtruhe-Kennwerte separat im Umweltatlas, hier nur Gesamtbelastung.'
		],
		relatedLayers: ['luft-2023', 'bioklima-2023', 'umweltgerechtigkeit-2023']
	},
	'luft-2023': {
		calculation:
			'Modellierte Stickoxid- und Feinstaub-Belastung pro LOR-Planungsraum aus dem Berliner Umweltatlas 2023. Verkehrsmodell plus Mess-Stationen.',
		aggregationLevel: 'lor-planungsraum',
		updateFrequency: 'alle 3 bis 5 Jahre',
		authority: SENATSVW_UMWELT,
		coverageGaps: [
			'Aggregat pro Planungsraum, einzelne Hot-Spots gemittelt.'
		],
		omissions: ['Pollen- und Allergen-Belastung sind nicht enthalten.'],
		relatedLayers: ['laerm-2023', 'bioklima-2023', 'umweltgerechtigkeit-2023']
	},
	'bioklima-2023': {
		calculation:
			'Bioklimatische Sommer-Belastung pro LOR-Planungsraum aus dem Umweltatlas 2023. Indikator für Hitzeinsel-Effekte und Versiegelung.',
		aggregationLevel: 'lor-planungsraum',
		updateFrequency: 'alle 5 Jahre',
		authority: SENATSVW_UMWELT,
		coverageGaps: ['Aggregat pro Planungsraum, Mikroklima im Hof unsichtbar.'],
		relatedLayers: ['klima-pet-2022', 'gruenversorgung-2023', 'umweltgerechtigkeit-2023']
	},
	'gruenversorgung-2023': {
		calculation:
			'Pro-Kopf-Versorgung mit nutzbarem öffentlichem Grün pro LOR-Planungsraum aus dem Umweltatlas 2023. Skala gering bis sehr hoch.',
		aggregationLevel: 'lor-planungsraum',
		updateFrequency: 'alle 5 Jahre',
		authority: SENATSVW_UMWELT,
		omissions: [
			'Private Gärten und Hofflächen zählen nicht zur Pro-Kopf-Versorgung.'
		],
		relatedLayers: ['gruenanlagen', 'umweltgerechtigkeit-2023']
	},
	'umweltgerechtigkeit-2023': {
		calculation:
			'Kombinierter Index aus Lärm, Luft, Bioklima und Grünversorgung gewichtet mit sozialem Status. Identifiziert Mehrfachbelastung pro LOR-Planungsraum.',
		aggregationLevel: 'lor-planungsraum',
		updateFrequency: 'alle 3 bis 5 Jahre',
		authority: SENATSVW_UMWELT,
		coverageGaps: [
			'Vor-Aggregat aus vier Einzel-Layern. Doppelzählung in Cross-Layer-Indices vermeiden.'
		],
		omissions: [
			'Keine personenbezogene Bewertung, nur Stadtteil-Aggregat.'
		],
		relatedLayers: ['laerm-2023', 'luft-2023', 'bioklima-2023', 'gruenversorgung-2023']
	},

	'klima-pet-2022': {
		calculation:
			'Physiologisch Äquivalente Temperatur (PET) an einem Hitzetag um 14 Uhr aus der Berliner Klimaanalyse 2022. Modelliert für 10×10 Meter Raster, hier auf Polygon-Geometrie reduziert.',
		aggregationLevel: 'block',
		updateFrequency: 'unregelmäßig (zuletzt 2022, davor 2015)',
		authority: SENATSVW_UMWELT,
		coverageGaps: [
			'Nicht alle Stadtflächen modelliert. nearestPolygonFallbackKm fängt Lücken an Block-Rändern ab.'
		],
		omissions: ['Nachtwerte werden separat ausgewiesen.'],
		relatedLayers: ['bioklima-2023', 'klima-kaltlufteinwirkbereich-2022', 'klima-leitbahnkorridor-2022']
	},
	'klima-kaltlufteinwirkbereich-2022': {
		calculation:
			'Stadtgebiete, die nachts von Kaltluft aus Wäldern, Wiesen und Parks profitieren. Quelle: Berliner Klimaanalyse 2022.',
		aggregationLevel: 'block',
		updateFrequency: 'unregelmäßig',
		authority: SENATSVW_UMWELT,
		relatedLayers: ['klima-leitbahnkorridor-2022', 'klima-pet-2022']
	},
	'klima-leitbahnkorridor-2022': {
		calculation:
			'Talraum-Strukturen, Straßenzüge und Freiflächen, durch die nachts Kaltluft in die Stadt strömt.',
		aggregationLevel: 'block',
		updateFrequency: 'unregelmäßig',
		authority: SENATSVW_UMWELT,
		omissions: ['Bebauung in Korridoren bremst die Kühlung. Layer zeigt nur Geometrie, keine Verlustrechnung.'],
		relatedLayers: ['klima-kaltlufteinwirkbereich-2022', 'klima-pet-2022']
	},

	stolpersteine: {
		calculation:
			'Standorte der vor letzten frei gewählten Wohnorten verlegten Messing-Plaketten für NS-Opfer. Konzept Gunter Demnig, Daten aus OpenStreetMap, gepflegt von lokalen Initiativen.',
		aggregationLevel: 'point-osm',
		updateFrequency: 'kontinuierlich (Verlegungen + OSM-Korrekturen)',
		authority: `Stolpersteine-Initiativen Berlin · ${OSM} (ODbL 1.0)`,
		coverageGaps: [
			'Erfassung in OSM ist nicht vollständig. Nicht jedes verlegte Stein-Set ist gemappt.'
		],
		omissions: [
			'Personen-Biografien sind externe Primärquellen (stolpersteine-berlin.de). Wir generieren keine Texte.',
			'Kein Wohn-Score, keine Bewertung, keine Verdichtungs-Statistik. Würde-Prinzip gemäß FR50 und FR51.'
		]
	},

	'kitas-2024': {
		calculation:
			'Anerkannte Berliner Kindertageseinrichtungen 2024 als Punkt-Layer. Trägerschaft öffentlich, kirchlich oder frei.',
		aggregationLevel: 'address',
		updateFrequency: 'jährlich',
		authority: SENATSVW_BILDUNG,
		omissions: ['Keine Belegungsquoten oder Wartelisten-Daten.'],
		relatedLayers: ['einschulbereiche-2024', 'schulen-2024']
	},
	'schulen-2024': {
		calculation:
			'Allgemeinbildende Schulen aus dem Berliner Schulverzeichnis 2024 als Punkt-Layer.',
		aggregationLevel: 'address',
		updateFrequency: 'jährlich',
		authority: SENATSVW_BILDUNG,
		omissions: ['Keine Schul-Qualitäts-Bewertung. Inspektions-Berichte separat über Senatsverwaltung.'],
		relatedLayers: ['einschulbereiche-2024', 'kitas-2024']
	},
	'einschulbereiche-2024': {
		calculation:
			'Räumlich definierte Grundschul-Einzugsbereiche. Kinder werden in der Regel der Schule des Einschulbereichs ihres Wohnorts zugewiesen.',
		aggregationLevel: 'block',
		updateFrequency: 'jährlich (zum Schuljahres-Wechsel)',
		authority: SENATSVW_BILDUNG,
		omissions: ['Ausnahmen sind möglich, Layer zeigt nur die Regel-Zuordnung.'],
		relatedLayers: ['schulen-2024']
	},
	'krankenhaeuser-plan': {
		calculation:
			'Kliniken aus dem Berliner Krankenhausplan mit gesetzlichem Versorgungsauftrag.',
		aggregationLevel: 'address',
		updateFrequency: 'fortlaufend (Plan-Änderungen)',
		authority: SENATSVW_GESUNDHEIT,
		relatedLayers: ['krankenhaeuser-weitere']
	},
	'krankenhaeuser-weitere': {
		calculation:
			'Private oder spezialisierte Kliniken außerhalb des Krankenhausplans, häufig Reha- oder Privatkliniken.',
		aggregationLevel: 'address',
		updateFrequency: 'fortlaufend',
		authority: SENATSVW_GESUNDHEIT,
		relatedLayers: ['krankenhaeuser-plan']
	},
	'sportanlagen-2024': {
		calculation:
			'Sportstätten aus dem Bezirklichen Sportstättenverzeichnis 2024: Sportplätze, Hallen, Tennisanlagen, Schwimmbecken.',
		aggregationLevel: 'address',
		updateFrequency: 'jährlich',
		authority: 'Senatsverwaltung für Inneres und Sport · Bezirksämter',
		relatedLayers: ['schwimmbaeder', 'spielplaetze']
	},
	gruenanlagen: {
		calculation:
			'Öffentlich gewidmete Grün- und Erholungsflächen, gepflegt durch die Bezirks-Grünflächenämter.',
		aggregationLevel: 'block',
		updateFrequency: 'unregelmäßig (Bezirks-Pflege-Daten)',
		authority: 'Bezirksämter Berlin · Grünflächenämter',
		relatedLayers: ['gruenversorgung-2023', 'spielplaetze']
	},
	spielplaetze: {
		calculation:
			'Öffentlich zugängliche Kinderspielplätze aus dem Berliner Grünanlagen-Register.',
		aggregationLevel: 'address',
		updateFrequency: 'fortlaufend',
		authority: 'Bezirksämter Berlin · Grünflächenämter',
		omissions: ['Keine Geräte-Inventur, keine Sanierungs-Status-Daten.'],
		relatedLayers: ['gruenanlagen']
	},
	schwimmbaeder: {
		calculation:
			'Standorte der Berliner Bäder-Betriebe und vergleichbarer Einrichtungen: Hallenbäder, Sommerbäder, Kombibäder, Strandbäder.',
		aggregationLevel: 'address',
		updateFrequency: 'fortlaufend',
		authority: 'Berliner Bäder-Betriebe (BBB) · Bezirksämter',
		omissions: ['Saisonale Öffnungszeiten und Eintrittspreise sind nicht enthalten.']
	},
	trinkbrunnen: {
		calculation:
			'Standorte öffentlicher Trinkwasser-Brunnen der Berliner Wasserbetriebe, abgeleitet aus OpenStreetMap.',
		aggregationLevel: 'point-osm',
		updateFrequency: 'fortlaufend (OSM)',
		authority: `Berliner Wasserbetriebe · ${OSM} (ODbL 1.0)`,
		coverageGaps: ['Layer aktiv Mai bis Oktober. Außerhalb der Saison Frostschutz-Abschaltung.'],
		relatedLayers: ['gruenanlagen']
	},

	'radverkehrsnetz-2025': {
		calculation:
			'Berliner Radverkehrsnetz inklusive Vorrangrouten 2025 nach dem Mobilitätsgesetz. Linien-Layer, abgeleitet aus offiziellen Geo-Daten.',
		aggregationLevel: 'point-osm',
		updateFrequency: 'jährlich',
		authority: 'Senatsverwaltung für Mobilität, Verkehr, Klimaschutz und Umwelt (SenMVKU)',
		relatedLayers: ['fahrradstrassen-2024']
	},
	'fahrradstrassen-2024': {
		calculation:
			'Straßen mit StVO-Zeichen 244.1 (Fahrradstraße). Andere Fahrzeuge nur ausnahmsweise und mit Schrittgeschwindigkeit.',
		aggregationLevel: 'point-osm',
		updateFrequency: 'jährlich',
		authority: 'SenMVKU',
		relatedLayers: ['radverkehrsnetz-2025']
	},
	'ubahn-stationen': {
		calculation:
			'BVG-U-Bahnhöfe aus OpenStreetMap-Routen-Relationen, gefiltert nach operator BVG.',
		aggregationLevel: 'point-osm',
		updateFrequency: 'fortlaufend (OSM)',
		authority: `${BVG} · ${OSM} (ODbL 1.0)`,
		relatedLayers: ['ubahn-netz']
	},
	'sbahn-stationen': {
		calculation:
			'S-Bahn-Bahnhöfe aus OpenStreetMap, abgeleitet aus VBB-GTFS-Stations-Set.',
		aggregationLevel: 'point-osm',
		updateFrequency: 'fortlaufend',
		authority: `${SBAHN} · ${OSM} (ODbL 1.0)`,
		relatedLayers: ['sbahn-netz']
	},
	'tram-haltestellen': {
		calculation:
			'BVG-Tram-Haltestellen aus OpenStreetMap, vor allem im Ostteil der Stadt.',
		aggregationLevel: 'point-osm',
		updateFrequency: 'fortlaufend',
		authority: `${BVG} · ${OSM} (ODbL 1.0)`,
		relatedLayers: ['tram-netz']
	},
	'bus-haltestellen': {
		calculation:
			'BVG-Bushaltestellen Stadt- und Regionalbusse aus OpenStreetMap.',
		aggregationLevel: 'point-osm',
		updateFrequency: 'fortlaufend',
		authority: `${BVG} · ${OSM} (ODbL 1.0)`
	},
	'ubahn-netz': {
		calculation:
			'BVG-U-Bahn-Linienverlauf 9 Linien aus OpenStreetMap-Routen-Relationen, gefiltert nach operator BVG.',
		aggregationLevel: 'point-osm',
		updateFrequency: 'fortlaufend',
		authority: `${BVG} · ${OSM} (ODbL 1.0)`,
		relatedLayers: ['ubahn-stationen']
	},
	'tram-netz': {
		calculation:
			'BVG-Straßenbahn-Linienverlauf 22 Linien aus OpenStreetMap.',
		aggregationLevel: 'point-osm',
		updateFrequency: 'fortlaufend',
		authority: `${BVG} · ${OSM} (ODbL 1.0)`,
		relatedLayers: ['tram-haltestellen']
	},
	'sbahn-netz': {
		calculation:
			'Linienverlauf des Berliner S-Bahn-Netzes 16 Linien aus OpenStreetMap-Routen-Relationen, gefiltert nach operator S-Bahn Berlin GmbH.',
		aggregationLevel: 'point-osm',
		updateFrequency: 'fortlaufend',
		authority: `${SBAHN} · ${OSM} (ODbL 1.0)`,
		relatedLayers: ['sbahn-stationen']
	}
};

export function getLayerMethodology(slug: string): LayerMethodology | null {
	return LAYER_METHODOLOGY_DE[slug] ?? null;
}
