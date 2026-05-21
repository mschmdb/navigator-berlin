export type KiezScoreDimension =
	| 'ruhe-luft'
	| 'gruen-hitze'
	| 'mobilitaet'
	| 'versorgung'
	| 'wohnschutz';

export const KIEZ_SCORE_DIMENSIONS: readonly KiezScoreDimension[] = [
	'ruhe-luft',
	'gruen-hitze',
	'mobilitaet',
	'versorgung',
	'wohnschutz'
];

export type Modus = 'ubahn' | 'sbahn' | 'tram' | 'bus';

export interface DimensionSource {
	layer: string;
	rawValue: unknown;
	normalizedValue: number | null;
	weight: number;
}

export interface DimensionScore {
	dimension: KiezScoreDimension;
	value: number | null;
	sources: DimensionSource[];
	missingData: string[];
	dataStand: string | null;
}

export interface KiezScore {
	persona: 'allgemein';
	dimensions: DimensionScore[];
	overall?: number;
	missingDimensions: KiezScoreDimension[];
}

export type NormalizationStrategy =
	| { kind: 'ordinal-3'; field: string }
	| { kind: 'ordinal-4'; field: string }
	| { kind: 'mss-status-4'; field: string }
	| { kind: 'presence' }
	| { kind: 'mode-distance'; mode: Modus; threshold: number }
	| { kind: 'presence-any-of'; layers: string[] }
	| { kind: 'poi-distance'; threshold: number }
	/** Numerischer Wert, invertiert: <= bestAt → 100, >= worstAt → 0 (z.B. PET-Hitzebelastung). */
	| { kind: 'numeric-inverted'; field: string; bestAt: number; worstAt: number }
	/** Kita-Plätze pro Kind 0-6 (Story 10.1): >= bestAt → 100, höher = besser. Wert aus perLorHits. */
	| { kind: 'kita-pro-kind'; field: string; bestAt: number }
	/** Kapazitätsgewichtete POI-Distanz (Story 10.2): Distanz-Score × Betten/Fachabteilungs-Faktor. */
	| {
			kind: 'capacity-weighted-distance';
			threshold: number;
			bettenField: string;
			maxBetten: number;
			fachabteilungenField?: string;
			maxFachabteilungen?: number;
	  }
	/** POI-Dichte (Story 10.4): Anzahl POIs im Radius statt Distanz. >= cap → 100, weicher Tail. */
	| { kind: 'poi-density'; radiusM: number; cap: number; softTailFactor?: number };

export interface LayerWeight {
	layer: string;
	weight: number;
	normalize: NormalizationStrategy;
}

export interface DimensionConfig {
	dimension: KiezScoreDimension;
	layers: LayerWeight[];
	fallback?: LayerWeight;
	/** Intrinsischer Validity-Guard auf dem Roh-Wert (z.B. MSS-`kom != gültig`). */
	intrinsicGuard?: (rawValue: unknown) => boolean;
}

export interface LayerHitLike {
	layer: string;
	value: unknown;
	updatedAt?: string;
	reason?: string;
}

export interface NearestStopLike {
	distanceM: number;
}

export interface ScoreInput {
	layerHits: readonly LayerHitLike[];
	nearestStops: Record<Modus, NearestStopLike | null> | null;
	/** Radius-Join-Ergebnis pro Layer-Slug (Story 10.4 poi-density). */
	poiCounts?: Record<string, { count: number; nearestM: number | null }>;
}

export const DIMENSION_WEIGHTS: Record<KiezScoreDimension, number> = {
	'ruhe-luft': 0.2,
	'gruen-hitze': 0.2,
	mobilitaet: 0.2,
	versorgung: 0.2,
	wohnschutz: 0.2
};
