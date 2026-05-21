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
	| { kind: 'numeric-inverted'; field: string; bestAt: number; worstAt: number };

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
}

export const DIMENSION_WEIGHTS: Record<KiezScoreDimension, number> = {
	'ruhe-luft': 0.2,
	'gruen-hitze': 0.2,
	mobilitaet: 0.2,
	versorgung: 0.2,
	wohnschutz: 0.2
};
