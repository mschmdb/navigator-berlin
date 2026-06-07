import { describe, it, expect } from 'vitest';
import { rankBy, quartileOf, type RankInput } from './ranking.js';

describe('quartileOf', () => {
	it('maps rank position to quartile 1..4 (1 = best quarter)', () => {
		// total 4 → je Rang ein Quartil
		expect(quartileOf(1, 4)).toBe(1);
		expect(quartileOf(2, 4)).toBe(2);
		expect(quartileOf(3, 4)).toBe(3);
		expect(quartileOf(4, 4)).toBe(4);
	});

	it('buckets 143 ranks into 4 quartiles', () => {
		expect(quartileOf(1, 143)).toBe(1); // best
		expect(quartileOf(36, 143)).toBe(1); // 36/143 = 0.25 → Q1
		expect(quartileOf(37, 143)).toBe(2);
		expect(quartileOf(143, 143)).toBe(4); // worst
	});

	it('returns null for null rank or non-positive total', () => {
		expect(quartileOf(null, 143)).toBeNull();
		expect(quartileOf(1, 0)).toBeNull();
	});
});

describe('rankBy', () => {
	const items: RankInput[] = [
		{ slug: 'a', value: 10 },
		{ slug: 'b', value: 30 },
		{ slug: 'c', value: 20 }
	];

	it('ranks higher-better: highest value = rank 1', () => {
		const out = rankBy(items, 'higher-better');
		const byslug = Object.fromEntries(out.map((r) => [r.slug, r]));
		expect(byslug.b.rang).toBe(1);
		expect(byslug.c.rang).toBe(2);
		expect(byslug.a.rang).toBe(3);
		expect(byslug.b.total).toBe(3);
	});

	it('ranks lower-better: lowest value = rank 1 (inverted metrics like PET/Lärm)', () => {
		const out = rankBy(items, 'lower-better');
		const byslug = Object.fromEntries(out.map((r) => [r.slug, r]));
		expect(byslug.a.rang).toBe(1);
		expect(byslug.c.rang).toBe(2);
		expect(byslug.b.rang).toBe(3);
	});

	it('dense-ranks ties to the same rank', () => {
		const tied: RankInput[] = [
			{ slug: 'a', value: 10 },
			{ slug: 'b', value: 10 },
			{ slug: 'c', value: 5 }
		];
		const out = rankBy(tied, 'higher-better');
		const byslug = Object.fromEntries(out.map((r) => [r.slug, r]));
		expect(byslug.a.rang).toBe(1);
		expect(byslug.b.rang).toBe(1);
		expect(byslug.c.rang).toBe(2);
	});

	it('excludes null values from ranking (rang/quartil null, total only counts non-null)', () => {
		const withNull: RankInput[] = [
			{ slug: 'a', value: 10 },
			{ slug: 'b', value: null },
			{ slug: 'c', value: 20 }
		];
		const out = rankBy(withNull, 'higher-better');
		const byslug = Object.fromEntries(out.map((r) => [r.slug, r]));
		expect(byslug.b.rang).toBeNull();
		expect(byslug.b.quartil).toBeNull();
		expect(byslug.c.rang).toBe(1);
		expect(byslug.a.rang).toBe(2);
		expect(byslug.c.total).toBe(2); // null nicht mitgezählt
	});

	it('does not crash on empty input', () => {
		expect(rankBy([], 'higher-better')).toEqual([]);
	});

	it('attaches quartile to each ranked item', () => {
		const out = rankBy(items, 'higher-better');
		const byslug = Object.fromEntries(out.map((r) => [r.slug, r]));
		// 3 Items: b rang1 → Q1, a rang3 → Q3 (Q4 erst ab total>=4 für den letzten)
		expect(byslug.b.quartil).toBe(1);
		expect(byslug.a.quartil).toBe(3);
	});
});
