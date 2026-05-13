export type Bundle =
	| 'A: Boundaries'
	| 'B: Wohn-Daten'
	| 'C: Umwelt'
	| 'D: Memorial'
	| 'E: Soziale Infrastruktur'
	| 'F: Mobilität';
export type License =
	| 'dl-de/zero-2-0'
	| 'dl-de/by-2-0'
	| 'CC BY 4.0'
	| 'ODbL 1.0'
	| 'Geodatenzugangsgesetz';
export type GeometryType = 'Point' | 'Polygon' | 'MultiPolygon' | 'LineString';
export type SimplifyProfile = 'boundary' | 'polygon' | 'point';
export type SourceKind = 'fis-broker' | 'odis' | 'overpass' | 'dwd';

export interface ZoomRange {
	min: number;
	max: number;
}

export interface Seasonality {
	from: string;
	to: string;
}

export interface SourceConfig {
	slug: string;
	kind: SourceKind;
	sourceUrl: string;
	typeName?: string;
	overpassQL?: string;
	license: License;
	bundleGroup: Bundle;
	zoomThresholds: ZoomRange;
	seasonality?: Seasonality;
	simplifyProfile: SimplifyProfile;
	/** Stichtag / Erhebungsjahr aus Quellen-Metadaten (ISO-Date). Fallback in Inspector: fetchedAt. */
	sourceUpdatedAt?: string;
	/** Default true. Wenn false, wird Layer im getLayersAtPoint übersprungen
	 * (z.B. ÖPNV-Stationen / Verkehrsnetze: kein Adress-Hit-Konzept, Map-Only). */
	inspectorRelevant?: boolean;
}

export interface LayerEntry {
	slug: string;
	filename: string;
	sourceUrl: string;
	fetchedAt: string;
	sourceUpdatedAt?: string;
	license: License;
	sha256: string;
	bundleGroup: Bundle;
	zoomThresholds: ZoomRange;
	seasonality?: Seasonality;
	geometryType: GeometryType;
	featureCount: number;
	inspectorRelevant?: boolean;
}

export interface Manifest {
	schemaVersion: 1;
	generatedAt: string;
	layers: LayerEntry[];
}

export interface ClimateBundle {
	stationId: string;
	name: string;
	coordinates: [number, number];
	elevation: number;
	firstYear: number;
	source: string;
	fetchedAt: string;
	summerDays: Array<{ year: number; count: number }>;
	frostDays: Array<{ year: number; count: number }>;
	hotDays: Array<{ year: number; count: number }>;
	annualMeanTemp?: Array<{ year: number; temp: number }>;
}
