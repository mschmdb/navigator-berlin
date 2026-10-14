import { describe, expect, it } from 'vitest';
import { buildBezirkKiezeView, buildKiezContext } from './bezirk-kieze-view.js';

const poly = (x: number, y: number) => ({
	type: 'Polygon',
	coordinates: [
		[
			[x, y],
			[x + 0.01, y],
			[x + 0.01, y + 0.01],
			[x, y + 0.01],
			[x, y]
		]
	]
});

const lor = {
	features: [
		{ properties: { BZR_NAME: 'Heerstraße', BEZ: '05' }, geometry: poly(13.1, 52.5) },
		{ properties: { BZR_NAME: 'Heerstraße', BEZ: '04' }, geometry: poly(13.2, 52.5) },
		{ properties: { BZR_NAME: 'Wilhelmstadt', BEZ: '05' }, geometry: poly(13.15, 52.52) },
		{ properties: { BZR_NAME: 'Albrechtshof', BEZ: '05' }, geometry: poly(13.12, 52.54) },
		{ properties: { BZR_NAME: 'Fremd', BEZ: '01' }, geometry: poly(13.4, 52.5) }
	]
};
const codes = new Map([
	['05', 'spandau'],
	['04', 'charlottenburg-wilmersdorf'],
	['01', 'mitte']
]);

function view(overrides: {
	scores?: Map<string, number>;
	ranks?: Map<string, { rang: number | null; quartil: number | null; total: number }>;
	bezirkSlug?: string;
}) {
	return buildBezirkKiezeView({
		lorFeatureCollection: lor,
		bezirkCodeToSlug: codes,
		scores: overrides.scores ?? new Map(),
		ranks: overrides.ranks ?? new Map(),
		bezirkSlug: overrides.bezirkSlug ?? 'spandau'
	});
}

describe('buildBezirkKiezeView', () => {
	it('liefert ohne Scores alle Kieze alphabetisch ohne Rang', () => {
		const v = view({});
		expect(v.kieze.map((k) => k.name)).toEqual(['Albrechtshof', 'Heerstraße', 'Wilhelmstadt']);
		expect(v.kieze.every((k) => k.rang === null && k.composite === null)).toBe(true);
	});

	it('nutzt disambiguierte Slugs bei Dubletten', () => {
		const v = view({});
		expect(v.kieze.map((k) => k.slug)).toContain('heerstrasse-spandau');
		expect(v.outline?.paths.map((p) => p.id)).toContain('heerstrasse-spandau');
	});

	it('hängt Rang und Quartil an und sortiert Score absteigend, ohne Score am Ende', () => {
		const v = view({
			scores: new Map([
				['wilhelmstadt', 70],
				['albrechtshof', 40]
			]),
			ranks: new Map([['wilhelmstadt', { rang: 12, quartil: 1, total: 143 }]])
		});
		expect(v.kieze.map((k) => k.slug)).toEqual([
			'wilhelmstadt',
			'albrechtshof',
			'heerstrasse-spandau'
		]);
		expect(v.kieze[0]).toMatchObject({ rang: 12, quartil: 1, total: 143 });
		expect(v.kieze[1]).toMatchObject({ rang: null, quartil: null, total: 0 });
	});

	it('enthält nur Kieze des Bezirks im Umriss', () => {
		expect(view({}).outline?.paths).toHaveLength(3);
	});

	it('liefert leere Liste und keinen Umriss für unbekannten Bezirk', () => {
		const v = view({ bezirkSlug: 'nirgends' });
		expect(v.kieze).toEqual([]);
		expect(v.outline).toBeNull();
	});
});

describe('buildKiezContext', () => {
	const input = {
		lorFeatureCollection: lor,
		bezirkCodeToSlug: codes,
		scores: new Map<string, number>(),
		bezirkSlug: 'spandau'
	};

	it('liefert alle Kieze des Bezirks und den gemeinsamen Umriss', () => {
		const ctx = buildKiezContext(input);
		expect(ctx.kieze.map((k) => k.slug).sort()).toEqual([
			'albrechtshof',
			'heerstrasse-spandau',
			'wilhelmstadt'
		]);
		expect(ctx.outline?.paths.map((p) => p.id).sort()).toEqual([
			'albrechtshof',
			'heerstrasse-spandau',
			'wilhelmstadt'
		]);
	});

	it('liefert für die Dublette den Umriss im Bezirk Spandau', () => {
		const ctx = buildKiezContext(input);
		expect(ctx.outline?.paths.find((p) => p.id === 'heerstrasse-spandau')).toBeDefined();
		expect(ctx.outline?.paths).toHaveLength(3);
	});

	it('liefert leere Liste und keinen Umriss für unbekannten Bezirk', () => {
		const ctx = buildKiezContext({ ...input, bezirkSlug: 'nirgends' });
		expect(ctx.kieze).toEqual([]);
		expect(ctx.outline).toBeNull();
	});
});
