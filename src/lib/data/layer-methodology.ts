// TODO Story 3.1: i18n-Migration → Paraglide-Messages `layer.methodik.{slug}.*`.
//
// Phase 1 (Story 2.5a, DE-only): Authority-Strings sind aus zentraler Map
// `$lib/data/authorities.ts` aufgelöst. EN-Coverage komplett auf Phase 3
// verschoben (Memory `project_i18n_phase_1_de_only`). Spec-Struktur ist
// i18n-ready: `authorityKey` löst per `resolveAuthority(key, locale)` auf,
// Phase 3 muss nur EN-Strings in `authorities.ts` ergänzen, kein Refactor
// hier.
//
// Composites (z.B. BVG-Stops aus OSM) werden via `authoritySuffix`
// zusammengesetzt. Suffixe bleiben sprach-neutral (technische Lizenz-Marker).

import {
	AUTHORITY_SUFFIX_OSM_ODBL,
	resolveAuthority,
	type AuthorityKey,
	type Locale
} from './authorities.js';

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

interface LayerMethodologySpec {
	readonly calculation?: string;
	readonly coverageGaps?: string[];
	readonly omissions?: string[];
	readonly relatedLayers?: string[];
	readonly aggregationLevel?: AggregationLevel;
	readonly updateFrequency?: string;
	readonly authorityKey: AuthorityKey;
	/**
	 * Optionaler sprach-neutraler Suffix (z.B. OSM-Attribution + Lizenz-Marker).
	 * Wird an den aufgelösten Authority-String angehängt.
	 */
	readonly authoritySuffix?: string;
}

