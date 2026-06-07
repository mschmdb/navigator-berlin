import { describe, it, expect } from 'vitest';
import {
	aggregateScoresToRegion,
	type RegionMembership
} from './aggregate-to-larger-region.js';
import type { KiezScore } from './types.js';

/**
 * Test-Fixtures bauen deterministische 1.28-Score-Outputs auf 3 LOR-Planungsräumen,
 * die zu einer LOR-Bezirksregion zusammengefasst werden.
 *
 * Aggregat-Konvention (siehe ADR-013): Flächen-gewichtetes Mittel pro Dimension.
 * `overall` wird NICHT re-aggregiert sondern neu berechnet aus den aggregierten
 * Dimensions-Werten via Compute-Score-Logic (`computeOverallScore`-Mittel).
 */

function planungsraum(
	id: string,
	values: Partial<Record<'ruhe-luft' | 'gruen-hitze' | 'mobilitaet' | 'wohnschutz' | 'versorgung', number | null>>,
	overall?: number
): KiezScore {
	const score: KiezScore = {
		persona: 'allgemein',
		dimensions: [
			{ dimension: 'ruhe-luft', value: values['ruhe-luft'] ?? null, sources: [], missingData: [], dataStand: null },
			{ dimension: 'gruen-hitze', value: values['gruen-hitze'] ?? null, sources: [], missingData: [], dataStand: null },
			{ dimension: 'mobilitaet', value: values.mobilitaet ?? null, sources: [], missingData: [], dataStand: null },
			{ dimension: 'wohnschutz', value: values['wohnschutz'] ?? null, sources: [], missingData: [], dataStand: null },
			{ dimension: 'versorgung', value: values.versorgung ?? null, sources: [], missingData: [], dataStand: null }
		],
		missingDimensions: []
	};
	if (typeof overall === 'number') score.overall = overall;
	return score;
}

function findDim(score: KiezScore, dim: string): { value: number | null } {
	const d = score.dimensions.find((x) => x.dimension === dim);
	if (!d) throw new Error(`dim ${dim} missing in score`);
	return { value: d.value };
}

