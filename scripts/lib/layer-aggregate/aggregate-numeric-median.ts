import {
	COVERAGE_THRESHOLD,
	belowThresholdMarker,
	round1,
	type NumericMedianAggregate
} from './types.js';

/**
 * Median + Min/Max der Member-Werte. Member = Source-Features im Ziel-Polygon.
 * Unter 50% non-null-Coverage → median null + below-threshold-Marker (ADR-013-Regel).
 * Median (nicht Mittel) für Robustheit (ADR-014 Abschnitt 2).
 */
export function aggregateNumericMedian(
	memberValues: readonly (number | null)[]
): NumericMedianAggregate {
	const totalMembers = memberValues.length;
	const values = memberValues.filter(
		(v): v is number => v !== null && Number.isFinite(v)
	);
	const contributingMembers = values.length;
	const coverage = totalMembers === 0 ? 0 : contributingMembers / totalMembers;

	if (totalMembers === 0 || coverage < COVERAGE_THRESHOLD) {
		return {
			type: 'numeric-median',
			median: null,
			min: null,
			max: null,
			contributingMembers,
			totalMembers,
			coverage: belowThresholdMarker(contributingMembers, totalMembers)
		};
	}

	const sorted = [...values].sort((a, b) => a - b);
	const mid = Math.floor(sorted.length / 2);
	const median =
		sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];

	return {
		type: 'numeric-median',
		median: round1(median),
		min: round1(sorted[0]),
		max: round1(sorted[sorted.length - 1]),
		contributingMembers,
		totalMembers,
		coverage: `${contributingMembers}/${totalMembers}`
	};
}
