export type KiezScoreDimension =
	| 'ruhe-luft'
	| 'gruen-hitze'
	| 'mobilitaet'
	| 'versorgung'
	| 'wohnschutz'
	| 'kultur'
	| 'kriminalitaet';

export const KIEZ_SCORE_DIMENSIONS: readonly KiezScoreDimension[] = [
	'ruhe-luft',
	'gruen-hitze',
	'mobilitaet',
	'versorgung',
	'wohnschutz',
	'kultur',
	'kriminalitaet'
];

/**
 * Dimensionen, die in den Gesamt-/Composite-Score (computeOverallScore) einfließen.
 * Epic 13 / Option C: Kultur ist eine sichtbare, eigenständige Dimension (eigener Layer,
 * Rang, Inspector), zählt aber NICHT in den „Umwelt- & Infrastruktur-Score". Begründung:
 * Kultur ist innenstadt-lastig (Center-Bias) und würde als Headline-Treiber jeden
 * Außenbezirk-Gesamt-Score drücken. Präzedenz: ADR-015 (Soziale Lage genauso behandelt).
 */
export const COMPOSITE_DIMENSIONS: readonly KiezScoreDimension[] = [
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
	/** POI-Dichte (Story 10.4): Anzahl POIs im Radius statt Distanz. >= cap → 100, weicher Tail.
	 * Story 13.1: optionale `scale` — 'log' dämpft den Center-Bias (erster POI zählt stark, flacht ab),
	 * Default 'linear' (rückwärtskompatibel zu allen bestehenden poi-density-Termen). */
	| {
			kind: 'poi-density';
			radiusM: number;
			cap: number;
			softTailFactor?: number;
			scale?: 'linear' | 'log';
	  }
	/** Numerischer Wert, NICHT invertiert (Story 14.1): <= minAt → 0, >= maxAt → 100, höher = höher
	 * (Magnitude, kein Gut-Maß). maxAt-Clamp kappt City-Core-Ausreißer (ADR-019). */
	| { kind: 'numeric'; field: string; minAt: number; maxAt: number };

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
	wohnschutz: 0.2,
	// Story 13.1 (Option C): Kultur ist eigenständige Dimension, NICHT im Composite → Gewicht 0.
	// Die fünf Composite-Dimensionen bleiben bei 0.20 (Summe 1.0). Siehe COMPOSITE_DIMENSIONS.
	kultur: 0,
	// Story 14.1 (Option C): Kriminalität ist eigenständige Kontext-Dimension, NICHT im Composite
	// → Gewicht 0. Stigma-Schutz (ADR-019): Magnitude-Wert, kein Sicherheits-Ranking.
	kriminalitaet: 0
};
