import type { Feature, FeatureCollection, Polygon, MultiPolygon } from 'geojson';
import center from '@turf/center';
import { computeKiezScore } from './compute-score.js';
import {
	buildPolygonLayerHitsAtPoint,
	buildPresenceLayerHits,
	buildPoiIndex,
	buildPoiDistanceHits,
	buildNearestPointValueHits,
	buildPoiDensityCounts,
	type BuildLayerSpec
} from './build-helpers.js';
import { findAllNearestStopsForBuild, type OepnvStopIndexShape } from './nearest-stops.js';
import { DIMENSION_CONFIGS } from './dimension-config.js';
import { KIEZ_SCORE_DIMENSIONS, type KiezScore, type KiezScoreDimension } from './types.js';

// Story 10.4: alle poi-density-Layer + ihr Radius aus den Dimension-Configs ableiten,
// damit der Radius-Join im LOR-Loop einmalig konfiguriert ist.
const POI_DENSITY_SPECS: ReadonlyArray<{ slug: string; radiusM: number }> = Object.values(
	DIMENSION_CONFIGS
).flatMap((cfg) =>
	cfg.layers
		.filter((l) => l.normalize.kind === 'poi-density')
		.map((l) => ({
			slug: l.layer,
			radiusM: (l.normalize as { radiusM: number }).radiusM
		}))
);

export interface PipelineInput {
	lorFeatures: readonly Feature[];
	polygonLayers: readonly BuildLayerSpec[];
	presenceLayers: readonly string[];
	/** POI-Layer für Versorgungs-Dim (Distance-from-Centroid). Points + Polygone (centroid-fallback). */
	poiLayers?: readonly BuildLayerSpec[];
	/** Point-Value-Layer (z.B. PET-Centroids, Story 10.10): nächster Punkt-Wert am LOR-Centroid. */
	pointValueLayers?: readonly BuildLayerSpec[];
	/** Vorberechnete Hits pro LOR-ID (z.B. Kita-Plätze-pro-Kind, Story 10.1). */
	perLorHits?: Record<string, readonly import('./types.js').LayerHitLike[]>;
	oepnvIndex: OepnvStopIndexShape;
	lorIdFor?: (feat: Feature) => string | null;
}

export interface PipelineOutput {
	schemaVersion: 1;
	generatedAt: string;
	scores: Record<string, KiezScore>;
}

export type KiezScoreLayerSlug =
	| 'kiez-score-gesamt'
	| 'kiez-score-ruhe-luft'
	| 'kiez-score-gruen-hitze'
	| 'kiez-score-mobilitaet'
	| 'kiez-score-versorgung'
	| 'kiez-score-wohnschutz'
	| 'kiez-score-kultur'
	| 'kiez-score-kriminalitaet';

export const KIEZ_SCORE_LAYER_SLUG_BY_DIMENSION: Record<KiezScoreDimension, KiezScoreLayerSlug> = {
	'ruhe-luft': 'kiez-score-ruhe-luft',
	'gruen-hitze': 'kiez-score-gruen-hitze',
	mobilitaet: 'kiez-score-mobilitaet',
	versorgung: 'kiez-score-versorgung',
	wohnschutz: 'kiez-score-wohnschutz',
	kultur: 'kiez-score-kultur',
	kriminalitaet: 'kiez-score-kriminalitaet'
};

/** Composite-/Gesamt-Layer: ungewichtetes Mittel der Dimensionen pro LOR (score.overall). */
export const KIEZ_SCORE_COMPOSITE_LAYER_SLUG: KiezScoreLayerSlug = 'kiez-score-gesamt';

export interface DerivedLayerGeoJsons {
	[slug: string]: FeatureCollection;
}

/**
 * Erzeugt pro Kiez-Score-Dimension eine derived-FeatureCollection auf Basis der LOR-Polygone
 * mit `properties.value` (0-100 oder null) + `properties.plr_id`. Konsumenten: Map-Layer-Render
 * (`kiez-score-*`-Style-Profile).
 */
