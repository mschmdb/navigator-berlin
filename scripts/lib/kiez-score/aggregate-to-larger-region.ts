import type { DimensionScore, KiezScore, KiezScoreDimension } from './types.js';
import { KIEZ_SCORE_DIMENSIONS } from './types.js';
import { computeOverallScore } from './compute-score.js';

/**
 * Story 2.9a · Aggregations-Helper.
 *
 * Aggregiert 1.28-Planungsraum-Scores (542 PLR, Source-of-Truth) zu größeren
 * Regionen (138 LOR-Bezirksregionen oder 12 Bezirke) via flächen-gewichtetem
 * Mittel pro Dimension. `overall` wird NICHT re-aggregiert sondern aus den
 * aggregierten Dimensionen neu berechnet (re-use `computeOverallScore`,
 * keine Drift gegenüber 1.28-Logic).
 *
 * Missing-Data-Policy: pro Dimension müssen mindestens 50% der Member-PRs
 * einen non-null Wert beitragen, sonst wird die Dimension auf `null` gesetzt
 * und im `missingData`-Array dokumentiert. Wenn alle 5 Dimensionen `null`
 * sind, fehlt `overall` komplett (`missingDimensions` listet alle 5).
 */

/** Mindest-Coverage damit eine Dimension als gültig zählt. */
export const COVERAGE_THRESHOLD = 0.5;

export interface RegionMember {
	readonly planungsraumId: string;
	readonly areaM2: number;
}

export interface RegionMembership {
	readonly regionSlug: string;
	readonly members: readonly RegionMember[];
}

export interface AggregatedRegionScore {
	readonly regionSlug: string;
	readonly score: KiezScore;
	readonly memberCount: number;
}

function pickDimension(score: KiezScore, dim: KiezScoreDimension): DimensionScore | undefined {
	return score.dimensions.find((d) => d.dimension === dim);
}

interface DimensionAggregate {
	readonly value: number | null;
	readonly contributingMembers: number;
	readonly totalMembers: number;
	readonly coverage: number;
}

function aggregateDimension(
	dim: KiezScoreDimension,
	members: readonly RegionMember[],
	scores: Readonly<Record<string, KiezScore>>
): DimensionAggregate {
	let weightedSum = 0;
	let weightTotal = 0;
	let contributing = 0;
	for (const m of members) {
		const score = scores[m.planungsraumId];
		if (!score) continue;
		const ds = pickDimension(score, dim);
		if (!ds || ds.value === null) continue;
		if (m.areaM2 <= 0) continue;
		weightedSum += ds.value * m.areaM2;
		weightTotal += m.areaM2;
		contributing += 1;
	}
	const totalMembers = members.length;
	const coverage = totalMembers === 0 ? 0 : contributing / totalMembers;
	if (coverage < COVERAGE_THRESHOLD || weightTotal === 0) {
		return { value: null, contributingMembers: contributing, totalMembers, coverage };
	}
	// Auf eine Nachkommastelle runden (gleiche Konvention wie 1.28 weightedAverage).
	const raw = weightedSum / weightTotal;
	return {
		value: Math.round(raw * 10) / 10,
		contributingMembers: contributing,
		totalMembers,
		coverage
	};
}

export function aggregateScoresToRegion(
	scores: Readonly<Record<string, KiezScore>>,
	memberships: readonly RegionMembership[]
): AggregatedRegionScore[] {
	const results: AggregatedRegionScore[] = [];
	for (const membership of memberships) {
		if (membership.members.length === 0) {
			throw new Error(`region ${membership.regionSlug} has no members`);
		}
		const dimensions: DimensionScore[] = [];
		const missingDimensions: KiezScoreDimension[] = [];
		for (const dim of KIEZ_SCORE_DIMENSIONS) {
			const agg = aggregateDimension(dim, membership.members, scores);
			const missingData: string[] = [];
			if (agg.value === null) {
				missingData.push(
					`coverage:${agg.contributingMembers}/${agg.totalMembers}-below-${COVERAGE_THRESHOLD * 100}%-threshold`
				);
				missingDimensions.push(dim);
			}
			dimensions.push({
				dimension: dim,
				value: agg.value,
				sources: [],
				missingData,
				dataStand: null
			});
		}
		const overall = computeOverallScore(dimensions);
		const score: KiezScore = {
			persona: 'allgemein',
			dimensions,
			missingDimensions
		};
		if (overall !== null) score.overall = overall;
		results.push({
			regionSlug: membership.regionSlug,
			score,
			memberCount: membership.members.length
		});
	}
	return results;
}
