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
import { COMPOSITE_DIMENSIONS } from './types.js';
import {
	normalizeOrdinal3,
	normalizeOrdinal4,
	normalizeMssStatus4,
	normalizeDistance,
	normalizeNumericInverted,
	normalizeNumeric,
	normalizePresence,
	normalizeKitaProKind,
	parseBettenCapacity,
	normalizeCapacityWeightedDistance,
	normalizeDensity
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

function normalizeFromHit(weight: LayerWeight, hit: LayerHitLike): NormalizedSource {
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
		case 'numeric-inverted':
			rawValue = getProp(hit.value, normalize.field);
			normalized = normalizeNumericInverted(rawValue, normalize.bestAt, normalize.worstAt);
			break;
		case 'numeric':
			normalized = normalizeNumeric(
				getProp(hit.value, normalize.field),
				normalize.minAt,
				normalize.maxAt
			);
			// rawValue bleibt das ganze hit.value-Objekt (index + ggf. delikte), damit der Inspector
			// die Delikt-Aufschlüsselung rendern kann (Story 14.4). normalizedValue kommt aus `field`.
			rawValue = hit.value;
			break;
		case 'kita-pro-kind': {
			const v = getProp(hit.value, normalize.field);
			const proKind = typeof v === 'number' ? v : null;
			rawValue = proKind;
			normalized = normalizeKitaProKind(proKind, normalize.bestAt);
			break;
		}
		case 'capacity-weighted-distance': {
			const meters = readDistanceMeters(hit.value);
			const betten = parseBettenCapacity(getProp(hit.value, normalize.bettenField));
			const fach = normalize.fachabteilungenField
				? parseBettenCapacity(getProp(hit.value, normalize.fachabteilungenField))
				: null;
			rawValue = meters !== null ? { distanceM: meters, betten, fachabteilungen: fach } : null;
			normalized = normalizeCapacityWeightedDistance(
				meters,
				normalize.threshold,
				betten,
				normalize.maxBetten,
				fach,
				normalize.maxFachabteilungen ?? 0
			);
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

// Synthetische Layer ohne direkten Polygon-Hit: mode-distance liest aus nearestStops,
// presence-any-of prüft mehrere reale Layer-Slugs ODER-verknüpft. Dimension-agnostisch
// (Mobilität via mode-distance/radverkehr, Wohnschutz via Milieuschutz-presence-any-of).
function normalizeSyntheticLayer(
	weight: LayerWeight,
	stops: Record<Modus, NearestStopLike | null> | null,
	layerHits: readonly LayerHitLike[],
	poiCounts?: Record<string, { count: number; nearestM: number | null }>
): NormalizedSource {
	const { normalize } = weight;
	if (normalize.kind === 'poi-density') {
		const entry = poiCounts?.[weight.layer];
		const normalized = entry
			? normalizeDensity(entry.count, entry.nearestM, {
					cap: normalize.cap,
					radiusM: normalize.radiusM,
					softTailFactor: normalize.softTailFactor,
					scale: normalize.scale
				})
			: null;
		const source: DimensionSource = {
			layer: weight.layer,
			rawValue: entry ?? null,
			normalizedValue: normalized,
			weight: weight.weight
		};
		return { source };
	}
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

export function computeDimensionScore(config: DimensionConfig, input: ScoreInput): DimensionScore {
	const dataStands: string[] = [];
	const missingData: string[] = [];

	const collected: DimensionSource[] = [];

	for (const weight of config.layers) {
		const kind = weight.normalize.kind;
		if (kind === 'mode-distance' || kind === 'presence-any-of' || kind === 'poi-density') {
			const result = normalizeSyntheticLayer(
				weight,
				input.nearestStops,
				input.layerHits,
				input.poiCounts
			);
			collected.push(result.source);
			if (kind === 'poi-density' && result.source.normalizedValue === null) {
				missingData.push(weight.layer);
			}
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
 * Composite-Score als ungewichtetes Mittel über die COMPOSITE_DIMENSIONS mit `value !== null`.
 * Misst nur Größen mit eindeutiger Besser-Richtung (ADR-015): Sozialstruktur ist kein Input.
 * Story 13.1 (Option C): Kultur ist eigenständige Dimension, aber NICHT im Composite — sie wird
 * hier herausgefiltert, damit der „Umwelt- & Infrastruktur-Score" das Mittel der fünf bleibt.
 */
export function computeOverallScore(dimensions: readonly DimensionScore[]): number | null {
	const usable = dimensions.filter(
		(d) => d.value !== null && COMPOSITE_DIMENSIONS.includes(d.dimension)
	);
	if (usable.length === 0) return null;
	const sum = usable.reduce((acc, d) => acc + (d.value as number), 0);
	return Math.round((sum / usable.length) * 10) / 10;
}

export { type NormalizationStrategy };
