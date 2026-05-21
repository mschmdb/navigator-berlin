import type { SourceConfig } from './types.js';

const BERLIN_BBOX_OVERPASS = '52.3382,13.0883,52.6755,13.7611';

export const SOURCES: SourceConfig[] = [
	// Bundle A: Boundaries (ODIS, dl-de/zero-2-0). URL-Pattern: /dataset/{slug}/data.geojson (Live-verified 2026-05-11)
	{
		slug: 'bezirke',
		kind: 'odis',
		sourceUrl: 'https://daten.odis-berlin.de/de/dataset/bezirksgrenzen/data.geojson',
		license: 'dl-de/zero-2-0',
		bundleGroup: 'A: Boundaries',
		zoomThresholds: { min: 8, max: 12 },
		simplifyProfile: 'boundary',
		sourceUpdatedAt: '2024-01-01T00:00:00.000Z'
	},
	{
		slug: 'ortsteile',
		kind: 'odis',
		sourceUrl: 'https://daten.odis-berlin.de/de/dataset/ortsteile/data.geojson',
		license: 'dl-de/zero-2-0',
		bundleGroup: 'A: Boundaries',
		zoomThresholds: { min: 10, max: 14 },
		simplifyProfile: 'boundary',
		sourceUpdatedAt: '2024-01-01T00:00:00.000Z'
	},
	{
		slug: 'plz',
		kind: 'odis',
		sourceUrl: 'https://daten.odis-berlin.de/de/dataset/plz/data.geojson',
		license: 'dl-de/zero-2-0',
		bundleGroup: 'A: Boundaries',
		zoomThresholds: { min: 9, max: 14 },
		simplifyProfile: 'boundary',
		sourceUpdatedAt: '2024-01-01T00:00:00.000Z'
	},
	// Story 2.0: LOR-Bezirksregion (138 BZR) re-introduced als Kiez-Grain für die
	// Aggregat-Schicht (bezirk_stats/kiez_stats in Postgres) und für Story 2.4
	// (Kiez-Pages prerendered). In Story 1.10 entfernt; bestehender Code in
	// get-kiez-profile.ts + layer-explain.ts + value-formatters.ts blieb damals
	// stehen und wird jetzt wieder valide. mapRelevant/inspectorRelevant erstmal
	// false (Story 2.4 kann später aktivieren falls Picker gewünscht).
	{
		slug: 'lor-bezirksregion',
		kind: 'odis',
		sourceUrl: 'https://daten.odis-berlin.de/de/dataset/lor_bezirksregionen_2021/data.geojson',
		license: 'dl-de/zero-2-0',
		bundleGroup: 'A: Boundaries',
		zoomThresholds: { min: 12, max: 13 },
		simplifyProfile: 'boundary',
		sourceUpdatedAt: '2021-01-01T00:00:00.000Z',
		inspectorRelevant: false,
		mapRelevant: false
	},
	// Story 1.28: LOR-Planungsraum re-introduced als Build-Only-Datensatz für den
	// Kiez-Score (Pro-LOR-Score-Berechnung am Polygon-Centroid). Nicht in der
	// LayerPalette / nicht als Karten-Layer (mapRelevant: false) und nicht im
	// Inspector (inspectorRelevant: false). Vorher in Story 1.10 entfernt.
	{
		slug: 'lor-planungsraum',
		kind: 'odis',
		sourceUrl: 'https://daten.odis-berlin.de/de/dataset/lor_planungsgraeume_2021/data.geojson',
		license: 'dl-de/zero-2-0',
		bundleGroup: 'A: Boundaries',
		zoomThresholds: { min: 11, max: 15 },
		simplifyProfile: 'boundary',
		sourceUpdatedAt: '2021-01-01T00:00:00.000Z',
		inspectorRelevant: false,
		mapRelevant: false
	},
	// Bundle B: Wohn-Daten (GDI Berlin WFS, dl-de/by-2-0). Endpoints + typeNames live-verifiziert 2026-05-11
	// TODO: mietspiegel-wohnlage (~600k Adress-Polygone, 116MB simplified). Vertex-Simplify hilft nicht
	// (Polygone bereits klein). Defer bis Tile-Strategy (PMTiles/MVT) oder Dissolve-by-wohnlage.
	// {
	// 	slug: 'mietspiegel-wohnlage',
	// 	kind: 'fis-broker',
	// 	sourceUrl: 'https://gdi.berlin.de/services/wfs/wohnlagenadr2024',
	// 	typeName: 'wohnlagenadr2024:wohnlagenadr2024',
	// 	license: 'dl-de/by-2-0',
	// 	bundleGroup: 'B: Wohn-Daten',
	// 	zoomThresholds: { min: 12, max: 18 },
	// 	simplifyProfile: 'polygon'
	// },
	{
		slug: 'bodenrichtwerte',
		kind: 'fis-broker',
		sourceUrl: 'https://gdi.berlin.de/services/wfs/brw2026',
		typeName: 'brw2026:brw2026_vector',
		license: 'dl-de/by-2-0',
		bundleGroup: 'B: Wohn-Daten',
		zoomThresholds: { min: 12, max: 18 },
		simplifyProfile: 'polygon',
		sourceUpdatedAt: '2026-01-01T00:00:00.000Z'
	},
	// TODO: alkis_gebaeude (~600k Polygone, ~100MB+) braucht Tile-basiertes Streaming oder bbox-Subset.
	// Deferred zu Story 1.6+ (Map-Display) wenn entschieden ist wie wir mit grossen Layern umgehen.
	// {
	// 	slug: 'gebaeudealter',
	// 	kind: 'fis-broker',
	// 	sourceUrl: 'https://gdi.berlin.de/services/wfs/alkis_gebaeude',
	// 	typeName: 'alkis_gebaeude:gebaeude',
	// 	license: 'dl-de/by-2-0',
	// 	bundleGroup: 'B: Wohn-Daten',
	// 	zoomThresholds: { min: 14, max: 18 },
	// 	simplifyProfile: 'polygon'
	// },
	// Bundle C: Umwelt (Umweltatlas WFS + OSM saisonal).
	// Umweltgerechtigkeit 2023/2024: 542 LOR-Planungsraum-Polygone, ordinal-3-Stufen (gering/mittel/hoch).
	// Ersetzt urspruengliche strassenlaerm-2022-Quelle (Schienenverkehrs-LineStrings) durch flaechige Laermbelastung.
	{
		slug: 'laerm-2023',
		kind: 'fis-broker',
		sourceUrl: 'https://gdi.berlin.de/services/wfs/ua_umweltgerechtigkeit2023',
		typeName: 'ua_umweltgerechtigkeit2023:a_laerm2023',
		license: 'dl-de/zero-2-0',
		bundleGroup: 'C: Umwelt',
		zoomThresholds: { min: 9, max: 18 },
		simplifyProfile: 'polygon',
		sourceUpdatedAt: '2024-01-01T00:00:00.000Z'
	},
	{
		slug: 'luft-2023',
		kind: 'fis-broker',
		sourceUrl: 'https://gdi.berlin.de/services/wfs/ua_umweltgerechtigkeit2023',
		typeName: 'ua_umweltgerechtigkeit2023:b_luft2023',
		license: 'dl-de/zero-2-0',
		bundleGroup: 'C: Umwelt',
		zoomThresholds: { min: 9, max: 18 },
		simplifyProfile: 'polygon',
		sourceUpdatedAt: '2024-01-01T00:00:00.000Z'
	},
	{
		slug: 'gruenversorgung-2023',
		kind: 'fis-broker',
		sourceUrl: 'https://gdi.berlin.de/services/wfs/ua_umweltgerechtigkeit2023',
		typeName: 'ua_umweltgerechtigkeit2023:c_gruen2023',
		license: 'dl-de/zero-2-0',
		bundleGroup: 'C: Umwelt',
		zoomThresholds: { min: 9, max: 18 },
		simplifyProfile: 'polygon',
		sourceUpdatedAt: '2024-01-01T00:00:00.000Z'
	},
	{
		slug: 'bioklima-2023',
		kind: 'fis-broker',
		sourceUrl: 'https://gdi.berlin.de/services/wfs/ua_umweltgerechtigkeit2023',
		typeName: 'ua_umweltgerechtigkeit2023:d_bioklima2023',
		license: 'dl-de/zero-2-0',
		bundleGroup: 'C: Umwelt',
		zoomThresholds: { min: 9, max: 18 },
		simplifyProfile: 'polygon',
		sourceUpdatedAt: '2024-01-01T00:00:00.000Z'
	},
	{
		slug: 'umweltgerechtigkeit-2023',
		kind: 'fis-broker',
		sourceUrl: 'https://gdi.berlin.de/services/wfs/ua_umweltgerechtigkeit2023',
		typeName: 'ua_umweltgerechtigkeit2023:z_gesamt_umwelt2023',
		license: 'dl-de/zero-2-0',
		bundleGroup: 'C: Umwelt',
		zoomThresholds: { min: 9, max: 18 },
		simplifyProfile: 'polygon',
		sourceUpdatedAt: '2024-01-01T00:00:00.000Z'
	},
	// TODO: solarpotenzial (~600k Gebaeude-Photovoltaik-Polygone, >512MB raw, Node string-limit gesprengt).
	// Defer bis Tile-Strategy ODER bbox-Pagination im WFS-Request.
	// {
	// 	slug: 'solarpotenzial',
	// 	kind: 'fis-broker',
	// 	sourceUrl: 'https://gdi.berlin.de/services/wfs/ua_solarpotenzial_solarrechner',
	// 	typeName: 'ua_solarpotenzial_solarrechner:d_photovoltaik_potenzial',
	// 	license: 'dl-de/by-2-0',
	// 	bundleGroup: 'C: Umwelt',
	// 	zoomThresholds: { min: 13, max: 18 },
	// 	simplifyProfile: 'polygon'
	// },
	// TODO: klimaanalyse (29MB simplified). Polygone hochaufgelöst (10x10m raster). Defer bis Tile-Strategy
	// oder gröberer Klimabewertung-Layer (z.B. Block-basiert statt Raster).
	// {
	// 	slug: 'klimaanalyse',
	// 	kind: 'fis-broker',
	// 	sourceUrl: 'https://gdi.berlin.de/services/wfs/ua_klimabewertung_2015',
	// 	typeName: 'ua_klimabewertung_2015:ca_besondere_stadtklimat_missstaende',
	// 	license: 'dl-de/by-2-0',
	// 	bundleGroup: 'C: Umwelt',
	// 	zoomThresholds: { min: 10, max: 18 },
	// 	simplifyProfile: 'polygon'
	// },
	{
		slug: 'trinkbrunnen',
		kind: 'overpass',
		sourceUrl: 'https://overpass-api.de/api/interpreter',
		overpassQL: `[out:json][timeout:60];(nwr["amenity"="drinking_water"](${BERLIN_BBOX_OVERPASS}););out center;`,
		license: 'ODbL 1.0',
		bundleGroup: 'C: Umwelt',
		zoomThresholds: { min: 14, max: 18 },
		seasonality: { from: '05-01', to: '10-31' },
		simplifyProfile: 'point'
	},
	// Bundle D: Memorial (OSM). ADR-015 (Story 9.6): Erinnerungs-Orte raus aus dem
	// Frontend. Layer bleibt build-only als Heritage-Dichte-Signal für bezirk_stats/
	// kiez_stats, NICHT mapRelevant/inspectorRelevant (analog denkmal-2024).
	{
		slug: 'stolpersteine',
		kind: 'overpass',
		sourceUrl: 'https://overpass-api.de/api/interpreter',
		overpassQL: `[out:json][timeout:60];(nwr["memorial"="stolperstein"](${BERLIN_BBOX_OVERPASS}););out center;`,
		license: 'ODbL 1.0',
		bundleGroup: 'D: Memorial',
		zoomThresholds: { min: 14, max: 18 },
		simplifyProfile: 'point',
		inspectorRelevant: false,
		mapRelevant: false
	},
	// Story 2.0: Baudenkmale Berlin (Heritage-Cluster für bezirk_stats/kiez_stats).
	// FIS-Broker WFS 2.0, ~9553 MultiPolygon-Features (Stand 2024). Wir nutzen den
	// Layer build-only als Heritage-Dichte-Signal (Count-per-Area); nicht mapRelevant
	// und nicht inspectorRelevant, weil 9553 Polygone Layer-Toggle-Palette + Inspector
	// nicht skalieren würden. Für Map-Display in Folge-Story ggf. tiles-Profil.
	{
		slug: 'denkmal-2024',
		kind: 'fis-broker',
		sourceUrl: 'https://gdi.berlin.de/services/wfs/denkmale',
		typeName: 'denkmale:denkmale',
		license: 'dl-de/by-2-0',
		bundleGroup: 'D: Memorial',
		zoomThresholds: { min: 14, max: 18 },
		simplifyProfile: 'polygon',
		sourceUpdatedAt: '2024-01-01T00:00:00.000Z',
		inspectorRelevant: false,
		mapRelevant: false
	},
	// Bundle C erweitert: Klima-Analyse 2022 (3 ausgewählte Sub-Layer aus 45 typeNames)
	{
		slug: 'klima-pet-2022',
		kind: 'fis-broker',
		sourceUrl: 'https://gdi.berlin.de/services/wfs/ua_klimaanalyse_2022',
		typeName: 'ua_klimaanalyse_2022:pa_ua_pet_siedlg_2022',
		license: 'dl-de/zero-2-0',
		bundleGroup: 'C: Umwelt',
		zoomThresholds: { min: 11, max: 18 },
		simplifyProfile: 'polygon',
		sourceUpdatedAt: '2024-06-01T00:00:00.000Z',
		// Story 1.25: Berliner Senat publiziert PET nur auf Siedlungs-Polygonen
		// (Wohnblock-Geometrie). Adress-Geocoding landet oft im Hof/Straßenraum
		// und schlägt Punkt-in-Polygon fehl. PET ist räumlich glatt, daher
		// nächstes Polygon im 50m-Radius als Hit akzeptieren.
		nearestPolygonFallbackKm: 0.05
	},
	{
		slug: 'klima-kaltlufteinwirkbereich-2022',
		kind: 'fis-broker',
		sourceUrl: 'https://gdi.berlin.de/services/wfs/ua_klimaanalyse_2022',
		typeName: 'ua_klimaanalyse_2022:td_kak_kaltlufteinwirkbereich_siedlungsfl_2022',
		license: 'dl-de/zero-2-0',
		bundleGroup: 'C: Umwelt',
		zoomThresholds: { min: 11, max: 18 },
		simplifyProfile: 'polygon',
		sourceUpdatedAt: '2024-06-01T00:00:00.000Z',
		inspectorRelevant: false
	},
	{
		slug: 'klima-leitbahnkorridor-2022',
		kind: 'fis-broker',
		sourceUrl: 'https://gdi.berlin.de/services/wfs/ua_klimaanalyse_2022',
		typeName: 'ua_klimaanalyse_2022:tk_kak_leitbahnkorridor_2022',
		license: 'dl-de/zero-2-0',
		bundleGroup: 'C: Umwelt',
		zoomThresholds: { min: 10, max: 18 },
		simplifyProfile: 'polygon',
		sourceUpdatedAt: '2024-06-01T00:00:00.000Z',
		inspectorRelevant: false
	},
	// Bundle B erweitert: Mietspiegel-Wohnlagen 2024 + Milieuschutz
	// Mietspiegel-Wohnlage 2024 als LOR-Planungsraum-Choropleth-Aggregat (Mode-Klasse pro Polygon).
	// Pipeline: Standard-Fetch liefert 401k Adress-Points; one-off-Aggregator-Script joint auf
	// LOR-Geometrie und schreibt 542-Polygon-GeoJSON. Story 1.10c PMTiles-Path archiviert
	// (siehe Completion Notes), Adress-Genauigkeit gegen Flächen-Choropleth getauscht.
	{
		slug: 'wohnlagen-2024',
		kind: 'fis-broker',
		sourceUrl: 'https://gdi.berlin.de/services/wfs/wohnlagenadr2024',
		typeName: 'wohnlagenadr2024:wohnlagenadr2024',
		license: 'dl-de/by-2-0',
		bundleGroup: 'B: Wohn-Daten',
		zoomThresholds: { min: 9, max: 18 },
		simplifyProfile: 'polygon',
		sourceUpdatedAt: '2024-06-10T00:00:00.000Z'
	},
	{
		slug: 'milieuschutz-erhaltungsmiete',
		kind: 'fis-broker',
		sourceUrl: 'https://gdi.berlin.de/services/wfs/erhaltungsverordnungsgebiete',
		typeName: 'erhaltungsverordnungsgebiete:erhaltgeb_em',
		license: 'dl-de/zero-2-0',
		bundleGroup: 'B: Wohn-Daten',
		zoomThresholds: { min: 10, max: 18 },
		simplifyProfile: 'polygon',
		sourceUpdatedAt: '2025-01-01T00:00:00.000Z'
	},
	{
		slug: 'milieuschutz-staedtebau',
		kind: 'fis-broker',
		sourceUrl: 'https://gdi.berlin.de/services/wfs/erhaltungsverordnungsgebiete',
		typeName: 'erhaltungsverordnungsgebiete:erhaltgeb_es',
		license: 'dl-de/zero-2-0',
		bundleGroup: 'B: Wohn-Daten',
		zoomThresholds: { min: 10, max: 18 },
		simplifyProfile: 'polygon',
		sourceUpdatedAt: '2025-01-01T00:00:00.000Z'
	},
	// Story 1.30: Monitoring Soziale Stadtentwicklung (MSS) 2025 Gesamtindex pro LOR-Planungsraum.
	// Status × Dynamik = 12-Gruppen-Matrix. Adress-Hit liefert Aggregat-Stufe, KEINE Einzel-Indikatoren.
	// `kom`-Feld != 'gültig' (Ausreißer / EW <300) wird in Inspector als out-of-concept gerendert.
	{
		slug: 'mss-gesamtindex-2025',
		kind: 'fis-broker',
		sourceUrl: 'https://gdi.berlin.de/services/wfs/mss_2025',
		typeName: 'mss_2025:mss2025_indizes_542',
		license: 'dl-de/zero-2-0',
		bundleGroup: 'B: Wohn-Daten',
		zoomThresholds: { min: 9, max: 18 },
		simplifyProfile: 'polygon',
		sourceUpdatedAt: '2024-12-01T00:00:00.000Z'
	},
	// Bundle E: Soziale Infrastruktur
	{
		slug: 'kitas-2024',
		kind: 'fis-broker',
		sourceUrl: 'https://gdi.berlin.de/services/wfs/kita',
		typeName: 'kita:kita',
		license: 'dl-de/zero-2-0',
		bundleGroup: 'E: Soziale Infrastruktur',
		zoomThresholds: { min: 13, max: 18 },
		simplifyProfile: 'point',
		sourceUpdatedAt: '2024-12-31T00:00:00.000Z'
	},
	{
		slug: 'schulen-2024',
		kind: 'fis-broker',
		sourceUrl: 'https://gdi.berlin.de/services/wfs/schulen',
		typeName: 'schulen:schulen',
		license: 'dl-de/zero-2-0',
		bundleGroup: 'E: Soziale Infrastruktur',
		zoomThresholds: { min: 12, max: 18 },
		simplifyProfile: 'point',
		sourceUpdatedAt: '2025-01-01T00:00:00.000Z'
	},
	{
		slug: 'einschulbereiche-2024',
		kind: 'fis-broker',
		sourceUrl: 'https://gdi.berlin.de/services/wfs/schulen',
		typeName: 'schulen:schulen_esb',
		license: 'dl-de/zero-2-0',
		bundleGroup: 'E: Soziale Infrastruktur',
		zoomThresholds: { min: 11, max: 18 },
		simplifyProfile: 'polygon',
		sourceUpdatedAt: '2025-01-01T00:00:00.000Z'
	},
	{
		slug: 'krankenhaeuser-plan',
		kind: 'fis-broker',
		sourceUrl: 'https://gdi.berlin.de/services/wfs/krankenhaeuser',
		typeName: 'krankenhaeuser:plankrankenhaeuser',
		license: 'dl-de/zero-2-0',
		bundleGroup: 'E: Soziale Infrastruktur',
		zoomThresholds: { min: 11, max: 18 },
		simplifyProfile: 'point',
		sourceUpdatedAt: '2023-03-30T00:00:00.000Z'
	},
	{
		slug: 'krankenhaeuser-weitere',
		kind: 'fis-broker',
		sourceUrl: 'https://gdi.berlin.de/services/wfs/krankenhaeuser',
		typeName: 'krankenhaeuser:weitere_krankenhaeuser',
		license: 'dl-de/zero-2-0',
		bundleGroup: 'E: Soziale Infrastruktur',
		zoomThresholds: { min: 11, max: 18 },
		simplifyProfile: 'point',
		sourceUpdatedAt: '2023-03-30T00:00:00.000Z'
	},
	{
		slug: 'sportanlagen-2024',
		kind: 'fis-broker',
		sourceUrl: 'https://gdi.berlin.de/services/wfs/sportstandorte',
		typeName: 'sportstandorte:sportstandorte',
		license: 'dl-de/zero-2-0',
		bundleGroup: 'E: Soziale Infrastruktur',
		zoomThresholds: { min: 12, max: 18 },
		simplifyProfile: 'point',
		sourceUpdatedAt: '2025-07-30T00:00:00.000Z'
	},
	{
		slug: 'gruenanlagen',
		kind: 'fis-broker',
		sourceUrl: 'https://gdi.berlin.de/services/wfs/gruenanlagen',
		typeName: 'gruenanlagen:gruenanlagen',
		license: 'dl-de/zero-2-0',
		bundleGroup: 'C: Umwelt',
		zoomThresholds: { min: 11, max: 18 },
		simplifyProfile: 'polygon',
		sourceUpdatedAt: '2026-04-09T00:00:00.000Z',
		inspectorRelevant: false
	},
	{
		slug: 'spielplaetze',
		kind: 'fis-broker',
		sourceUrl: 'https://gdi.berlin.de/services/wfs/gruenanlagen',
		typeName: 'gruenanlagen:spielplaetze',
		license: 'dl-de/zero-2-0',
		bundleGroup: 'E: Soziale Infrastruktur',
		zoomThresholds: { min: 13, max: 18 },
		simplifyProfile: 'polygon',
		sourceUpdatedAt: '2026-04-09T00:00:00.000Z',
		inspectorRelevant: false
	},
	{
		slug: 'schwimmbaeder',
		kind: 'fis-broker',
		sourceUrl: 'https://gdi.berlin.de/services/wfs/schwimmbaeder_berlin',
		typeName: 'schwimmbaeder_berlin:schwimmbaeder',
		license: 'dl-de/zero-2-0',
		bundleGroup: 'E: Soziale Infrastruktur',
		zoomThresholds: { min: 11, max: 18 },
		simplifyProfile: 'point',
		sourceUpdatedAt: '2026-04-21T00:00:00.000Z'
	},
	// Bundle F: Mobilität — alle Map-Only, kein Inspector-Hit-Konzept.
	// Adresse ist nie "auf" einer Trasse oder einem Stop. „Nächste Haltestelle"-Berechnung Phase 2.
	{
		slug: 'radverkehrsnetz-2025',
		kind: 'fis-broker',
		sourceUrl: 'https://gdi.berlin.de/services/wfs/radverkehrsnetz',
		typeName: 'radverkehrsnetz:radverkehrsnetz',
		license: 'dl-de/zero-2-0',
		bundleGroup: 'F: Mobilität',
		zoomThresholds: { min: 12, max: 18 },
		simplifyProfile: 'polygon',
		sourceUpdatedAt: '2025-07-07T00:00:00.000Z',
		inspectorRelevant: false
	},
	{
		slug: 'fahrradstrassen-2024',
		kind: 'fis-broker',
		sourceUrl: 'https://gdi.berlin.de/services/wfs/fahrradstrassen',
		typeName: 'fahrradstrassen:fahrradstrassen',
		license: 'dl-de/zero-2-0',
		bundleGroup: 'F: Mobilität',
		zoomThresholds: { min: 12, max: 18 },
		simplifyProfile: 'polygon',
		sourceUpdatedAt: '2024-06-07T00:00:00.000Z',
		inspectorRelevant: false
	},
	{
		slug: 'ubahn-stationen',
		kind: 'overpass',
		sourceUrl: 'https://overpass-api.de/api/interpreter',
		overpassQL: `[out:json][timeout:60];(node["railway"="station"]["station"="subway"](${BERLIN_BBOX_OVERPASS}););out center;`,
		license: 'ODbL 1.0',
		bundleGroup: 'F: Mobilität',
		zoomThresholds: { min: 11, max: 18 },
		simplifyProfile: 'point',
		inspectorRelevant: false
	},
	{
		slug: 'sbahn-stationen',
		kind: 'overpass',
		sourceUrl: 'https://overpass-api.de/api/interpreter',
		overpassQL: `[out:json][timeout:60];(node["railway"="station"]["station"="light_rail"](${BERLIN_BBOX_OVERPASS}););out center;`,
		license: 'ODbL 1.0',
		bundleGroup: 'F: Mobilität',
		zoomThresholds: { min: 10, max: 18 },
		simplifyProfile: 'point',
		inspectorRelevant: false
	},
	{
		slug: 'tram-haltestellen',
		kind: 'overpass',
		sourceUrl: 'https://overpass-api.de/api/interpreter',
		overpassQL: `[out:json][timeout:60];(node["railway"="tram_stop"](${BERLIN_BBOX_OVERPASS}););out center;`,
		license: 'ODbL 1.0',
		bundleGroup: 'F: Mobilität',
		zoomThresholds: { min: 13, max: 18 },
		simplifyProfile: 'point',
		inspectorRelevant: false
	},
	{
		slug: 'bus-haltestellen',
		kind: 'overpass',
		sourceUrl: 'https://overpass-api.de/api/interpreter',
		overpassQL: `[out:json][timeout:90];(node["highway"="bus_stop"](${BERLIN_BBOX_OVERPASS}););out center;`,
		license: 'ODbL 1.0',
		bundleGroup: 'F: Mobilität',
		zoomThresholds: { min: 14, max: 18 },
		simplifyProfile: 'point',
		inspectorRelevant: false
	},
	{
		slug: 'ubahn-netz',
		kind: 'overpass',
		sourceUrl: 'https://overpass-api.de/api/interpreter',
		overpassQL: `[out:json][timeout:90];(way["railway"="subway"](${BERLIN_BBOX_OVERPASS}););out geom;`,
		license: 'ODbL 1.0',
		bundleGroup: 'F: Mobilität',
		zoomThresholds: { min: 10, max: 18 },
		simplifyProfile: 'polygon',
		inspectorRelevant: false
	},
	{
		slug: 'tram-netz',
		kind: 'overpass',
		sourceUrl: 'https://overpass-api.de/api/interpreter',
		overpassQL: `[out:json][timeout:90];(way["railway"="tram"](${BERLIN_BBOX_OVERPASS}););out geom;`,
		license: 'ODbL 1.0',
		bundleGroup: 'F: Mobilität',
		zoomThresholds: { min: 12, max: 18 },
		simplifyProfile: 'polygon',
		inspectorRelevant: false
	},
	{
		slug: 'sbahn-netz',
		kind: 'overpass',
		sourceUrl: 'https://overpass-api.de/api/interpreter',
		// S-Bahn-Berlin nutzt railway=rail (NICHT light_rail für Geometrie). Differenzierung via
		// route=light_rail-Relations + operator~"S-Bahn Berlin" (OSM-Tagging-Realität: network=VBB,
		// operator="S-Bahn Berlin GmbH"). `way(r)` extrahiert Member-Ways der gematchten Relationen;
		// `out geom` liefert vollständige LineString-Geometrie.
		overpassQL: `[out:json][timeout:180];relation["route"="light_rail"]["operator"~"S-Bahn Berlin"](${BERLIN_BBOX_OVERPASS});way(r);out geom;`,
		license: 'ODbL 1.0',
		bundleGroup: 'F: Mobilität',
		zoomThresholds: { min: 10, max: 18 },
		simplifyProfile: 'polygon',
		inspectorRelevant: false
	}
];

export const DWD_STATIONS = [
	{
		id: '00403',
		slug: 'dahlem',
		name: 'Berlin-Dahlem',
		coordinates: [13.301, 52.4517] as [number, number],
		elevation: 51,
		firstYear: 1719
	},
	{
		id: '00400',
		slug: 'buch',
		name: 'Berlin-Buch',
		coordinates: [13.5, 52.633] as [number, number],
		elevation: 60,
		firstYear: 1889
	},
	{
		id: '00433',
		slug: 'tempelhof',
		name: 'Berlin-Tempelhof',
		coordinates: [13.4015, 52.4675] as [number, number],
		elevation: 48,
		firstYear: 1919
	},
	{
		id: '00427',
		slug: 'brandenburg',
		name: 'Brandenburg-Schoenefeld',
		coordinates: [13.5306, 52.3807] as [number, number],
		elevation: 46,
		firstYear: 1957
	}
] as const;