describe('aggregateScoresToRegion (Story 2.9a)', () => {
	it('uses area-weighted mean per dimension across member planungsraeume', () => {
		// 3 PRs gehören zu BR "kiez-A".
		// Flächen: 1, 2, 3 (Summe 6). Gewichte normiert: 1/6, 2/6, 3/6.
		const scores: Record<string, KiezScore> = {
			P1: planungsraum('P1', { 'ruhe-luft': 60, 'gruen-hitze':40, mobilitaet: 100, 'wohnschutz': 50, versorgung: 80 }, 66),
			P2: planungsraum('P2', { 'ruhe-luft': 30, 'gruen-hitze':60, mobilitaet: 50, 'wohnschutz': 70, versorgung: 40 }, 50),
			P3: planungsraum('P3', { 'ruhe-luft': 90, 'gruen-hitze':80, mobilitaet: 25, 'wohnschutz': 30, versorgung: 60 }, 57)
		};
		const memberships: RegionMembership[] = [
			{
				regionSlug: 'kiez-a',
				members: [
					{ planungsraumId: 'P1', areaM2: 1 },
					{ planungsraumId: 'P2', areaM2: 2 },
					{ planungsraumId: 'P3', areaM2: 3 }
				]
			}
		];
		const result = aggregateScoresToRegion(scores, memberships);
		expect(result).toHaveLength(1);
		const agg = result[0]!;
		expect(agg.regionSlug).toBe('kiez-a');
		// ruhe-luft: (60*1 + 30*2 + 90*3) / 6 = (60 + 60 + 270) / 6 = 65
		expect(findDim(agg.score, 'ruhe-luft').value).toBe(65);
		// gruen-hitze: (40*1 + 60*2 + 80*3) / 6 = (40 + 120 + 240) / 6 = 66.67
		expect(findDim(agg.score, 'gruen-hitze').value).toBeCloseTo(66.7, 1);
		// wohnschutz: (50*1 + 70*2 + 30*3) / 6 = (50 + 140 + 90) / 6 = 46.67
		expect(findDim(agg.score, 'wohnschutz').value).toBeCloseTo(46.7, 1);
	});

	it('re-computes overall from aggregated dimensions, not from input overall values', () => {
		const scores: Record<string, KiezScore> = {
			P1: planungsraum('P1', { 'ruhe-luft': 100, 'gruen-hitze':100, mobilitaet: 100, 'wohnschutz': 100, versorgung: 100 }, 100),
			P2: planungsraum('P2', { 'ruhe-luft': 0, 'gruen-hitze':0, mobilitaet: 0, 'wohnschutz': 0, versorgung: 0 }, 0)
		};
		const memberships: RegionMembership[] = [
			{
				regionSlug: 'kiez-a',
				members: [
					{ planungsraumId: 'P1', areaM2: 1 },
					{ planungsraumId: 'P2', areaM2: 1 }
				]
			}
		];
		const result = aggregateScoresToRegion(scores, memberships);
		// Jede Dimension: (100*1 + 0*1) / 2 = 50
		expect(findDim(result[0]!.score, 'ruhe-luft').value).toBe(50);
		// overall = unweighted mean aller non-null dimensions = 50
		expect(result[0]!.score.overall).toBe(50);
	});

	it('ignores null dimension values in weighted mean and records missing data', () => {
		const scores: Record<string, KiezScore> = {
			P1: planungsraum('P1', { 'ruhe-luft': 80, 'gruen-hitze':null, mobilitaet: 60, 'wohnschutz': 40, versorgung: 50 }),
			P2: planungsraum('P2', { 'ruhe-luft': 40, 'gruen-hitze':60, mobilitaet: 40, 'wohnschutz': 60, versorgung: 70 })
		};
		const memberships: RegionMembership[] = [
			{
				regionSlug: 'kiez-a',
				members: [
					{ planungsraumId: 'P1', areaM2: 1 },
					{ planungsraumId: 'P2', areaM2: 1 }
				]
			}
		];
		const result = aggregateScoresToRegion(scores, memberships);
		const agg = result[0]!;
		// gruen-hitze: nur P2 zählt → 60
		expect(findDim(agg.score, 'gruen-hitze').value).toBe(60);
		// ruhe-luft: (80*1 + 40*1) / 2 = 60
		expect(findDim(agg.score, 'ruhe-luft').value).toBe(60);
	});

	it('sets dimension value to null if coverage falls below 50% threshold', () => {
		// 4 PRs, nur 1 hat ruhe-luft → 25% Coverage → null
		const scores: Record<string, KiezScore> = {
			P1: planungsraum('P1', { 'ruhe-luft': 60, 'gruen-hitze':50, mobilitaet: 50, 'wohnschutz': 50, versorgung: 50 }),
			P2: planungsraum('P2', { 'gruen-hitze':50, mobilitaet: 50, 'wohnschutz': 50, versorgung: 50 }),
			P3: planungsraum('P3', { 'gruen-hitze':50, mobilitaet: 50, 'wohnschutz': 50, versorgung: 50 }),
			P4: planungsraum('P4', { 'gruen-hitze':50, mobilitaet: 50, 'wohnschutz': 50, versorgung: 50 })
		};
		const memberships: RegionMembership[] = [
			{
				regionSlug: 'kiez-a',
				members: [
					{ planungsraumId: 'P1', areaM2: 1 },
					{ planungsraumId: 'P2', areaM2: 1 },
					{ planungsraumId: 'P3', areaM2: 1 },
					{ planungsraumId: 'P4', areaM2: 1 }
				]
			}
		];
		const result = aggregateScoresToRegion(scores, memberships);
		const agg = result[0]!;
		expect(findDim(agg.score, 'ruhe-luft').value).toBeNull();
		expect(agg.score.missingDimensions).toContain('ruhe-luft');
		// Coverage-Doku im Dimension.missingData
		const rl = agg.score.dimensions.find((d) => d.dimension === 'ruhe-luft');
		expect(rl?.missingData.some((m) => m.includes('coverage'))).toBe(true);
	});

	it('respects 50% threshold exactly (>=50% inclusive)', () => {
		// 2 von 4 = 50% → IST genug
		const scores: Record<string, KiezScore> = {
			P1: planungsraum('P1', { 'ruhe-luft': 40, 'gruen-hitze':50, mobilitaet: 50, 'wohnschutz': 50, versorgung: 50 }),
			P2: planungsraum('P2', { 'ruhe-luft': 60, 'gruen-hitze':50, mobilitaet: 50, 'wohnschutz': 50, versorgung: 50 }),
			P3: planungsraum('P3', { 'gruen-hitze':50, mobilitaet: 50, 'wohnschutz': 50, versorgung: 50 }),
			P4: planungsraum('P4', { 'gruen-hitze':50, mobilitaet: 50, 'wohnschutz': 50, versorgung: 50 })
		};
		const memberships: RegionMembership[] = [
			{
				regionSlug: 'kiez-a',
				members: [
					{ planungsraumId: 'P1', areaM2: 1 },
					{ planungsraumId: 'P2', areaM2: 1 },
					{ planungsraumId: 'P3', areaM2: 1 },
					{ planungsraumId: 'P4', areaM2: 1 }
				]
			}
		];
		const result = aggregateScoresToRegion(scores, memberships);
		const agg = result[0]!;
		expect(findDim(agg.score, 'ruhe-luft').value).toBe(50);
	});

	it('sets all dimensions null + overall null when no members have scores', () => {
		const memberships: RegionMembership[] = [
			{ regionSlug: 'empty-kiez', members: [{ planungsraumId: 'PX', areaM2: 100 }] }
		];
		const result = aggregateScoresToRegion({}, memberships);
		const agg = result[0]!;
		expect(agg.score.overall).toBeUndefined();
		expect(agg.score.missingDimensions).toHaveLength(6);
	});

	it('throws if region has no members', () => {
		expect(() =>
			aggregateScoresToRegion({}, [{ regionSlug: 'kiez-a', members: [] }])
		).toThrow(/no members/);
	});

	it('produces stable output for two runs (idempotent)', () => {
		const scores: Record<string, KiezScore> = {
			P1: planungsraum('P1', { 'ruhe-luft': 60, 'gruen-hitze':40, mobilitaet: 100, 'wohnschutz': 50, versorgung: 80 }),
			P2: planungsraum('P2', { 'ruhe-luft': 30, 'gruen-hitze':60, mobilitaet: 50, 'wohnschutz': 70, versorgung: 40 })
		};
		const memberships: RegionMembership[] = [
			{ regionSlug: 'kiez-a', members: [{ planungsraumId: 'P1', areaM2: 1 }, { planungsraumId: 'P2', areaM2: 2 }] }
		];
		const a = aggregateScoresToRegion(scores, memberships);
		const b = aggregateScoresToRegion(scores, memberships);
		expect(JSON.stringify(a)).toBe(JSON.stringify(b));
	});
});