const LAYER_METHODOLOGY_SPECS: Record<string, LayerMethodologySpec> = {
	bezirke: {
		calculation:
			'Polygone der 12 Berliner Verwaltungsbezirke aus dem Berliner Geoportal, vereinfacht via mapshaper visvalingam mit keep-shapes.',
		aggregationLevel: 'bezirk',
		updateFrequency: 'sehr selten (administrative Änderungen)',
		authorityKey: 'odis',
		relatedLayers: ['ortsteile', 'plz']
	},
	ortsteile: {
		calculation:
			'Polygone der 96 statistischen Ortsteile, historisch oft eigene Gemeinden vor der Eingemeindung 1920. Quelle ODIS Berlin.',
		aggregationLevel: 'bezirk',
		updateFrequency: 'sehr selten',
		authorityKey: 'odis',
		relatedLayers: ['bezirke', 'plz']
	},
	plz: {
		calculation:
			'Postleitzahlen-Gebiete für Berlin. Eine PLZ kann mehrere Ortsteile schneiden, deckt sich also nicht mit politischen Grenzen.',
		aggregationLevel: 'bezirk',
		updateFrequency: 'selten (Anpassung durch Deutsche Post)',
		authorityKey: 'odis',
		relatedLayers: ['bezirke', 'ortsteile']
	},

	bodenrichtwerte: {
		calculation:
			'Vom Berliner Gutachterausschuss jährlich festgestellte Lagewerte für unbebauten Boden, blockweise aggregiert. Wert pro Quadratmeter, differenziert nach Nutzungsart.',
		aggregationLevel: 'block',
		updateFrequency: 'jährlich',
		authorityKey: 'gutachterausschuss-grundstuecke',
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
		authorityKey: 'senatsvw-mietspiegel',
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
		authorityKey: 'senatsvw-stadtentwicklung-bezirke',
		omissions: ['Schutz vor Mieterhöhung kann Umzugschancen mindern. Layer wertet das nicht.'],
		relatedLayers: ['milieuschutz-staedtebau', 'wohnlagen-2024']
	},
	'milieuschutz-staedtebau': {
		calculation:
			'Polygone der städtebaulichen Erhaltungsverordnungen nach §172 BauGB zum Schutz des Stadtbildes (häufig Altbau- oder Gründerzeit-Quartiere).',
		aggregationLevel: 'block',
		updateFrequency: 'unregelmäßig',
		authorityKey: 'bezirksamt-bauamt',
		relatedLayers: ['milieuschutz-erhaltungsmiete']
	},
	'mss-gesamtindex-2025': {
		calculation:
			'Monitoring Soziale Stadtentwicklung 2025: Gesamtindex aus zwei Achsen pro LOR-Planungsraum. Status-Index (sehr niedrig bis hoch) gewichtet Einkommen, Beschäftigung und Bildung. Dynamik-Index (negativ, stabil, positiv) zeigt die Veränderung gegenüber dem vorhergehenden MSS-Zyklus. Berechnung durch die Senatsverwaltung für Stadtentwicklung Berlin.',
		aggregationLevel: 'lor-planungsraum',
		updateFrequency: 'rund alle zwei Jahre (MSS-Zyklus)',
		authorityKey: 'senatsvw-stadtentwicklung',
		coverageGaps: [
			'Planungsräume mit unter 300 Einwohner:innen oder Ausreißer-Profil bleiben ohne Zuordnung.',
			'Aggregat-Daten je rund 7.500 Einwohner:innen. Mikro-Lagen verschwinden im Mittel.'
		],
		omissions: [
			'Einzel-Indikatoren wie Arbeitslosenquote oder Transferbezug-Quote werden bewusst nicht in der Adress-Anzeige ausgespielt. Sie wären auf Adress-Ebene schärfer und stigmatisierender als das Aggregat.',
			'Keine Bewertung als „guter" oder „schlechter" Kiez. Niedriger Status spiegelt strukturelle Unterschiede in Einkommen, Beschäftigung und Bildung, keine Wohnqualität.'
		],
		relatedLayers: ['wohnlagen-2024', 'bodenrichtwerte', 'umweltgerechtigkeit-2023']
	},

	'laerm-2023': {
		calculation:
			'Modellierte Lärm-Gesamtbelastung pro LOR-Planungsraum aus dem Berliner Umweltatlas 2023. Aggregation in Kategorien gering bis sehr hoch.',
		aggregationLevel: 'lor-planungsraum',
		updateFrequency: 'alle 5 Jahre (EU-Umgebungslärm-Richtlinie)',
		authorityKey: 'senatsvw-umwelt',
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
		authorityKey: 'senatsvw-umwelt',
		coverageGaps: ['Aggregat pro Planungsraum, einzelne Hot-Spots gemittelt.'],
		omissions: ['Pollen- und Allergen-Belastung sind nicht enthalten.'],
		relatedLayers: ['laerm-2023', 'bioklima-2023', 'umweltgerechtigkeit-2023']
	},
	'bioklima-2023': {
		calculation:
			'Bioklimatische Sommer-Belastung pro LOR-Planungsraum aus dem Umweltatlas 2023. Indikator für Hitzeinsel-Effekte und Versiegelung.',
		aggregationLevel: 'lor-planungsraum',
		updateFrequency: 'alle 5 Jahre',
		authorityKey: 'senatsvw-umwelt',
		coverageGaps: ['Aggregat pro Planungsraum, Mikroklima im Hof unsichtbar.'],
		relatedLayers: ['klima-pet-2022', 'gruenversorgung-2023', 'umweltgerechtigkeit-2023']
	},
	'gruenversorgung-2023': {
		calculation:
			'Pro-Kopf-Versorgung mit nutzbarem öffentlichem Grün pro LOR-Planungsraum aus dem Umweltatlas 2023. Skala gering bis sehr hoch.',
		aggregationLevel: 'lor-planungsraum',
		updateFrequency: 'alle 5 Jahre',
		authorityKey: 'senatsvw-umwelt',
		omissions: ['Private Gärten und Hofflächen zählen nicht zur Pro-Kopf-Versorgung.'],
		relatedLayers: ['gruenanlagen', 'umweltgerechtigkeit-2023']
	},
	'umweltgerechtigkeit-2023': {
		calculation:
			'Kombinierter Index aus Lärm, Luft, Bioklima und Grünversorgung gewichtet mit sozialem Status. Identifiziert Mehrfachbelastung pro LOR-Planungsraum.',
		aggregationLevel: 'lor-planungsraum',
		updateFrequency: 'alle 3 bis 5 Jahre',
		authorityKey: 'senatsvw-umwelt',
		coverageGaps: [
			'Vor-Aggregat aus vier Einzel-Layern. Doppelzählung in Cross-Layer-Indices vermeiden.'
		],
		omissions: ['Keine personenbezogene Bewertung, nur Stadtteil-Aggregat.'],
		relatedLayers: ['laerm-2023', 'luft-2023', 'bioklima-2023', 'gruenversorgung-2023']
	},

	'klima-pet-2022': {
		calculation:
			'Physiologisch Äquivalente Temperatur (PET) an einem Hitzetag um 14 Uhr aus der Berliner Klimaanalyse 2022. Modelliert für 10×10 Meter Raster, hier auf Polygon-Geometrie reduziert.',
		aggregationLevel: 'block',
		updateFrequency: 'unregelmäßig (zuletzt 2022, davor 2015)',
		authorityKey: 'senatsvw-umwelt',
		coverageGaps: [
			'Nicht alle Stadtflächen modelliert. nearestPolygonFallbackKm fängt Lücken an Block-Rändern ab.'
		],
		omissions: ['Nachtwerte werden separat ausgewiesen.'],
		relatedLayers: [
			'bioklima-2023',
			'klima-kaltlufteinwirkbereich-2022',
			'klima-leitbahnkorridor-2022'
		]
	},
	'klima-kaltlufteinwirkbereich-2022': {
		calculation:
			'Stadtgebiete, die nachts von Kaltluft aus Wäldern, Wiesen und Parks profitieren. Quelle: Berliner Klimaanalyse 2022.',
		aggregationLevel: 'block',
		updateFrequency: 'unregelmäßig',
		authorityKey: 'senatsvw-umwelt',
		relatedLayers: ['klima-leitbahnkorridor-2022', 'klima-pet-2022']
	},
	'klima-leitbahnkorridor-2022': {
		calculation:
			'Talraum-Strukturen, Straßenzüge und Freiflächen, durch die nachts Kaltluft in die Stadt strömt.',
		aggregationLevel: 'block',
		updateFrequency: 'unregelmäßig',
		authorityKey: 'senatsvw-umwelt',
		omissions: [
			'Bebauung in Korridoren bremst die Kühlung. Layer zeigt nur Geometrie, keine Verlustrechnung.'
		],
		relatedLayers: ['klima-kaltlufteinwirkbereich-2022', 'klima-pet-2022']
	},

	stolpersteine: {
		calculation:
			'Standorte der vor letzten frei gewählten Wohnorten verlegten Messing-Plaketten für NS-Opfer. Konzept Gunter Demnig, Daten aus OpenStreetMap, gepflegt von lokalen Initiativen.',
		aggregationLevel: 'point-osm',
		updateFrequency: 'kontinuierlich (Verlegungen + OSM-Korrekturen)',
		authorityKey: 'stolpersteine-initiativen',
		authoritySuffix: AUTHORITY_SUFFIX_OSM_ODBL,
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
		authorityKey: 'senatsvw-bildung',
		omissions: ['Keine Belegungsquoten oder Wartelisten-Daten.'],
		relatedLayers: ['einschulbereiche-2024', 'schulen-2024']
	},
	'schulen-2024': {
		calculation:
			'Allgemeinbildende Schulen aus dem Berliner Schulverzeichnis 2024 als Punkt-Layer.',
		aggregationLevel: 'address',
		updateFrequency: 'jährlich',
		authorityKey: 'senatsvw-bildung',
		omissions: [
			'Keine Schul-Qualitäts-Bewertung. Inspektions-Berichte separat über Senatsverwaltung.'
		],
		relatedLayers: ['einschulbereiche-2024', 'kitas-2024']
	},
	'einschulbereiche-2024': {
		calculation:
			'Räumlich definierte Grundschul-Einzugsbereiche. Kinder werden in der Regel der Schule des Einschulbereichs ihres Wohnorts zugewiesen.',
		aggregationLevel: 'block',
		updateFrequency: 'jährlich (zum Schuljahres-Wechsel)',
		authorityKey: 'senatsvw-bildung',
		omissions: ['Ausnahmen sind möglich, Layer zeigt nur die Regel-Zuordnung.'],
		relatedLayers: ['schulen-2024']
	},
	'krankenhaeuser-plan': {
		calculation: 'Kliniken aus dem Berliner Krankenhausplan mit gesetzlichem Versorgungsauftrag.',
		aggregationLevel: 'address',
		updateFrequency: 'fortlaufend (Plan-Änderungen)',
		authorityKey: 'senatsvw-gesundheit',
		relatedLayers: ['krankenhaeuser-weitere']
	},
	'krankenhaeuser-weitere': {
		calculation:
			'Private oder spezialisierte Kliniken außerhalb des Krankenhausplans, häufig Reha- oder Privatkliniken.',
		aggregationLevel: 'address',
		updateFrequency: 'fortlaufend',
		authorityKey: 'senatsvw-gesundheit',
		relatedLayers: ['krankenhaeuser-plan']
	},
	'sportanlagen-2024': {
		calculation:
			'Sportstätten aus dem Bezirklichen Sportstättenverzeichnis 2024: Sportplätze, Hallen, Tennisanlagen, Schwimmbecken.',
		aggregationLevel: 'address',
		updateFrequency: 'jährlich',
		authorityKey: 'senatsvw-inneres-sport',
		relatedLayers: ['schwimmbaeder', 'spielplaetze']
	},
	gruenanlagen: {
		calculation:
			'Öffentlich gewidmete Grün- und Erholungsflächen, gepflegt durch die Bezirks-Grünflächenämter.',
		aggregationLevel: 'block',
		updateFrequency: 'unregelmäßig (Bezirks-Pflege-Daten)',
		authorityKey: 'bezirksamt-gruenflaeche',
		relatedLayers: ['gruenversorgung-2023', 'spielplaetze']
	},
	spielplaetze: {
		calculation:
			'Öffentlich zugängliche Kinderspielplätze aus dem Berliner Grünanlagen-Register.',
		aggregationLevel: 'address',
		updateFrequency: 'fortlaufend',
		authorityKey: 'bezirksamt-gruenflaeche',
		omissions: ['Keine Geräte-Inventur, keine Sanierungs-Status-Daten.'],
		relatedLayers: ['gruenanlagen']
	},
	schwimmbaeder: {
		calculation:
			'Standorte der Berliner Bäder-Betriebe und vergleichbarer Einrichtungen: Hallenbäder, Sommerbäder, Kombibäder, Strandbäder.',
		aggregationLevel: 'address',
		updateFrequency: 'fortlaufend',
		authorityKey: 'baeder-betriebe',
		omissions: ['Saisonale Öffnungszeiten und Eintrittspreise sind nicht enthalten.']
	},
	trinkbrunnen: {
		calculation:
			'Standorte öffentlicher Trinkwasser-Brunnen der Berliner Wasserbetriebe, abgeleitet aus OpenStreetMap.',
		aggregationLevel: 'point-osm',
		updateFrequency: 'fortlaufend (OSM)',
		authorityKey: 'wasser-betriebe',
		authoritySuffix: AUTHORITY_SUFFIX_OSM_ODBL,
		coverageGaps: ['Layer aktiv Mai bis Oktober. Außerhalb der Saison Frostschutz-Abschaltung.'],
		relatedLayers: ['gruenanlagen']
	},

	'radverkehrsnetz-2025': {
		calculation:
			'Berliner Radverkehrsnetz inklusive Vorrangrouten 2025 nach dem Mobilitätsgesetz. Linien-Layer, abgeleitet aus offiziellen Geo-Daten.',
		aggregationLevel: 'point-osm',
		updateFrequency: 'jährlich',
		authorityKey: 'senatsvw-mvku',
		relatedLayers: ['fahrradstrassen-2024']
	},
	'fahrradstrassen-2024': {
		calculation:
			'Straßen mit StVO-Zeichen 244.1 (Fahrradstraße). Andere Fahrzeuge nur ausnahmsweise und mit Schrittgeschwindigkeit.',
		aggregationLevel: 'point-osm',
		updateFrequency: 'jährlich',
		authorityKey: 'senatsvw-mvku-short',
		relatedLayers: ['radverkehrsnetz-2025']
	},
	'ubahn-stationen': {
		calculation: 'BVG-U-Bahnhöfe aus OpenStreetMap-Routen-Relationen, gefiltert nach operator BVG.',
		aggregationLevel: 'point-osm',
		updateFrequency: 'fortlaufend (OSM)',
		authorityKey: 'bvg',
		authoritySuffix: AUTHORITY_SUFFIX_OSM_ODBL,
		relatedLayers: ['ubahn-netz']
	},
	'sbahn-stationen': {
		calculation: 'S-Bahn-Bahnhöfe aus OpenStreetMap, abgeleitet aus VBB-GTFS-Stations-Set.',
		aggregationLevel: 'point-osm',
		updateFrequency: 'fortlaufend',
		authorityKey: 'sbahn',
		authoritySuffix: AUTHORITY_SUFFIX_OSM_ODBL,
		relatedLayers: ['sbahn-netz']
	},
	'tram-haltestellen': {
		calculation: 'BVG-Tram-Haltestellen aus OpenStreetMap, vor allem im Ostteil der Stadt.',
		aggregationLevel: 'point-osm',
		updateFrequency: 'fortlaufend',
		authorityKey: 'bvg',
		authoritySuffix: AUTHORITY_SUFFIX_OSM_ODBL,
		relatedLayers: ['tram-netz']
	},
	'bus-haltestellen': {
		calculation: 'BVG-Bushaltestellen Stadt- und Regionalbusse aus OpenStreetMap.',
		aggregationLevel: 'point-osm',
		updateFrequency: 'fortlaufend',
		authorityKey: 'bvg',
		authoritySuffix: AUTHORITY_SUFFIX_OSM_ODBL
	},
	'ubahn-netz': {
		calculation:
			'BVG-U-Bahn-Linienverlauf 9 Linien aus OpenStreetMap-Routen-Relationen, gefiltert nach operator BVG.',
		aggregationLevel: 'point-osm',
		updateFrequency: 'fortlaufend',
		authorityKey: 'bvg',
		authoritySuffix: AUTHORITY_SUFFIX_OSM_ODBL,
		relatedLayers: ['ubahn-stationen']
	},
	'tram-netz': {
		calculation: 'BVG-Straßenbahn-Linienverlauf 22 Linien aus OpenStreetMap.',
		aggregationLevel: 'point-osm',
		updateFrequency: 'fortlaufend',
		authorityKey: 'bvg',
		authoritySuffix: AUTHORITY_SUFFIX_OSM_ODBL,
		relatedLayers: ['tram-haltestellen']
	},
	'sbahn-netz': {
		calculation:
			'Linienverlauf des Berliner S-Bahn-Netzes 16 Linien aus OpenStreetMap-Routen-Relationen, gefiltert nach operator S-Bahn Berlin GmbH.',
		aggregationLevel: 'point-osm',
		updateFrequency: 'fortlaufend',
		authorityKey: 'sbahn',
		authoritySuffix: AUTHORITY_SUFFIX_OSM_ODBL,
		relatedLayers: ['sbahn-stationen']
	},

	'kiez-score-ruhe-luft': {
		calculation:
			'Gewichtete Aggregation aus Lärm und Luft pro Planungsraum (Lärm 0.5, Luft 0.5). Lärm seit Story 10.6b als dB-Mittel (L_DEN) aus den Fassadenpunkten der Strategischen Lärmkarte 2022: ≤45 dB → 100, ≥75 dB → 0, linear. Luft als 3-Stufen-Index (gering bis hoch). Beides auf 0–100 normalisiert, Centroid-genau pro LOR-Polygon. Bioklima zählt seit der Score-Neuordnung unter Grün & Hitze.',
		aggregationLevel: 'lor-planungsraum',
		updateFrequency: 'alle 3 bis 5 Jahre (sync mit Umweltatlas-Update)',
		authorityKey: 'navigator-eigenberechnung-senats-daten',
		coverageGaps: [
			'Lärm-dB ist das Mittel über die Fassadenpunkte im LOR; ruhige Hinterhöfe ohne Fassadenpunkt fließen nicht ein.',
			'Modell-Werte, keine Mess-Stationen. Mikrolagen einzelner Adressen bleiben unsichtbar.'
		],
		omissions: [
			'Innenraum-Belastung in Wohnungen nicht enthalten.',
			'Keine getrennte Wertung nach Quelle (Straße, Schiene, Flug).'
		],
		relatedLayers: ['laerm-2023', 'luft-2023']
	},
	'kiez-score-gruen-hitze': {
		calculation:
			'Nutzbares Grün und Hitzeschutz pro Planungsraum: Grünversorgung 0.30, Grünanlagen-Nähe 0.15, Bioklima 0.20, PET-Hitzebelastung 0.15, Kaltluft-Einwirkbereich 0.10, Leitbahnkorridor 0.10. PET zählt invertiert (kühler = mehr Punkte). Normalisiert auf 0–100.',
		aggregationLevel: 'lor-planungsraum',
		updateFrequency: 'alle 5 Jahre',
		authorityKey: 'navigator-eigenberechnung-senats-daten',
		coverageGaps: [
			'Private Gärten und Höfe zählen nicht zur öffentlichen Grünversorgung.',
			'PET variiert auf Block-Ebene stark, im LOR-Aggregat geglättet.'
		],
		omissions: ['Qualität und Pflege-Zustand der Parks nicht enthalten.'],
		relatedLayers: [
			'gruenversorgung-2023',
			'gruenanlagen',
			'bioklima-2023',
			'klima-pet-2022',
			'klima-kaltlufteinwirkbereich-2022',
			'klima-leitbahnkorridor-2022'
		]
	},
	'kiez-score-mobilitaet': {
		calculation:
			'Distance-basiert vom Adress-Punkt zu nächster U-Bahn (0.35), S-Bahn (0.25), Tram (0.20) und Bus (0.10) Haltestelle plus Berlin-weite Radverkehrs-Presence (0.10). 0 m entspricht 100, 1.000 m entspricht 0, linear interpoliert.',
		aggregationLevel: 'address',
		updateFrequency: 'fortlaufend (OSM)',
		authorityKey: 'navigator-eigenberechnung-osm-radverkehr',
		coverageGaps: [
			'Taktfrequenz und Linien-Angebot der Haltestelle nicht berücksichtigt.',
			'Barrierefreiheit der Stops nicht gewertet.'
		],
		omissions: [
			'Sharing-Angebote (Bike, Scooter, Car) nicht enthalten.',
			'Fußwege-Qualität jenseits der Luftlinie nicht abgebildet.'
		],
		relatedLayers: [
			'ubahn-stationen',
			'sbahn-stationen',
			'tram-haltestellen',
			'bus-haltestellen',
			'radverkehrsnetz-2025',
			'fahrradstrassen-2024'
		]
	},
	'kiez-score-versorgung': {
		calculation:
			'Kita doppelt gemessen: Distanz zur nächsten Kita (Gewicht 0.15, Threshold 500 m) plus Plätze pro Kind 0-6 im Planungsraum (0.15). Der Pro-Kopf-Term summiert die gemeldeten Kita-Plätze (e_platz) im LOR und teilt durch die Kinder 0-6 aus dem Einwohner-Datensatz: ab 0.35 Plätzen pro Kind volle Punktzahl, linear darunter. Die Erreichbarkeit zählt dabei die Anzahl Einrichtungen im Radius (Dichte), nicht nur die nächste: mehr Kitas/Schulen/Spielplätze im Umkreis scoren höher, ein einzelner Standort weniger. Schule nach Schulart getrennt: Grundschule (0.15, Radius 600 m) und weiterführende Schule (0.15, 1.200 m). Plus Spielplatz-Dichte (0.15, 400 m). Liegt keine Einrichtung im Radius, greift ein weicher Übergang über die Distanz zur nächsten statt eines harten Abbruchs. Plan-Krankenhaus (0.25, 2.000 m) zusätzlich nach Bettenkapazität gewichtet: ein großes Versorgungs-Klinikum zählt mehr als eine kleine Fachklinik. 0 m → 100, Threshold → 0, linear. Spielplätze (Polygone) nutzen den Geometrie-Mittelpunkt als POI-Punkt. Grünanlagen zählen seit der Score-Neuordnung unter Grün & Hitze.',
		aggregationLevel: 'lor-planungsraum',
		updateFrequency: 'jährlich (sync mit Bildungs- und Bezirks-Daten)',
		authorityKey: 'navigator-eigenberechnung-bezirke',
		coverageGaps: [
			'Der Platz-Kind-Quotient basiert auf gemeldeten Kapazitäten (e_platz), nicht auf realen Belegungsquoten oder Wartelisten.',
			'Belegungsquoten, Wartelisten und Trägerschaft sind im Score nicht berücksichtigt.',
			'Polygon-Layer kollabieren zum Mittelpunkt. Ein langgezogener Park am Rand erscheint im Score zentriert.'
		],
		omissions: [
			'Keine Qualitäts-Bewertung der Einrichtung (Layer zeigt nur Standort).',
			'Privat-Krankenhäuser und Reha-Kliniken bleiben außen vor (nur Plan-Krankenhäuser).'
		],
		relatedLayers: ['kitas-2024', 'schulen-2024', 'krankenhaeuser-plan', 'spielplaetze']
	},
	'kiez-score-wohnschutz': {
		calculation:
			'Verdrängungsschutz pro Planungsraum: Liegt der Raum in einem Milieuschutzgebiet (Erhaltungssatzung Wohnraum oder städtebauliche Erhaltungssatzung, ODER-verknüpft), gilt Schutz als vorhanden (100), sonst 0. Auf Bezirksregion/Bezirk flächen-gewichteter Anteil geschützter Planungsräume. Positiv eindeutig: mehr Schutz ist besser.',
		aggregationLevel: 'lor-planungsraum',
		updateFrequency: 'fortlaufend (Bezirks-Verordnungen)',
		authorityKey: 'navigator-eigenberechnung-senats-daten',
		coverageGaps: [
			'Schutz-Status sagt nichts über die tatsächliche Mietentwicklung im Gebiet.',
			'Gebiets-Grenzen ändern sich durch neue Verordnungen, der Datenstand kann nachlaufen.'
		],
		omissions: [
			'Umwandlungsverbot, Vorkaufsrecht und Genehmigungspraxis einzelner Bezirke nicht abgebildet.',
			'Keine Aussage über konkrete Miethöhe oder Verdrängungsdruck.'
		],
		relatedLayers: ['milieuschutz-erhaltungsmiete', 'milieuschutz-staedtebau']
	}
};

