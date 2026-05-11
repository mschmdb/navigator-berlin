import type { SourceConfig } from './types.js';

// TODO Story 1.3 live-verify: FIS-Broker typeName-Slugs gegen aktuellen Katalog abgleichen.
// Stand Mai 2026 sind diese Werte aus Story-Spec uebernommen, brauchen Verifikation per WFS GetCapabilities-Request.
const FIS_BASE = 'https://fbinter.stadt-berlin.de/fb/wfs/data/senstadt';

const BERLIN_BBOX_OVERPASS = '52.3382,13.0883,52.6755,13.7611';

export const SOURCES: SourceConfig[] = [
	// Bundle A: Boundaries (ODIS, dl-de/zero-2-0)
	{
		slug: 'bezirke',
		kind: 'odis',
		sourceUrl: 'https://daten.odis-berlin.de/de/dataset/bezirksgrenzen',
		license: 'dl-de/zero-2-0',
		bundleGroup: 'A: Boundaries',
		zoomThresholds: { min: 8, max: 12 },
		simplifyProfile: 'boundary'
	},
	{
		slug: 'ortsteile',
		kind: 'odis',
		sourceUrl: 'https://daten.odis-berlin.de/de/dataset/ortsteile',
		license: 'dl-de/zero-2-0',
		bundleGroup: 'A: Boundaries',
		zoomThresholds: { min: 10, max: 14 },
		simplifyProfile: 'boundary'
	},
	{
		slug: 'plz',
		kind: 'odis',
		sourceUrl: 'https://daten.odis-berlin.de/de/dataset/plz',
		license: 'dl-de/zero-2-0',
		bundleGroup: 'A: Boundaries',
		zoomThresholds: { min: 9, max: 14 },
		simplifyProfile: 'boundary'
	},
	{
		slug: 'lor-prognoseraum',
		kind: 'odis',
		sourceUrl: 'https://daten.odis-berlin.de/de/dataset/lor-prognoseraum-2021',
		license: 'dl-de/zero-2-0',
		bundleGroup: 'A: Boundaries',
		zoomThresholds: { min: 9, max: 13 },
		simplifyProfile: 'boundary'
	},
	{
		slug: 'lor-bezirksregion',
		kind: 'odis',
		sourceUrl: 'https://daten.odis-berlin.de/de/dataset/lor-bezirksregion-2021',
		license: 'dl-de/zero-2-0',
		bundleGroup: 'A: Boundaries',
		zoomThresholds: { min: 10, max: 14 },
		simplifyProfile: 'boundary'
	},
	{
		slug: 'lor-planungsraum',
		kind: 'odis',
		sourceUrl: 'https://daten.odis-berlin.de/de/dataset/lor-planungsraum-2021',
		license: 'dl-de/zero-2-0',
		bundleGroup: 'A: Boundaries',
		zoomThresholds: { min: 11, max: 15 },
		simplifyProfile: 'boundary'
	},
	// Bundle B: Wohn-Daten (FIS-Broker, dl-de/by-2-0)
	{
		slug: 'mietspiegel-wohnlage',
		kind: 'fis-broker',
		sourceUrl: `${FIS_BASE}/s_wohnlagen2024`,
		typeName: 'fis:s_wohnlagen2024',
		license: 'dl-de/by-2-0',
		bundleGroup: 'B: Wohn-Daten',
		zoomThresholds: { min: 12, max: 18 },
		simplifyProfile: 'polygon'
	},
	{
		slug: 'bodenrichtwerte',
		kind: 'fis-broker',
		sourceUrl: `${FIS_BASE}/s_bodenrichtwerte`,
		typeName: 'fis:s_bodenrichtwerte',
		license: 'dl-de/by-2-0',
		bundleGroup: 'B: Wohn-Daten',
		zoomThresholds: { min: 12, max: 18 },
		simplifyProfile: 'polygon'
	},
	{
		slug: 'gebaeudealter',
		kind: 'fis-broker',
		sourceUrl: `${FIS_BASE}/s_wfs_alkis_gebaeudealter`,
		typeName: 'fis:s_wfs_alkis_gebaeudealter',
		license: 'dl-de/by-2-0',
		bundleGroup: 'B: Wohn-Daten',
		zoomThresholds: { min: 14, max: 18 },
		simplifyProfile: 'polygon'
	},
	// Bundle C: Umwelt (FIS-Broker + OSM saisonal)
	{
		slug: 'laerm-den',
		kind: 'fis-broker',
		sourceUrl: `${FIS_BASE}/s_strassenlaerm_l_den_2022`,
		typeName: 'fis:s_strassenlaerm_l_den_2022',
		license: 'dl-de/by-2-0',
		bundleGroup: 'C: Umwelt',
		zoomThresholds: { min: 11, max: 18 },
		simplifyProfile: 'polygon'
	},
	{
		slug: 'laerm-night',
		kind: 'fis-broker',
		sourceUrl: `${FIS_BASE}/s_strassenlaerm_l_n_2022`,
		typeName: 'fis:s_strassenlaerm_l_n_2022',
		license: 'dl-de/by-2-0',
		bundleGroup: 'C: Umwelt',
		zoomThresholds: { min: 11, max: 18 },
		simplifyProfile: 'polygon'
	},
	{
		slug: 'solarpotenzial',
		kind: 'fis-broker',
		sourceUrl: `${FIS_BASE}/s_solar`,
		typeName: 'fis:s_solar',
		license: 'dl-de/by-2-0',
		bundleGroup: 'C: Umwelt',
		zoomThresholds: { min: 13, max: 18 },
		simplifyProfile: 'polygon'
	},
	{
		slug: 'klimaanalyse',
		kind: 'fis-broker',
		sourceUrl: `${FIS_BASE}/s_pkam_2015`,
		typeName: 'fis:s_pkam_2015',
		license: 'dl-de/by-2-0',
		bundleGroup: 'C: Umwelt',
		zoomThresholds: { min: 10, max: 18 },
		simplifyProfile: 'polygon'
	},
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
