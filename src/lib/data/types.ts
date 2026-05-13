import type { License, Bundle, GeometryType } from '../../../scripts/lib/types.js';
import type { MultiPolygon, Polygon } from 'geojson';

export type { License, Bundle, GeometryType };

export type Locale = 'de' | 'en' | 'tr' | 'uk' | 'ar' | 'es' | 'fr' | 'it';

export type LayerHitReason = 'no-coverage' | 'outdated' | 'seasonal';

export interface LayerHit {
	layer: string;
	value: unknown;
	source: string;
	updatedAt: string;
	license: License;
	reason?: LayerHitReason;
}

export interface LayerMetadata {
	slug: string;
	filename: string;
	sourceUrl: string;
	fetchedAt: string;
	sourceUpdatedAt?: string;
	license: License;
	sha256: string;
	bundleGroup: Bundle;
	zoomThresholds: { min: number; max: number };
	seasonality?: { from: string; to: string };
	geometryType: GeometryType;
	featureCount: number;
	inspectorRelevant?: boolean;
}

export interface Manifest {
	schemaVersion: 1;
	generatedAt: string;
	layers: LayerMetadata[];
}

export interface ClimateStation {
	id: string;
	name: string;
	coordinates: [number, number];
	firstYear: number;
}

export interface YearValue {
	year: number;
	count?: number;
	temp?: number;
}

export interface ClimateData {
	stationId: string;
	name: string;
	coordinates: [number, number];
	elevation: number;
	firstYear: number;
	summerDays: YearValue[];
	frostDays: YearValue[];
	hotDays: YearValue[];
	annualMeanTemp?: YearValue[];
}

export interface FaqEntry {
	question: string;
	answer: string;
}

export interface GeocodeSuggestion {
	id: string;
	displayName: string;
	lat: number;
	lng: number;
	type: string;
	addresstype: string;
	bezirk?: string;
	kiez?: string;
	postcode?: string;
	bbox?: [number, number, number, number];
}

export interface KiezProfile {
	slug: string;
	name: string;
	bezirk: string;
	einwohner: number;
	flaecheHa: number;
	centroid: [number, number];
	geometry: MultiPolygon | Polygon;
	layerCoverage: LayerHit[];
	faq?: FaqEntry[];
}

export interface BezirkProfile {
	slug: string;
	name: string;
	einwohner: number;
	flaecheHa: number;
	centroid: [number, number];
	geometry: MultiPolygon | Polygon;
	ortsteilSlugs: string[];
	layerCoverage: LayerHit[];
	faq?: FaqEntry[];
}
