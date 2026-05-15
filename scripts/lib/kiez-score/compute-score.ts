import type {
	DimensionConfig,
	DimensionScore,
	DimensionSource,
	KiezScore,
	KiezScoreDimension,
	LayerHitLike,
	LayerWeight,
	NearestStopLike,
	Modus,
	NormalizationStrategy,
	ScoreInput
} from './types.js';
import { DIMENSION_CONFIGS } from './dimension-config.js';
import {
	normalizeOrdinal3,
	normalizeOrdinal4,
	normalizeMssStatus4,
	normalizeDistance,
	normalizePresence
} from './normalize.js';

function readDistanceMeters(value: unknown): number | null {
	if (!value || typeof value !== 'object') return null;
	const obj = value as Record<string, unknown>;
	const m = obj.distanceM;
	return typeof m === 'number' && Number.isFinite(m) ? m : null;
}

function getProp(value: unknown, field: string): unknown {
	if (!value || typeof value !== 'object') return null;
	return (value as Record<string, unknown>)[field] ?? null;
}

function hitFor(layerHits: readonly LayerHitLike[], slug: string): LayerHitLike | null {
	return layerHits.find((h) => h.layer === slug) ?? null;
}

function isUsable(hit: LayerHitLike | null): hit is LayerHitLike {
	if (!hit) return false;
	if (hit.reason && hit.reason !== '') return false;
	return hit.value !== null && hit.value !== undefined;
}

interface NormalizedSource {
	source: DimensionSource;
	updatedAt?: string;
}

function normalizeFromHit(
	weight: LayerWeight,
	hit: LayerHitLike
): NormalizedSource {
	const { normalize } = weight;
	let normalized: number | null = null;
	let rawValue: unknown = hit.value;
	switch (normalize.kind) {
		case 'ordinal-3':
			rawValue = getProp(hit.value, normalize.field);
			normalized = normalizeOrdinal3(rawValue);
			break;
		case 'ordinal-4':
			rawValue = getProp(hit.value, normalize.field);
			normalized = normalizeOrdinal4(rawValue);
			break;
		case 'mss-status-4':
			rawValue = getProp(hit.value, normalize.field);
			normalized = normalizeMssStatus4(rawValue);
			break;
		case 'presence':
			normalized = normalizePresence(true);
			break;
		case 'poi-distance': {
			const meters = readDistanceMeters(hit.value);
			rawValue = meters !== null ? { distanceM: meters } : null;
			normalized = normalizeDistance(meters, normalize.threshold);
			break;
		}
		default:
			normalized = null;
	}
	const source: DimensionSource = {
		layer: weight.layer,
		rawValue,
		normalizedValue: normalized,
		weight: weight.weight
	};
	const result: NormalizedSource = { source };
	if (hit.updatedAt) result.updatedAt = hit.updatedAt;
	return result;
}

function normalizeMobility(
	weight: LayerWeight,
	stops: Record<Modus, NearestStopLike | null> | null,
	layerHits: readonly LayerHitLike[]
): NormalizedSource {
	const { normalize } = weight;
	if (normalize.kind === 'mode-distance') {
		const stop = stops?.[normalize.mode] ?? null;
		const normalized = stop ? normalizeDistance(stop.distanceM, normalize.threshold) : 0;
		const source: DimensionSource = {
			layer: weight.layer,
			rawValue: stop ? { distanceM: stop.distanceM } : null,
			normalizedValue: normalized,
			weight: weight.weight
		};
		return { source };
	}
	if (normalize.kind === 'presence-any-of') {
		const present = normalize.layers.some((slug) => isUsable(hitFor(layerHits, slug)));
		const source: DimensionSource = {
			layer: weight.layer,
			rawValue: present,
			normalizedValue: normalizePresence(present),
			weight: weight.weight
		};
		return { source };
	}
	const source: DimensionSource = {
		layer: weight.layer,
		rawValue: null,
		normalizedValue: null,
		weight: weight.weight
	};
	return { source };
}

function youngest(dates: readonly string[]): string | null {
	let max: string | null = null;
	for (const d of dates) {
		if (!d) continue;
		if (!max || d > max) max = d;
	}
	return max;
}

function weightedAverage(sources: readonly DimensionSource[]): number | null {
	const usable = sources.filter((s) => s.normalizedValue !== null);
	if (usable.length === 0) return null;
	let sum = 0;
	let total = 0;
	for (const s of usable) {
		sum += (s.normalizedValue as number) * s.weight;
		total += s.weight;
	}
	if (total === 0) return null;
	return Math.round((sum / total) * 10) / 10;
}

export function computeDimensionScore(
	config: DimensionConfig,
	input: ScoreInput
): DimensionScore {
	const dataStands: string[] = [];
	const missingData: string[] = [];

	const isMobility = config.dimension === 'mobilitaet';
	const collected: DimensionSource[] = [];

	for (const weight of config.layers) {
		if (isMobility) {
			const result = normalizeMobility(weight, input.nearestStops, input.layerHits);
			collected.push(result.source);
			continue;
		}
		const hit = hitFor(input.layerHits, weight.layer);
		if (!isUsable(hit)) {
			missingData.push(weight.layer);
			collected.push({
				layer: weight.layer,
				rawValue: null,
				normalizedValue: null,
				weight: weight.weight
			});
			continue;
		}
		if (config.intrinsicGuard && !config.intrinsicGuard(hit.value)) {
			missingData.push(weight.layer);
			collected.push({
				layer: weight.layer,
				rawValue: hit.value,
				normalizedValue: null,
				weight: weight.weight
			});
			continue;
		}
		const result = normalizeFromHit(weight, hit);
		collected.push(result.source);
		if (result.updatedAt) dataStands.push(result.updatedAt);
	}

	const primaryUsable = collected.some((s) => s.normalizedValue !== null);

	let finalSources = collected;
	if (!primaryUsable && config.fallback) {
		const fallbackHit = hitFor(input.layerHits, config.fallback.layer);
		if (isUsable(fallbackHit)) {
			const fallbackResult = normalizeFromHit(config.fallback, fallbackHit);
			finalSources = [...collected, fallbackResult.source];
			if (fallbackResult.updatedAt) dataStands.push(fallbackResult.updatedAt);
		}
	}

	const value = weightedAverage(finalSources);

	return {
		dimension: config.dimension,
		value,
		sources: finalSources,
		missingData,
		dataStand: youngest(dataStands)
	};
}

export function computeKiezScore(input: ScoreInput): KiezScore {
	const dimensions: DimensionScore[] = [];
	const missingDimensions: KiezScoreDimension[] = [];

	for (const config of DIMENSION_CONFIGS) {
		const score = computeDimensionScore(config, input);
		dimensions.push(score);
		if (score.value === null) missingDimensions.push(config.dimension);
	}

	const overall = computeOverallScore(dimensions);

	const result: KiezScore = {
		persona: 'allgemein',
		dimensions,
		missingDimensions
	};
	if (overall !== null) result.overall = overall;
	return result;
}

/**
 * Composite-Score als ungewichtetes Mittel über alle Dimensionen mit `value !== null`.
 * Stigma-Schutz: Soziale Lage zählt mit, weil sie eine Dimension von vielen ist;
 * der Composite wird ausschließlich im Inspector gezeigt, NIE auf der Karte.
 */
export function computeOverallScore(dimensions: readonly DimensionScore[]): number | null {
	const usable = dimensions.filter((d) => d.value !== null);
	if (usable.length === 0) return null;
	const sum = usable.reduce((acc, d) => acc + (d.value as number), 0);
	return Math.round((sum / usable.length) * 10) / 10;
}

export { type NormalizationStrategy };
