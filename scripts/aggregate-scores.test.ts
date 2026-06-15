import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { aggregateScoresFromSources } from './aggregate-scores.js';
import type { ScoreRow } from './aggregate-scores.js';

function stableHash(rows: readonly ScoreRow[]): string {
	const sorted = [...rows].sort((a, b) => a.slug.localeCompare(b.slug));
	const canonical = JSON.stringify(sorted);
	return createHash('sha256').update(canonical).digest('hex');
}

describe('aggregate-scores orchestrator (Story 2.9a, AC-3 + AC-4)', () => {
	it('produces 12 bezirk rows + 143 kiez rows from real fixtures', async () => {
		const { bezirke, kieze } = await aggregateScoresFromSources();
		expect(bezirke).toHaveLength(12);
		expect(kieze).toHaveLength(143);
	}, 60_000);

	it('is deterministic across two consecutive runs (no random ordering, no clock-dep)', async () => {
		const a = await aggregateScoresFromSources();
		const b = await aggregateScoresFromSources();
		expect(stableHash(a.bezirke)).toBe(stableHash(b.bezirke));
		expect(stableHash(a.kieze)).toBe(stableHash(b.kieze));
	}, 120_000);

	it('every kiez row references a known bezirk slug', async () => {
		const { bezirke, kieze } = await aggregateScoresFromSources();
		const bezSlugs = new Set(bezirke.map((b) => b.slug));
		for (const k of kieze) {
			expect(bezSlugs).toContain(k.bezirkSlug);
		}
	}, 60_000);

	it('composite is a finite number for at least 11 of 12 bezirke (>50% coverage realistic)', async () => {
		const { bezirke } = await aggregateScoresFromSources();
		const usable = bezirke.filter(
			(b) => typeof b.composite === 'number' && Number.isFinite(b.composite)
		);
		expect(usable.length).toBeGreaterThanOrEqual(11);
	}, 60_000);

	it('respects 0..100 range on composite + per-dimension fields', async () => {
		const { bezirke, kieze } = await aggregateScoresFromSources();
		for (const row of [...bezirke, ...kieze]) {
			for (const key of [
				'composite',
				'ruheLuft',
				'gruenHitze',
				'mobilitaet',
				'versorgung',
				'wohnschutz'
			] as const) {
				const v = row[key];
				if (v === null) continue;
				expect(v).toBeGreaterThanOrEqual(0);
				expect(v).toBeLessThanOrEqual(100);
			}
		}
	}, 60_000);
});
