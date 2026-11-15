import { describe, expect, it } from 'vitest';
import { groupRanksBySlug, rankForSort } from './ranking-rank.js';

describe('groupRanksBySlug', () => {
	it('gruppiert Rang-Zeilen pro Slug und Metrik', () => {
		const out = groupRanksBySlug([
			{ slug: 'a', metricKey: 'composite', rang: 1 },
			{ slug: 'a', metricKey: 'kultur', rang: 6 },
			{ slug: 'b', metricKey: 'composite', rang: 1 }
		]);
		expect(out.get('a')).toEqual({ composite: 1, kultur: 6 });
		expect(out.get('b')).toEqual({ composite: 1 });
	});

	it('ignoriert Metriken ohne Tabellenspalte', () => {
		const out = groupRanksBySlug([
			{ slug: 'a', metricKey: 'meanPet', rang: 3 },
			{ slug: 'a', metricKey: 'ruheLuft', rang: null }
		]);
		expect(out.get('a')).toEqual({ ruheLuft: null });
	});

	it('liefert eine leere Map ohne Zeilen', () => {
		expect(groupRanksBySlug([]).size).toBe(0);
	});
});

describe('rankForSort', () => {
	const ranks = { composite: 4, kultur: 1 };

	it('zeigt den Rang der sortierten Spalte', () => {
		expect(rankForSort(ranks, 'kultur')).toBe(1);
		expect(rankForSort(ranks, 'composite')).toBe(4);
	});

	it('zeigt bei Sortierung nach Name oder Bezirk den Gesamtrang', () => {
		expect(rankForSort(ranks, 'name')).toBe(4);
		expect(rankForSort(ranks, 'bezirk')).toBe(4);
	});

	it('liefert null ohne Rang', () => {
		expect(rankForSort(ranks, 'mobilitaet')).toBeNull();
		expect(rankForSort({}, 'name')).toBeNull();
	});
});
