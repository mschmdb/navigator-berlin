import { describe, it, expect } from 'vitest';
import { computeRanks, type ScoreStatsRow } from './aggregate-ranks.js';

function row(slug: string, over: Partial<ScoreStatsRow>): ScoreStatsRow {
	return {
		slug,
		composite: null,
		ruheLuft: null,
		gruenHitze: null,
		mobilitaet: null,
		versorgung: null,
		wohnschutz: null,
		gruen: null,
		oepnv: null,
		bildung: null,
		klima: null,
		heritage: null,
		...over
	};
}

function av(value: number) {
	return { value, layer: 'test', sourceUpdatedAt: '2026-01-01' };
}

describe('computeRanks', () => {
	it('ranks composite higher-better (best = rang 1)', () => {
		const rows = [row('a', { composite: 50 }), row('b', { composite: 90 }), row('c', { composite: 70 })];
		const out = computeRanks(rows).filter((r) => r.metricKey === 'composite');
		const bySlug = Object.fromEntries(out.map((r) => [r.slug, r]));
		expect(bySlug.b.rang).toBe(1);
		expect(bySlug.c.rang).toBe(2);
		expect(bySlug.a.rang).toBe(3);
	});

	it('ranks meanPet lower-better (kühlster = rang 1)', () => {
		const rows = [
			row('hot', { klima: { meanPet: av(40), shareSehrHeiss: null } as never }),
			row('cool', { klima: { meanPet: av(28), shareSehrHeiss: null } as never })
		];
		const out = computeRanks(rows).filter((r) => r.metricKey === 'meanPet');
		const bySlug = Object.fromEntries(out.map((r) => [r.slug, r]));
		expect(bySlug.cool.rang).toBe(1);
		expect(bySlug.hot.rang).toBe(2);
	});

	it('emits null rang/quartil for missing stats values', () => {
		const rows = [
			row('x', { gruen: { gruenanlagenCount: av(5) } as never }),
			row('y', { gruen: null })
		];
		const out = computeRanks(rows).filter((r) => r.metricKey === 'gruenanlagenCount');
		const bySlug = Object.fromEntries(out.map((r) => [r.slug, r]));
		expect(bySlug.x.rang).toBe(1);
		expect(bySlug.y.rang).toBeNull();
		expect(bySlug.y.quartil).toBeNull();
		expect(bySlug.x.total).toBe(1);
	});

	it('produces an entry per metric per row', () => {
		const rows = [row('a', { composite: 1 })];
		const out = computeRanks(rows);
		// 15 Metriken pro Slug (Story 13.3: + kultur)
		expect(out.filter((r) => r.slug === 'a').length).toBe(15);
	});
});
