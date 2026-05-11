import type { SourceConfig } from './types.js';

// TODO Story 1.3 live-verify: FIS-Broker typeName-Slugs gegen aktuellen Katalog abgleichen.
// Stand Mai 2026 sind diese Werte aus Story-Spec uebernommen, brauchen Verifikation per WFS GetCapabilities-Request.
const FIS_BASE = 'https://fbinter.stadt-berlin.de/fb/wfs/data/senstadt';

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
		simplifyProfile: 'boundary'
	},
	{
		slug: 'ortsteile',
		kind: 'odis',
		sourceUrl: 'https://daten.odis-berlin.de/de/dataset/ortsteile/data.geojson',
		license: 'dl-de/zero-2-0',
		bundleGroup: 'A: Boundaries',
		zoomThresholds: { min: 10, max: 14 },
		simplifyProfile: 'boundary'
	},
	{
		slug: 'plz',
		kind: 'odis',
		sourceUrl: 'https://daten.odis-berlin.de/de/dataset/plz/data.geojson',
		license: 'dl-de/zero-2-0',
		bundleGroup: 'A: Boundaries',
		zoomThresholds: { min: 9, max: 14 },
		simplifyProfile: 'boundary'
	},
	{
		slug: 'lor-prognoseraum',
		kind: 'odis',
		sourceUrl: 'https://daten.odis-berlin.de/de/dataset/lor_prognoseraeume_2021/data.geojson',
		license: 'dl-de/zero-2-0',
		bundleGroup: 'A: Boundaries',
		zoomThresholds: { min: 9, max: 13 },
		simplifyProfile: 'boundary'
	},
	{
		slug: 'lor-bezirksregion',
		kind: 'odis',
		sourceUrl: 'https://daten.odis-berlin.de/de/dataset/lor_bezirksregionen_2021/data.geojson',
		license: 'dl-de/zero-2-0',
		bundleGroup: 'A: Boundaries',
		zoomThresholds: { min: 10, max: 14 },
		simplifyProfile: 'boundary'
	},
	{
		slug: 'lor-planungsraum',
		kind: 'odis',
		sourceUrl: 'https://daten.odis-berlin.de/de/dataset/lor_planungsgraeume_2021/data.geojson',
		license: 'dl-de/zero-2-0',
		bundleGroup: 'A: Boundaries',
		zoomThresholds: { min: 11, max: 15 },
		simplifyProfile: 'boundary'
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
		simplifyProfile: 'polygon'
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
	// Bundle C: Umwelt (GDI Berlin WFS + OSM saisonal).
	// Story-Spec hatte laerm-den + laerm-night als separate Layer. Realitaet: ein Strassenlaerm-Layer mit L_DEN + L_N als Properties.
	// Konsolidiert zu strassenlaerm-2022 (Strassen + oberirdische U-Bahn).
	{
		slug: 'strassenlaerm-2022',
		kind: 'fis-broker',
		sourceUrl: 'https://gdi.berlin.de/services/wfs/ua_stratlaerm_2022',
		typeName: 'ua_stratlaerm_2022:de_strassen_oberirdischeubahn2022',
		license: 'dl-de/by-2-0',
		bundleGroup: 'C: Umwelt',
		zoomThresholds: { min: 11, max: 18 },
		simplifyProfile: 'polygon'
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
	// Bundle D: Memorial (OSM)
	{
		slug: 'stolpersteine',
		kind: 'overpass',
		sourceUrl: 'https://overpass-api.de/api/interpreter',
		overpassQL: `[out:json][timeout:60];(nwr["memorial"="stolperstein"](${BERLIN_BBOX_OVERPASS}););out center;`,
		license: 'ODbL 1.0',
		bundleGroup: 'D: Memorial',
		zoomThresholds: { min: 14, max: 18 },
		simplifyProfile: 'point'
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
