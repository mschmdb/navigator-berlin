import { COVERAGE_THRESHOLD } from '../kiez-score/aggregate-to-larger-region.js';

export { COVERAGE_THRESHOLD };

// Aggregat-Shapes sind Single-Source in src/lib/data/layer-aggregates-types.ts
// (auch von 8.2b/8.5 importiert). Hier nur re-export + Build-Helfer.
export type {
	AggregateType,
	DistributionClass,
	NumericMedianAggregate,
	OrdinalDistributionAggregate,
	CoverageShareAggregate,
	AreaShareAggregate,
	LayerAggregate,
	LayerAggregateEntry,
	LayerAggregatesFile
} from '../../../src/lib/data/layer-aggregates-types.js';

/** Auf 1 Nachkommastelle runden (gleiche Konvention wie Kiez-Score-Aggregat). */
export function round1(n: number): number {
	return Math.round(n * 10) / 10;
}

/** Below-Threshold-Marker, identisches Format zum Kiez-Score-Aggregat. */
export function belowThresholdMarker(contributing: number, total: number): string {
	return `coverage:${contributing}/${total}-below-${COVERAGE_THRESHOLD * 100}%-threshold`;
}