function specToMethodology(spec: LayerMethodologySpec, locale: Locale): LayerMethodology {
	const authorityBase = resolveAuthority(spec.authorityKey, locale);
	const authority = spec.authoritySuffix ? `${authorityBase} ${spec.authoritySuffix}` : authorityBase;
	return {
		calculation: spec.calculation,
		coverageGaps: spec.coverageGaps,
		omissions: spec.omissions,
		relatedLayers: spec.relatedLayers,
		aggregationLevel: spec.aggregationLevel,
		updateFrequency: spec.updateFrequency,
		authority
	};
}

function buildResolvedMap(locale: Locale): Record<string, LayerMethodology> {
	const result: Record<string, LayerMethodology> = {};
	for (const [slug, spec] of Object.entries(LAYER_METHODOLOGY_SPECS)) {
		result[slug] = specToMethodology(spec, locale);
	}
	return result;
}

/**
 * Resolved Methodology-Map für DE (Phase 1).
 *
 * Output-API bleibt rückwärtskompatibel: `authority` ist ein String. Phase 3
 * wird `LAYER_METHODOLOGY_EN` (oder `LAYER_METHODOLOGY[locale]`) ergänzen ohne
 * Schema-Bruch.
 */
export const LAYER_METHODOLOGY_DE: Record<string, LayerMethodology> = buildResolvedMap('de');

export function getLayerMethodology(slug: string): LayerMethodology | null {
	return LAYER_METHODOLOGY_DE[slug] ?? null;
}

/**
 * Phase-3-Bereitstellung: liefert die rohe Spec inkl. `authorityKey`. Phase 3
 * kann darauf basierend EN-Resolved-Map bauen oder Tests gegen Key-Coverage
 * schreiben.
 */
export function getLayerMethodologySpec(slug: string): LayerMethodologySpec | null {
	return LAYER_METHODOLOGY_SPECS[slug] ?? null;
}

export type { LayerMethodologySpec };
