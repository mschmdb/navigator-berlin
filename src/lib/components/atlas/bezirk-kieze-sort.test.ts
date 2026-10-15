import { describe, expect, it } from 'vitest';
import {
	ariaSortFor,
	initialSortState,
	nextSortState,
	sortKiezEntries
} from './bezirk-kieze-sort.js';
import type { KiezListEntry } from '$lib/data/bezirk-kieze-view.js';

const e = (name: string, composite: number | null): KiezListEntry => ({
	slug: name.toLowerCase(),
	name,
	composite,
	rang: null,
	quartil: null,
	total: 0
});

const entries = [e('Cäcilie', 50), e('Anna', null), e('Berta', 80), e('Zora', 50), e('Ärger', 10)];

describe('sortKiezEntries', () => {
	it('sortiert Score absteigend, ohne Score am Ende, Gleichstand nach Name', () => {
		const out = sortKiezEntries(entries, { key: 'score', direction: 'desc' });
		expect(out.map((k) => k.name)).toEqual(['Berta', 'Cäcilie', 'Zora', 'Ärger', 'Anna']);
	});

	it('sortiert Score aufsteigend und hält Kieze ohne Score am Ende', () => {
		const out = sortKiezEntries(entries, { key: 'score', direction: 'asc' });
		expect(out.map((k) => k.name)).toEqual(['Ärger', 'Cäcilie', 'Zora', 'Berta', 'Anna']);
	});

	it('sortiert Namen deutsch alphabetisch', () => {
		const out = sortKiezEntries(entries, { key: 'name', direction: 'asc' });
		expect(out.map((k) => k.name)).toEqual(['Anna', 'Ärger', 'Berta', 'Cäcilie', 'Zora']);
	});

	it('sortiert Namen absteigend', () => {
		const out = sortKiezEntries(entries, { key: 'name', direction: 'desc' });
		expect(out[0].name).toBe('Zora');
	});

	it('verändert die Eingabe nicht', () => {
		const copy = [...entries];
		sortKiezEntries(entries, { key: 'name', direction: 'asc' });
		expect(entries).toEqual(copy);
	});

	it('verträgt eine leere Liste', () => {
		expect(sortKiezEntries([], { key: 'score', direction: 'desc' })).toEqual([]);
	});
});

describe('Sortierzustand', () => {
	it('startet mit Score absteigend, ohne Scores mit Name aufsteigend', () => {
		expect(initialSortState(true)).toEqual({ key: 'score', direction: 'desc' });
		expect(initialSortState(false)).toEqual({ key: 'name', direction: 'asc' });
	});

	it('wechselt die Spalte mit Standardrichtung und kehrt die aktive um', () => {
		const start = initialSortState(true);
		expect(nextSortState(start, 'name')).toEqual({ key: 'name', direction: 'asc' });
		expect(nextSortState(start, 'score')).toEqual({ key: 'score', direction: 'asc' });
	});

	it('liefert aria-sort nur für die aktive Spalte', () => {
		const state = { key: 'name', direction: 'asc' } as const;
		expect(ariaSortFor(state, 'name')).toBe('ascending');
		expect(ariaSortFor(state, 'score')).toBe('none');
		expect(ariaSortFor({ key: 'score', direction: 'desc' }, 'score')).toBe('descending');
	});
});
