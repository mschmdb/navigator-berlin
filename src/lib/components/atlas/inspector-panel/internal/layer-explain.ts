// i18n Block C1: Layer-Erklärungen laufen ueber Paraglide-Messages
// (`layer_explain_{slug}_{short|long|scale|unit}`), Slug-Mapping analog zu
// `LAYER_NAME_MESSAGE` in `internal/layer-palette-filter.ts`. `LAYER_EXPLAIN_DE`
// bleibt als DE-Referenz-Export für Tests und DE-only-Direktimporter erhalten
// (Boundary: "Nicht-UI-Konsumenten bleiben unveraendert").
import { m } from '$lib/paraglide/messages.js';
import type { Locale } from '$lib/paraglide/runtime';
import { toAtlasMessageOptions, type LocaleOptions } from '../../internal/atlas-label-options.js';

export interface LayerExplain {
	readonly short: string;
	readonly long: string;
	readonly unit?: string;
	readonly valueScaleExplain?: string;
}

export type LayerExplainKind = 'short' | 'long';

const EMPTY_EXPLAIN: LayerExplain = { short: '', long: '' };

type MessageFn = (params?: undefined, options?: { locale: Locale }) => string;

interface LayerExplainMessages {
	readonly short: MessageFn;
	readonly long: MessageFn;
	readonly scale?: MessageFn;
	readonly unit?: MessageFn;
}

