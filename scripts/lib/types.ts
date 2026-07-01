export type Bundle =
	| 'A: Boundaries'
	| 'B: Wohn-Daten'
	| 'C: Umwelt'
	| 'D: Memorial'
	| 'E: Soziale Infrastruktur'
	| 'F: Mobilität'
	| 'G: Kiez-Score'
	| 'H: Wahldaten'
	| 'I: Demografie'
	| 'J: Kultur';
export type License =
	| 'dl-de/zero-2-0'
	| 'dl-de/by-2-0'
	| 'CC BY 4.0'
	| 'ODbL 1.0'
	| 'Geodatenzugangsgesetz';
export type GeometryType = 'Point' | 'Polygon' | 'MultiPolygon' | 'LineString';
export type SimplifyProfile = 'boundary' | 'polygon' | 'point' | 'tiles';
export type LayerFormat = 'geojson' | 'pmtiles';
export type SourceKind = 'fis-broker' | 'odis' | 'overpass' | 'dwd' | 'local';

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
	/** Optional. Weitere typeNames am selben Endpoint, die zu einem Output gemergt werden.
	 * Für überschneidungsfreie Partitions-Quellen (z.B. PET Straßenraum + Grünfläche). Story 10.9. */
	additionalTypeNames?: string[];
	overpassQL?: string;
	/** Nur für kind 'local'. Pfad relativ zum Repo-Root zu einem vorgebauten GeoJSON
	 * (z.B. Build-Output von build-kuehle-orte.ts). Wird statt eines Netz-Fetch gelesen. */
	localPath?: string;
	/** Optional. Vorgelagertes Build-Script, das den (lokalen) Input erzeugt. Nur für den
	 * Pipeline-Atlas (docs/pipelines/data-flow.md), keine Fetch-Logik. Story 15.7. */
	buildStep?: string;
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
	/** Default 'geojson'. 'pmtiles' für Heavy-Layer via tippecanoe-Pipeline. */
	format?: LayerFormat;
	/** Nur für simplifyProfile 'tiles'. tippecanoe-Minzoom (-Z). Default zoomThresholds.min.
	 * Muss <= Map-minZoom (9), sonst fehlen Tiles bei der Berlin-Übersicht. Story 10.9. */
	tileMinZoom?: number;
	/** Nur für simplifyProfile 'tiles'. tippecanoe-Maxzoom (-z). Default zoomThresholds.max.
	 * Für Choropleth-Flächen genügt ein niedriger Wert, MapLibre over-zoomt. Story 10.9. */
	tileMaxZoom?: number;
	/** Nur für simplifyProfile 'tiles'. Properties, die in die Tiles übernommen werden (-y).
	 * Leer = alle. Bei breiten WFS-Attributen drastisch kleinere Tiles. Story 10.9. */
	tileIncludeProperties?: readonly string[];
	/** Optional. Wenn gesetzt: bei Polygon-NO-HIT wird nächstes Polygon innerhalb dieser
	 * Distanz (km) als Hit gewertet. Fachlich sinnvoll für räumlich glatte Indikatoren
	 * (z.B. Klima-Block-Geometrien, wo Adress-Geocoding im Hof/Straßenraum landet,
	 * der außerhalb der Siedlungs-Polygone liegt). Story 1.25. */
	nearestPolygonFallbackKm?: number;
	/** Optional. Räumlicher Geltungsbereich als [minLng, minLat, maxLng, maxLat].
	 * Manuelle Konfiguration; Punkte außerhalb liefern reason='coverage-out-of-scope'.
	 * Story 1.23. */
	coverageBbox?: [number, number, number, number];
	/** Default true. Wenn false, wird Layer in der LayerPalette / auf der Karte nicht angeboten.
	 * Nutzbar für Build-Only-Datensätze (z.B. LOR-Planungsraum als Geometrie-Input für
	 * den Kiez-Score-Build, ohne als sichtbarer Map-Layer aufzutauchen). Story 1.28. */
	mapRelevant?: boolean;
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
	format?: LayerFormat;
	/** siehe SourceConfig.nearestPolygonFallbackKm. */
	nearestPolygonFallbackKm?: number;
	/** siehe SourceConfig.coverageBbox. */
	coverageBbox?: [number, number, number, number];
	/** siehe SourceConfig.mapRelevant. */
	mapRelevant?: boolean;
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
