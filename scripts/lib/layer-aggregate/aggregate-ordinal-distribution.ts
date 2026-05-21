import {
	COVERAGE_THRESHOLD,
	belowThresholdMarker,
	round1,
	type DistributionClass,
	type OrdinalDistributionAggregate
} from './types.js';

/**
 * Klassen-Histogramm (Share je Klasse, % der beitragenden Member) + dominante Klasse.
 * Unter 50% non-null-Coverage → leere Verteilung + below-threshold-Marker.
 *
 * Determinismus: Klassen-Sortierung nach optionaler `classOrder`, sonst Share desc +
 * Label alphabetisch als Tie-Break (keine Map-Iterations-Abhängigkeit).
 */
export function aggregateOrdinalDistribution(
	memberLabels: readonly (string | null)[],
	classOrder?: readonly string[]
): OrdinalDistributionAggregate {
	const totalMembers = memberLabels.length;
	const labels = memberLabels.filter((l): l is string => l !== null && l !== '');
	const contributingMembers = labels.length;
	const coverage = totalMembers === 0 ? 0 : contributingMembers / totalMembers;

	if (totalMembers === 0 || coverage < COVERAGE_THRESHOLD) {
		return {
			type: 'ordinal-distribution',
			classes: [],
			dominant: null,
			contributingMembers,
			totalMembers,
			coverage: belowThresholdMarker(contributingMembers, totalMembers)
		};
	}

	const counts = new Map<string, number>();
	for (const l of labels) counts.set(l, (counts.get(l) ?? 0) + 1);

	let classes: DistributionClass[] = [...counts.entries()].map(([label, count]) => ({
		label,
		share: round1((count / contributingMembers) * 100)
	}));

	classes = classes.sort((a, b) => {
		if (classOrder) {
			const ia = classOrder.indexOf(a.label);
			const ib = classOrder.indexOf(b.label);
			const ra = ia === -1 ? Number.MAX_SAFE_INTEGER : ia;
			const rb = ib === -1 ? Number.MAX_SAFE_INTEGER : ib;
			if (ra !== rb) return ra - rb;
		} else if (b.share !== a.share) {
			return b.share - a.share;
		}
		return a.label.localeCompare(b.label, 'de');
	});

	// Dominante Klasse = größter Count (Tie-Break alphabetisch, deterministisch).
	const dominant = [...counts.entries()].sort((a, b) =>
		b[1] !== a[1] ? b[1] - a[1] : a[0].localeCompare(b[0], 'de')
	)[0][0];

	return {
		type: 'ordinal-distribution',
		classes,
		dominant,
		contributingMembers,
		totalMembers,
		coverage: `${contributingMembers}/${totalMembers}`
	};
}