export const LAYER_EXPLAIN_DE: Record<string, LayerExplain> = {
	// A: Boundaries
	bezirke: {
		short: 'Verwaltungsbezirk Berlins (12 insgesamt)',
		long: 'Politisch-administrative Gliederung Berlins in 12 Bezirke. Jeder Bezirk hat eigenes Bezirksamt, Bezirksbürgermeister:in und eigenständige Schul-, Sport- und Gesundheitsämter. Quelle: ODIS Berlin (dl-de/zero).'
	},
	ortsteile: {
		short: 'Statistischer Ortsteil innerhalb des Bezirks',
		long: 'Berlin gliedert sich in 96 Ortsteile, historisch oft eigenständige Gemeinden. Genutzt für Statistik, Adress-Zuordnung und Identifikation (z.B. „Ich wohne in Friedrichshain“). Quelle: ODIS Berlin.'
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
			'Status hoch / mittel / niedrig / sehr niedrig kombiniert mit Dynamik positiv / stabil / negativ. Niedriger Status bedeutet nicht „schlechter Kiez“, sondern strukturelle Unterschiede in Einkommen, Beschäftigung und Bildung.'
	},

	// C: Umwelt — Umweltatlas 2023
	'laerm-2023': {
		short: 'Lärmbelastung im Stadtteil (Umweltatlas 2023)',
		long: 'Kategorisierte Lärm-Gesamtbelastung pro Planungsraum aus dem Berliner Umweltatlas 2023. Berücksichtigt Straßen-, Schienen- und Fluglärm. Indikator für Verdrängung der Wohnruhe.',
		valueScaleExplain: 'gering (gut) bis hoch (problematisch)'
	},
	'luft-2023': {
		short: 'Luftbelastung im Stadtteil (Umweltatlas 2023)',
		long: 'Kategorisierte Luftqualität pro Planungsraum: Stickoxide und Feinstaub. Datengrundlage: Berliner Umweltatlas 2023, Verkehrsmodell plus Messstationen.',
		valueScaleExplain: 'gering (gut) bis hoch (problematisch)'
	},
	'gruenversorgung-2023': {
		short: 'Grünversorgung im Stadtteil (Umweltatlas 2023)',
		long: 'Pro-Kopf-Versorgung mit nutzbarem öffentlichem Grün im Planungsraum. Indikator für Erholungsräume und Klimaresilienz. Drei Kategorien: gering, mittel, hoch.',
		valueScaleExplain: 'gering = wenig Grün, hoch = gut versorgt'
	},
	'bioklima-2023': {
		short: 'Thermische Belastung im Sommer (Umweltatlas 2023)',
		long: 'Bioklimatische Belastung an Hitzetagen pro Planungsraum: Hitzeinsel-Effekt, Versiegelung, Kühlung durch Grün. Relevant für Hitzeschutz besonders älterer Menschen und chronisch Kranker.',
		valueScaleExplain: 'gering bis hoch (Hitzestress-Risiko)'
	},
	'umweltgerechtigkeit-2023': {
		short: 'Umweltgerechtigkeit gesamt: Mehrfachbelastung im Stadtteil',
		long: 'Kombinierter Indikator aus Lärm, Luft, Bioklima und Grünversorgung zusammen mit dem sozialen Status. Identifiziert Mehrfachbelastung in benachteiligten Stadtteilen (Berliner Umweltgerechtigkeitsbericht 2023).',
		valueScaleExplain: 'keine starke bis fünffache Belastung'
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
	'kuehle-orte': {
		short: 'Orte zum Abkühlen bei Hitze in deiner Nähe',
		long: 'Orte in Berlin, die bei Hitze Abkühlung bieten: Kinos, Bibliotheken, Malls, Schwimmhallen, Museen und mehr. Geometrie und Basis-Tags aus OpenStreetMap (ODbL 1.0), ergänzt um eine redaktionelle navigator.berlin-Anreicherung: Kühle-Score, Klimatisierung, Sommer-Verfügbarkeit. Ein Angebot, kein Behörden-Ersatz, kein Rechtsanspruch auf Zugang.'
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

	// J: Kultur (Epic 13, Story 13.0) — Standorte aus OpenStreetMap (ODbL 1.0).
	'kultur-museum': {
		short: 'Museum',
		long: 'Museum oder Ausstellungshaus. Teil des Kultur-Scores (Zugang zu Kulturorten im Umkreis). Standort-Daten aus OpenStreetMap (ODbL 1.0).'
	},
	'kultur-galerie': {
		short: 'Galerie',
		long: 'Kunstgalerie oder Ausstellungsraum. Teil des Kultur-Scores. Standort-Daten aus OpenStreetMap (ODbL 1.0).'
	},
	'kultur-kunst-im-raum': {
		short: 'Kunst im Stadtraum',
		long: 'Kunstwerk im öffentlichen Raum: Skulptur, Wandbild, Installation, Denkmal-Kunst. Teil des Kultur-Scores. Standort-Daten aus OpenStreetMap (ODbL 1.0).'
	},
	'kultur-theater': {
		short: 'Theater oder Bühne',
		long: 'Theater, Bühne oder Opernhaus. Teil des Kultur-Scores. Standort-Daten aus OpenStreetMap (ODbL 1.0).'
	},
	'kultur-bibliothek': {
		short: 'Bibliothek',
		long: 'Öffentliche, wissenschaftliche oder Spezial-Bibliothek. Teil des Kultur-Scores. Standort-Daten aus OpenStreetMap (ODbL 1.0).'
	},
	'kultur-kino': {
		short: 'Kino',
		long: 'Kino oder Lichtspielhaus. Teil des Kultur-Scores. Standort-Daten aus OpenStreetMap (ODbL 1.0).'
	},
	'kultur-soziokultur': {
		short: 'Soziokulturelles Zentrum',
		long: 'Kulturhaus, soziokulturelles Zentrum oder Kunsthaus. Teil des Kultur-Scores. Standort-Daten aus OpenStreetMap (ODbL 1.0).'
	},
	'kultur-club': {
		short: 'Club oder Musikspielstätte',
		long: 'Club, Diskothek oder Live-Musikspielstätte. Teil des Kultur-Scores. Standort-Daten aus OpenStreetMap (ODbL 1.0).'
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
		long: 'Ungewichtetes Mittel der fünf Dimensionen (Ruhe & Luft, Grün & Hitze, Mobilität, Versorgung, Wohnschutz) pro LOR-Planungsraum. Misst nur Größen mit eindeutiger Besser-Richtung.',
		valueScaleExplain: 'Höher = besser über alle fünf Dimensionen'
	},
	'kiez-score-ruhe-luft': {
		short: 'Aggregat „Ruhe & Luft“ pro Planungsraum (0–100, Kiez-Score)',
		long: 'Gewichtete Aggregation aus Lärm und Luftbelastung pro LOR-Planungsraum. Skala: niedrig = stärker belastet, hoch = ruhiger und sauberer.',
		valueScaleExplain: 'Höher = ruhiger und sauberer'
	},
	'kiez-score-gruen-hitze': {
		short: 'Aggregat „Grün & Hitze“ pro Planungsraum (0–100, Kiez-Score)',
		long: 'Grünversorgung und Grünanlagen-Nähe plus thermische Resilienz (Bioklima, PET-Hitzebelastung, Kaltluft-Einwirkbereich, Leitbahnkorridor) pro Planungsraum, gewichtet auf 0–100.',
		valueScaleExplain: 'Höher = mehr nutzbares Grün und besserer Hitzeschutz'
	},
	'kiez-score-mobilitaet': {
		short: 'Aggregat „Mobilität“ pro Planungsraum (0–100, Kiez-Score)',
		long: 'Distance-basiert vom Planungsraum-Centroid zu nächster U-Bahn, S-Bahn, Tram und Bus plus Radverkehrs-Presence. Pro Adresse wird der Wert mit der exakten Adress-Distance überschrieben.',
		valueScaleExplain: 'Höher = besser angebunden'
	},
	'kiez-score-versorgung': {
		short: 'Aggregat „Versorgung“ pro Planungsraum (0–100, Kiez-Score)',
		long: 'Dichte von Kita, Schule, Plan-Krankenhaus und Spielplatz im Umkreis des Planungsraum-Centroids, plus Nahversorgung (Lebensmittel, Apotheke, Post). Radius pro POI individuell (Kita 500 m, Grundschule 600 m, weiterführende Schule 1.200 m, Krankenhaus 2.000 m, Spielplatz 400 m).',
		valueScaleExplain: 'Höher = bessere Versorgung mit Familien- und Gesundheits-Infrastruktur'
	},
	'kiez-score-wohnschutz': {
		short: 'Aggregat „Wohnschutz“ pro Planungsraum (0–100, Kiez-Score)',
		long: 'Verdrängungsschutz: Anteil der Fläche in einem Milieuschutzgebiet (Erhaltungssatzung Wohnraum oder städtebaulich) pro Planungsraum. Positiv-eindeutig: Schutz vorhanden = besser für Bewohner.',
		valueScaleExplain: 'Höher = mehr Schutz vor Verdrängung'
	},
	'kiez-score-kultur': {
		short: 'Aggregat „Kultur“ pro Planungsraum (0–100, Kiez-Score)',
		long: 'Kultureller Zugang: log-gedämpfte Dichte von Bibliothek, Theater, Museum, Kino, Galerie, Soziokultur, Kunst im Stadtraum und Clubs im Umkreis (OSM/ODbL). Eigenständige Dimension, NICHT im Gesamt-Score: Kultur ballt sich in der Innenstadt, daher kein Headline-Treiber.',
		valueScaleExplain: 'Höher = mehr Kulturorte in Reichweite'
	},
	'kiez-score-kriminalitaet': {
		short: 'Erfasste Kriminalität (Häufigkeitszahl) je Bezirksregion',
		long: 'Häufigkeitszahl ausgewählter wohn-relevanter Delikte, 3-Jahres-Mittel aus dem Kriminalitätsatlas Berlin (Polizei Berlin, dl-de-by-2.0). Granularität Bezirksregion, auf Planungsräume gespiegelt. Strukturelle Aggregat-Größe, NICHT im Gesamt-Score. Bezieht Fälle nur auf gemeldete Einwohner, nicht auf Touristen/Pendler.',
		valueScaleExplain:
			'Höher = mehr erfasste Fälle pro Einwohner, kein Maß für persönliches Risiko und keine Wertung als „guter“ oder „schlechter“ Kiez.'
	},

	// I: Demografie (Story 10.0 · neutraler Kontext, kein Score-Input)
	'einwohner-dichte-2024': {
		short: 'Einwohnerdichte pro LOR-Planungsraum (EW/km², 31.12.2024)',
		long: 'Einwohner je Quadratkilometer pro LOR-Planungsraum. Neutraler Demografie-Kontext, keine Wertung: dicht ist nicht besser oder schlechter als locker. Quelle: Amt für Statistik Berlin-Brandenburg (CC BY 4.0).',
		unit: 'EW/km²',
		valueScaleExplain: 'Höher = dichter besiedelt, ohne Qualitätswertung'
	},

	// Glossar-Slugs ohne eigenen Manifest-Layer (referenziert in value-formatters.ts
	// und Tests als Formatierungs-Kontext, halten wir bis Refactor).
	'lor-prognoseraum': {
		short: 'LOR-Prognoseraum (Senatsverwaltung-Gliederung)',
		long: 'Lebensweltlich orientierter Raum, Ebene Prognoseraum. Gröbste der drei LOR-Ebenen, genutzt für Bevölkerungsprognosen.'
	},
	'lor-bezirksregion': {
		short: 'LOR-Bezirksregion (Kiez-Ebene, 138 in Berlin)',
		long: 'Lebensweltlich orientierter Raum, Ebene Bezirksregion. Mittel-Ebene der LOR-Gliederung, häufig als „Kiez-Ebene“ verwendet.'
	},
	'lor-planungsraum': {
		short: 'LOR-Planungsraum (feinste Ebene)',
		long: 'Lebensweltlich orientierter Raum, Ebene Planungsraum. Feinste der drei LOR-Ebenen, Grundlage für sozialräumliche Statistik.'
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
	},
	'wahlbezirke-ah26': {
		short: 'Wahlbezirks-Grenzen Abgeordnetenhauswahl 2026',
		long: 'Geometrie der Berliner Wahlbezirke zur Abgeordnetenhaus- und BVV-Wahl 2026. Grundlage zur räumlichen Zuordnung der Wahlergebnisse auf der feinsten Ebene.'
	},
	'wahlgruppen-btw17': {
		short: 'Briefwahl-Gruppen Bundestagswahl 2017',
		long: 'Zusammengefasste Flächen aus Wahlbezirken und ihrem gemeinsamen Briefwahlbezirk zur Bundestagswahl 2017. Kleinste Kartenebene der Wahl-Ergebniskarte.'
	},
	'wahlgruppen-ah16': {
		short: 'Briefwahl-Gruppen Abgeordnetenhaus- und BVV-Wahl 2016',
		long: 'Zusammengefasste Flächen aus Wahlbezirken und ihrem gemeinsamen Briefwahlbezirk zur Abgeordnetenhaus- und BVV-Wahl 2016. Kleinste Kartenebene der Wahl-Ergebniskarte.'
	},
	'wahlgruppen-ah21': {
		short: 'Briefwahl-Gruppen Bundestags-, Abgeordnetenhaus- und BVV-Wahl 2021',
		long: 'Zusammengefasste Flächen aus Wahlbezirken und ihrem gemeinsamen Briefwahlbezirk zur Bundestagswahl 2021 sowie zur Abgeordnetenhaus- und BVV-Wahl 2021 und deren Wiederholungswahl 2023. Kleinste Kartenebene der Wahl-Ergebniskarte.'
	},
	'wahlgruppen-bt25': {
		short: 'Briefwahl-Gruppen Bundestagswahl 2025',
		long: 'Zusammengefasste Flächen aus Wahlbezirken und ihrem gemeinsamen Briefwahlbezirk zur Bundestagswahl 2025. Kleinste Kartenebene der Wahl-Ergebniskarte.'
	},
	'wahlgruppen-ah26': {
		short: 'Briefwahl-Gruppen Abgeordnetenhaus- und BVV-Wahl 2026',
		long: 'Zusammengefasste Flächen aus Wahlbezirken und ihrem gemeinsamen Briefwahlbezirk zur Abgeordnetenhaus- und BVV-Wahl 2026. Kleinste Kartenebene der Wahl-Ergebniskarte.'
	}
};

// Exportiert (statt modul-privat) fuer den Struktur-Paritaets-Test
// (`layer-explain.test.ts`): eine fehlende Zuordnung soll den Test hart
// fehlschlagen lassen, nicht still auf `LAYER_EXPLAIN_DE`-Fallback-Verhalten
// vertrauen (Review-Fund i18n Block C1).
export const LAYER_EXPLAIN_MESSAGE: Partial<Record<string, LayerExplainMessages>> = {
	bezirke: { short: m.layer_explain_bezirke_short, long: m.layer_explain_bezirke_long },
	ortsteile: { short: m.layer_explain_ortsteile_short, long: m.layer_explain_ortsteile_long },
	plz: { short: m.layer_explain_plz_short, long: m.layer_explain_plz_long },
	bodenrichtwerte: {
		short: m.layer_explain_bodenrichtwerte_short,
		long: m.layer_explain_bodenrichtwerte_long,
		scale: m.layer_explain_bodenrichtwerte_scale,
		unit: m.layer_explain_bodenrichtwerte_unit
	},
	'wohnlagen-2024': {
		short: m.layer_explain_wohnlagen_2024_short,
		long: m.layer_explain_wohnlagen_2024_long,
		scale: m.layer_explain_wohnlagen_2024_scale
	},
	'milieuschutz-erhaltungsmiete': {
		short: m.layer_explain_milieuschutz_erhaltungsmiete_short,
		long: m.layer_explain_milieuschutz_erhaltungsmiete_long
	},
	'milieuschutz-staedtebau': {
		short: m.layer_explain_milieuschutz_staedtebau_short,
		long: m.layer_explain_milieuschutz_staedtebau_long
	},
	'mss-gesamtindex-2025': {
		short: m.layer_explain_mss_gesamtindex_2025_short,
		long: m.layer_explain_mss_gesamtindex_2025_long,
		scale: m.layer_explain_mss_gesamtindex_2025_scale
	},
	'laerm-2023': {
		short: m.layer_explain_laerm_2023_short,
		long: m.layer_explain_laerm_2023_long,
		scale: m.layer_explain_laerm_2023_scale
	},
	'luft-2023': {
		short: m.layer_explain_luft_2023_short,
		long: m.layer_explain_luft_2023_long,
		scale: m.layer_explain_luft_2023_scale
	},
	'gruenversorgung-2023': {
		short: m.layer_explain_gruenversorgung_2023_short,
		long: m.layer_explain_gruenversorgung_2023_long,
		scale: m.layer_explain_gruenversorgung_2023_scale
	},
	'bioklima-2023': {
		short: m.layer_explain_bioklima_2023_short,
		long: m.layer_explain_bioklima_2023_long,
		scale: m.layer_explain_bioklima_2023_scale
	},
	'umweltgerechtigkeit-2023': {
		short: m.layer_explain_umweltgerechtigkeit_2023_short,
		long: m.layer_explain_umweltgerechtigkeit_2023_long,
		scale: m.layer_explain_umweltgerechtigkeit_2023_scale
	},
	'klima-pet-2022': {
		short: m.layer_explain_klima_pet_2022_short,
		long: m.layer_explain_klima_pet_2022_long,
		scale: m.layer_explain_klima_pet_2022_scale,
		unit: m.layer_explain_klima_pet_2022_unit
	},
	'klima-kaltlufteinwirkbereich-2022': {
		short: m.layer_explain_klima_kaltlufteinwirkbereich_2022_short,
		long: m.layer_explain_klima_kaltlufteinwirkbereich_2022_long
	},
	'klima-leitbahnkorridor-2022': {
		short: m.layer_explain_klima_leitbahnkorridor_2022_short,
		long: m.layer_explain_klima_leitbahnkorridor_2022_long
	},
	stolpersteine: {
		short: m.layer_explain_stolpersteine_short,
		long: m.layer_explain_stolpersteine_long
	},
	'denkmal-2024': {
		short: m.layer_explain_denkmal_2024_short,
		long: m.layer_explain_denkmal_2024_long
	},
	trinkbrunnen: {
		short: m.layer_explain_trinkbrunnen_short,
		long: m.layer_explain_trinkbrunnen_long
	},
	'kuehle-orte': {
		short: m.layer_explain_kuehle_orte_short,
		long: m.layer_explain_kuehle_orte_long
	},
	'kitas-2024': { short: m.layer_explain_kitas_2024_short, long: m.layer_explain_kitas_2024_long },
	'schulen-2024': {
		short: m.layer_explain_schulen_2024_short,
		long: m.layer_explain_schulen_2024_long
	},
	'einschulbereiche-2024': {
		short: m.layer_explain_einschulbereiche_2024_short,
		long: m.layer_explain_einschulbereiche_2024_long
	},
	'krankenhaeuser-plan': {
		short: m.layer_explain_krankenhaeuser_plan_short,
		long: m.layer_explain_krankenhaeuser_plan_long
	},
	'krankenhaeuser-weitere': {
		short: m.layer_explain_krankenhaeuser_weitere_short,
		long: m.layer_explain_krankenhaeuser_weitere_long
	},
	'sportanlagen-2024': {
		short: m.layer_explain_sportanlagen_2024_short,
		long: m.layer_explain_sportanlagen_2024_long
	},
	gruenanlagen: {
		short: m.layer_explain_gruenanlagen_short,
		long: m.layer_explain_gruenanlagen_long
	},
	spielplaetze: {
		short: m.layer_explain_spielplaetze_short,
		long: m.layer_explain_spielplaetze_long
	},
	'nahversorgung-lebensmittel': {
		short: m.layer_explain_nahversorgung_lebensmittel_short,
		long: m.layer_explain_nahversorgung_lebensmittel_long
	},
	'nahversorgung-apotheke': {
		short: m.layer_explain_nahversorgung_apotheke_short,
		long: m.layer_explain_nahversorgung_apotheke_long
	},
	'nahversorgung-post': {
		short: m.layer_explain_nahversorgung_post_short,
		long: m.layer_explain_nahversorgung_post_long
	},
	schwimmbaeder: {
		short: m.layer_explain_schwimmbaeder_short,
		long: m.layer_explain_schwimmbaeder_long
	},
	'kultur-museum': {
		short: m.layer_explain_kultur_museum_short,
		long: m.layer_explain_kultur_museum_long
	},
	'kultur-galerie': {
		short: m.layer_explain_kultur_galerie_short,
		long: m.layer_explain_kultur_galerie_long
	},
	'kultur-kunst-im-raum': {
		short: m.layer_explain_kultur_kunst_im_raum_short,
		long: m.layer_explain_kultur_kunst_im_raum_long
	},
	'kultur-theater': {
		short: m.layer_explain_kultur_theater_short,
		long: m.layer_explain_kultur_theater_long
	},
	'kultur-bibliothek': {
		short: m.layer_explain_kultur_bibliothek_short,
		long: m.layer_explain_kultur_bibliothek_long
	},
	'kultur-kino': {
		short: m.layer_explain_kultur_kino_short,
		long: m.layer_explain_kultur_kino_long
	},
	'kultur-soziokultur': {
		short: m.layer_explain_kultur_soziokultur_short,
		long: m.layer_explain_kultur_soziokultur_long
	},
	'kultur-club': {
		short: m.layer_explain_kultur_club_short,
		long: m.layer_explain_kultur_club_long
	},
	'radverkehrsnetz-2025': {
		short: m.layer_explain_radverkehrsnetz_2025_short,
		long: m.layer_explain_radverkehrsnetz_2025_long
	},
	'fahrradstrassen-2024': {
		short: m.layer_explain_fahrradstrassen_2024_short,
		long: m.layer_explain_fahrradstrassen_2024_long
	},
	'ubahn-stationen': {
		short: m.layer_explain_ubahn_stationen_short,
		long: m.layer_explain_ubahn_stationen_long
	},
	'sbahn-stationen': {
		short: m.layer_explain_sbahn_stationen_short,
		long: m.layer_explain_sbahn_stationen_long
	},
	'tram-haltestellen': {
		short: m.layer_explain_tram_haltestellen_short,
		long: m.layer_explain_tram_haltestellen_long
	},
	'bus-haltestellen': {
		short: m.layer_explain_bus_haltestellen_short,
		long: m.layer_explain_bus_haltestellen_long
	},
	'ubahn-netz': { short: m.layer_explain_ubahn_netz_short, long: m.layer_explain_ubahn_netz_long },
	'tram-netz': { short: m.layer_explain_tram_netz_short, long: m.layer_explain_tram_netz_long },
	'sbahn-netz': { short: m.layer_explain_sbahn_netz_short, long: m.layer_explain_sbahn_netz_long },
	'kiez-score-gesamt': {
		short: m.layer_explain_kiez_score_gesamt_short,
		long: m.layer_explain_kiez_score_gesamt_long,
		scale: m.layer_explain_kiez_score_gesamt_scale
	},
	'kiez-score-ruhe-luft': {
		short: m.layer_explain_kiez_score_ruhe_luft_short,
		long: m.layer_explain_kiez_score_ruhe_luft_long,
		scale: m.layer_explain_kiez_score_ruhe_luft_scale
	},
	'kiez-score-gruen-hitze': {
		short: m.layer_explain_kiez_score_gruen_hitze_short,
		long: m.layer_explain_kiez_score_gruen_hitze_long,
		scale: m.layer_explain_kiez_score_gruen_hitze_scale
	},
	'kiez-score-mobilitaet': {
		short: m.layer_explain_kiez_score_mobilitaet_short,
		long: m.layer_explain_kiez_score_mobilitaet_long,
		scale: m.layer_explain_kiez_score_mobilitaet_scale
	},
	'kiez-score-versorgung': {
		short: m.layer_explain_kiez_score_versorgung_short,
		long: m.layer_explain_kiez_score_versorgung_long,
		scale: m.layer_explain_kiez_score_versorgung_scale
	},
	'kiez-score-wohnschutz': {
		short: m.layer_explain_kiez_score_wohnschutz_short,
		long: m.layer_explain_kiez_score_wohnschutz_long,
		scale: m.layer_explain_kiez_score_wohnschutz_scale
	},
	'kiez-score-kultur': {
		short: m.layer_explain_kiez_score_kultur_short,
		long: m.layer_explain_kiez_score_kultur_long,
		scale: m.layer_explain_kiez_score_kultur_scale
	},
	'kiez-score-kriminalitaet': {
		short: m.layer_explain_kiez_score_kriminalitaet_short,
		long: m.layer_explain_kiez_score_kriminalitaet_long,
		scale: m.layer_explain_kiez_score_kriminalitaet_scale
	},
	'einwohner-dichte-2024': {
		short: m.layer_explain_einwohner_dichte_2024_short,
		long: m.layer_explain_einwohner_dichte_2024_long,
		scale: m.layer_explain_einwohner_dichte_2024_scale,
		unit: m.layer_explain_einwohner_dichte_2024_unit
	},
	'lor-prognoseraum': {
		short: m.layer_explain_lor_prognoseraum_short,
		long: m.layer_explain_lor_prognoseraum_long
	},
	'lor-bezirksregion': {
		short: m.layer_explain_lor_bezirksregion_short,
		long: m.layer_explain_lor_bezirksregion_long
	},
	'lor-planungsraum': {
		short: m.layer_explain_lor_planungsraum_short,
		long: m.layer_explain_lor_planungsraum_long
	},
	'wahlbezirke-btw17': {
		short: m.layer_explain_wahlbezirke_btw17_short,
		long: m.layer_explain_wahlbezirke_btw17_long
	},
	'wahlbezirke-ah16': {
		short: m.layer_explain_wahlbezirke_ah16_short,
		long: m.layer_explain_wahlbezirke_ah16_long
	},
	'wahlbezirke-ah21': {
		short: m.layer_explain_wahlbezirke_ah21_short,
		long: m.layer_explain_wahlbezirke_ah21_long
	},
	'wahlbezirke-ah23': {
		short: m.layer_explain_wahlbezirke_ah23_short,
		long: m.layer_explain_wahlbezirke_ah23_long
	},
	'wahlbezirke-bt25': {
		short: m.layer_explain_wahlbezirke_bt25_short,
		long: m.layer_explain_wahlbezirke_bt25_long
	},
	'wahlbezirke-ah26': {
		short: m.layer_explain_wahlbezirke_ah26_short,
		long: m.layer_explain_wahlbezirke_ah26_long
	},
	'wahlgruppen-btw17': {
		short: m.layer_explain_wahlgruppen_btw17_short,
		long: m.layer_explain_wahlgruppen_btw17_long
	},
	'wahlgruppen-ah16': {
		short: m.layer_explain_wahlgruppen_ah16_short,
		long: m.layer_explain_wahlgruppen_ah16_long
	},
	'wahlgruppen-ah21': {
		short: m.layer_explain_wahlgruppen_ah21_short,
		long: m.layer_explain_wahlgruppen_ah21_long
	},
	'wahlgruppen-bt25': {
		short: m.layer_explain_wahlgruppen_bt25_short,
		long: m.layer_explain_wahlgruppen_bt25_long
	},
	'wahlgruppen-ah26': {
		short: m.layer_explain_wahlgruppen_ah26_short,
		long: m.layer_explain_wahlgruppen_ah26_long
	}
};

/**
 * Locale-fähiger Layer-Explain-Resolver. Ohne `opts.locale`: DE (Boundary
 * Spec i18n C1). Fehlt ein Slug im Message-Mapping (z.B. neu angelegter Layer
 * vor dem nächsten i18n-Pass), fällt der Resolver auf `LAYER_EXPLAIN_DE`
 * zurück -- liefert dann fuer JEDE Locale den DE-Text (besser als leer).
 */
export function getLayerExplain(
	slug: string,
	kind: LayerExplainKind,
	opts?: LocaleOptions
): string {
	const msg = LAYER_EXPLAIN_MESSAGE[slug];
	if (!msg) return LAYER_EXPLAIN_DE[slug]?.[kind] ?? '';
	return msg[kind](undefined, toAtlasMessageOptions(opts));
}

export function getLayerExplainEntry(slug: string, opts?: LocaleOptions): LayerExplain {
	const msg = LAYER_EXPLAIN_MESSAGE[slug];
	if (!msg) return LAYER_EXPLAIN_DE[slug] ?? EMPTY_EXPLAIN;
	const options = toAtlasMessageOptions(opts);
	return {
		short: msg.short(undefined, options),
		long: msg.long(undefined, options),
		unit: msg.unit ? msg.unit(undefined, options) : undefined,
		valueScaleExplain: msg.scale ? msg.scale(undefined, options) : undefined
	};
}

export function explainLayer(slug: string, opts?: LocaleOptions): string {
	return getLayerExplain(slug, 'short', opts);
}

export interface LayerExternalLink {
	readonly href: string;
	readonly label: string;
}

const LAYER_EXTERNAL_LINK: Partial<Record<string, { href: string; label: MessageFn }>> = {
	'wohnlagen-2024': {
		href: 'https://mietspiegel.berlin.de/',
		label: m.layer_explain_wohnlagen_2024_external_link_label
	}
};

export function getLayerExternalLink(slug: string, opts?: LocaleOptions): LayerExternalLink | null {
	const entry = LAYER_EXTERNAL_LINK[slug];
	if (!entry) return null;
	return { href: entry.href, label: entry.label(undefined, toAtlasMessageOptions(opts)) };
}