export function buildDerivedLayerGeojsons(
	lorFeatures: readonly Feature[],
	pipelineOutput: PipelineOutput,
	idFn: (feat: Feature) => string | null = defaultLorIdFor
): DerivedLayerGeoJsons {
	const out: DerivedLayerGeoJsons = {};
	for (const dimension of KIEZ_SCORE_DIMENSIONS) {
		const slug = KIEZ_SCORE_LAYER_SLUG_BY_DIMENSION[dimension];
		const features: Feature[] = [];
		for (const lor of lorFeatures) {
			if (lor.geometry.type !== 'Polygon' && lor.geometry.type !== 'MultiPolygon') continue;
			const lorId = idFn(lor);
			if (!lorId) continue;
			const score = pipelineOutput.scores[lorId];
			if (!score) continue;
			const dim = score.dimensions.find((d) => d.dimension === dimension);
			if (!dim) continue;
			features.push({
				type: 'Feature',
				geometry: lor.geometry,
				properties: {
					plr_id: lorId,
					value: dim.value,
					dataStand: dim.dataStand
				}
			});
		}
		out[slug] = { type: 'FeatureCollection', features };
	}

	// Composite-/Gesamt-Layer: score.overall pro LOR (ADR-015: alle Dimensionen
	// positiv-eindeutig, daher ist ein Gesamt-Choropleth jetzt vertretbar).
	const compositeFeatures: Feature[] = [];
	for (const lor of lorFeatures) {
		if (lor.geometry.type !== 'Polygon' && lor.geometry.type !== 'MultiPolygon') continue;
		const lorId = idFn(lor);
		if (!lorId) continue;
		const score = pipelineOutput.scores[lorId];
		if (!score) continue;
		compositeFeatures.push({
			type: 'Feature',
			geometry: lor.geometry,
			properties: {
				plr_id: lorId,
				value: score.overall ?? null,
				dataStand: null
			}
		});
	}
	out[KIEZ_SCORE_COMPOSITE_LAYER_SLUG] = { type: 'FeatureCollection', features: compositeFeatures };

	return out;
}

export const LOR_ID_CANDIDATE_KEYS = [
	'plr_id',
	'PLR_ID',
	'PLR_NAME',
	'spatial_alias',
	'spatial_name',
	'id'
] as const;

export function defaultLorIdFor(feat: Feature): string | null {
	const props = feat.properties ?? {};
	for (const key of LOR_ID_CANDIDATE_KEYS) {
		const value = (props as Record<string, unknown>)[key];
		if (typeof value === 'string' && value.length > 0) return value;
		if (typeof value === 'number') return String(value);
	}
	return null;
}

export function buildKiezScoresFromInput(
	input: PipelineInput,
	generatedAt: string
): PipelineOutput {
	const idFn = input.lorIdFor ?? defaultLorIdFor;
	const presenceHits = buildPresenceLayerHits(input.presenceLayers);
	const poiIndex = buildPoiIndex(input.poiLayers ?? []);
	const scores: Record<string, KiezScore> = {};
	for (const lor of input.lorFeatures) {
		if (lor.geometry.type !== 'Polygon' && lor.geometry.type !== 'MultiPolygon') continue;
		const lorId = idFn(lor);
		if (!lorId) continue;
		const centroid = center(lor as Feature<Polygon | MultiPolygon>);
		const [lng, lat] = centroid.geometry.coordinates as [number, number];
		const polygonHits = buildPolygonLayerHitsAtPoint(lat, lng, input.polygonLayers);
		const poiHits = buildPoiDistanceHits(lat, lng, poiIndex);
		const pointValueHits = buildNearestPointValueHits(lat, lng, input.pointValueLayers ?? []);
		const perLor = input.perLorHits?.[lorId] ?? [];
		const poiCounts = buildPoiDensityCounts(lat, lng, poiIndex, POI_DENSITY_SPECS);
		const stops = findAllNearestStopsForBuild({ lat, lng }, input.oepnvIndex);
		scores[lorId] = computeKiezScore({
			layerHits: [...polygonHits, ...presenceHits, ...poiHits, ...pointValueHits, ...perLor],
			nearestStops: stops,
			poiCounts
		});
	}
	return { schemaVersion: 1, generatedAt, scores };
}
