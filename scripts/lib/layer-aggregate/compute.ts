import type { Feature } from 'geojson';
import type { LorHierarchy } from '../kiez-score/lor-hierarchy.js';
import {
	collectPlrValues,
	collectSpatialPointValues,
	collectIntersectArea,
	type CellValue,
	type SpatialTargets
} from './member-assignment.js';
import { aggregateNumericMedian } from './aggregate-numeric-median.js';
import { aggregateOrdinalDistribution } from './aggregate-ordinal-distribution.js';
import { aggregateCoverageShare } from './aggregate-coverage-share.js';
import { aggregateAreaShare } from './aggregate-area-share.js';
import type { LayerStrategy } from './strategy.js';
import type { LayerAggregate, LayerAggregateEntry } from './types.js';

export interface ComputeContext {
	readonly hierarchy: LorHierarchy;
	readonly targets: SpatialTargets;
}

function sortedRecord(map: Map<string, LayerAggregate>): Record<string, LayerAggregate> {
	const out: Record<string, LayerAggregate> = {};
	for (const slug of [...map.keys()].sort((a, b) => a.localeCompare(b, 'de'))) {
		out[slug] = map.get(slug)!;
	}
	return out;
}

function toNumber(v: CellValue): number | null {
	return typeof v === 'number' ? v : null;
}

function toLabel(v: CellValue): string | null {
	return typeof v === 'string' ? v : null;
}

function ordinalEntry(
	source: readonly Feature[],
	valueKey: string,
	ctx: ComputeContext,
	neutral?: boolean
): LayerAggregateEntry {
	const lv = collectPlrValues(source, valueKey, ctx.hierarchy);
	const kiez = new Map<string, LayerAggregate>();
	for (const [slug, vals] of lv.kiez) kiez.set(slug, aggregateOrdinalDistribution(vals.map(toLabel)));
	const bezirk = new Map<string, LayerAggregate>();
	for (const [slug, vals] of lv.bezirk)
		bezirk.set(slug, aggregateOrdinalDistribution(vals.map(toLabel)));
	const berlin = aggregateOrdinalDistribution(lv.berlin.map(toLabel));
	return { type: 'ordinal-distribution', neutral, kiez: sortedRecord(kiez), bezirk: sortedRecord(bezirk), berlin };
}

function numericMedianEntry(
	source: readonly Feature[],
	valueKey: string,
	ctx: ComputeContext
): LayerAggregateEntry {
	const kiezVals = collectSpatialPointValues(source, valueKey, ctx.targets.kiez);
	const bezirkVals = collectSpatialPointValues(source, valueKey, ctx.targets.bezirk);
	const kiez = new Map<string, LayerAggregate>();
	for (const [slug, vals] of kiezVals) kiez.set(slug, aggregateNumericMedian(vals.map(toNumber)));
	const bezirk = new Map<string, LayerAggregate>();
	for (const [slug, vals] of bezirkVals)
		bezirk.set(slug, aggregateNumericMedian(vals.map(toNumber)));
	const berlinValues = source.map((f) => toNumber(((f.properties ?? {})[valueKey] ?? null) as CellValue));
	const berlin = aggregateNumericMedian(berlinValues);
	return { type: 'numeric-median', kiez: sortedRecord(kiez), bezirk: sortedRecord(bezirk), berlin };
}

function shareEntry(
	source: readonly Feature[],
	ctx: ComputeContext,
	type: 'coverage-share' | 'area-share',
	neutral?: boolean
): LayerAggregateEntry {
	const make = (hit: number, polyArea: number): LayerAggregate =>
		type === 'coverage-share' ? aggregateCoverageShare(hit, polyArea) : aggregateAreaShare(hit, polyArea);

	const kiezHit = collectIntersectArea(source, ctx.targets.kiez);
	const kiez = new Map<string, LayerAggregate>();
	let berlinHit = 0;
	for (const t of ctx.targets.kiez) {
		const hit = kiezHit.get(t.slug) ?? 0;
		berlinHit += hit;
		kiez.set(t.slug, make(hit, t.areaM2));
	}
	const bezirkHit = collectIntersectArea(source, ctx.targets.bezirk);
	const bezirk = new Map<string, LayerAggregate>();
	for (const t of ctx.targets.bezirk) bezirk.set(t.slug, make(bezirkHit.get(t.slug) ?? 0, t.areaM2));

	// Kiez-Tiles partitionieren Berlin → berlinHit = Summe der Kiez-Hits.
	const berlin = make(berlinHit, ctx.targets.berlinAreaM2);
	return { type, neutral, kiez: sortedRecord(kiez), bezirk: sortedRecord(bezirk), berlin };
}

/** Berechnet einen LayerAggregateEntry für einen aggregierbaren Layer. */
export function computeLayerEntry(
	strategy: LayerStrategy,
	source: readonly Feature[],
	ctx: ComputeContext
): LayerAggregateEntry {
	switch (strategy.type) {
		case 'ordinal-distribution':
			return ordinalEntry(source, strategy.valueKey ?? '', ctx, strategy.neutral);
		case 'numeric-median':
			return numericMedianEntry(source, strategy.valueKey ?? '', ctx);
		case 'coverage-share':
			return shareEntry(source, ctx, 'coverage-share', strategy.neutral);
		case 'area-share':
			return shareEntry(source, ctx, 'area-share', strategy.neutral);
		default:
			throw new Error(`computeLayerEntry: nicht aggregierbarer Typ ${strategy.type}`);
	}
}
