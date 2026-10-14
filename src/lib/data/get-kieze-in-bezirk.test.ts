import { describe, it, expect } from 'vitest';
import { buildKiezeInBezirk, pickSiblings, type KiezRef } from './get-kieze-in-bezirk.js';

const fc = {
	features: [
		{ properties: { BZR_NAME: 'Buchholz', BEZ: '03' } },
		{ properties: { BZR_NAME: 'Karlshorst', BEZ: '11' } },
		{ properties: { BZR_NAME: 'Prenzlauer Berg', BEZ: '03' } },
		{ properties: { BZR_NAME: 'Pankow Zentrum', BEZ: '03' } },
		{ properties: { BZR_NAME: 'Friedrichshain', BEZ: '02' } }
	]
};

const codeMap = new Map([
	['03', 'pankow'],
	['11', 'lichtenberg'],
	['02', 'friedrichshain-kreuzberg']
]);

describe('buildKiezeInBezirk', () => {
	it('filtert Kieze des passenden Bezirks', () => {
		const refs = buildKiezeInBezirk({
			lorFeatureCollection: fc,
			bezirkCodeToSlug: codeMap,
			scores: new Map(),
			bezirkSlug: 'pankow'
		});
		expect(refs.map((r) => r.name)).toEqual(['Buchholz', 'Pankow Zentrum', 'Prenzlauer Berg']);
	});

	it('sortiert nach composite desc wenn scores vorhanden', () => {
		const refs = buildKiezeInBezirk({
			lorFeatureCollection: fc,
			bezirkCodeToSlug: codeMap,
			scores: new Map([
				['buchholz', 42],
				['prenzlauer-berg', 78],
				['pankow-zentrum', 55]
			]),
			bezirkSlug: 'pankow'
		});
		expect(refs.map((r) => r.name)).toEqual(['Prenzlauer Berg', 'Pankow Zentrum', 'Buchholz']);
	});

	it('fallback alphabetisch wenn keine scores', () => {
		const refs = buildKiezeInBezirk({
			lorFeatureCollection: fc,
			bezirkCodeToSlug: codeMap,
			scores: new Map(),
			bezirkSlug: 'pankow'
		});
		expect(refs[0].composite).toBeNull();
		expect(refs.map((r) => r.name)).toEqual(['Buchholz', 'Pankow Zentrum', 'Prenzlauer Berg']);
	});

	it('mischt scored + unscored: scored zuerst desc', () => {
		const refs = buildKiezeInBezirk({
			lorFeatureCollection: fc,
			bezirkCodeToSlug: codeMap,
			scores: new Map([['prenzlauer-berg', 78]]),
			bezirkSlug: 'pankow'
		});
		expect(refs[0].name).toBe('Prenzlauer Berg');
		expect(refs[0].composite).toBe(78);
		expect(refs.slice(1).map((r) => r.composite)).toEqual([null, null]);
	});

	it('leere Liste bei unbekanntem Bezirk', () => {
		const refs = buildKiezeInBezirk({
			lorFeatureCollection: fc,
			bezirkCodeToSlug: codeMap,
			scores: new Map(),
			bezirkSlug: 'mitte'
		});
		expect(refs).toEqual([]);
	});

	it('skipt Features ohne BZR_NAME oder BEZ', () => {
		const refs = buildKiezeInBezirk({
			lorFeatureCollection: {
				features: [
					{ properties: { BEZ: '03' } },
					{ properties: { BZR_NAME: 'NoCode' } },
					{ properties: { BZR_NAME: 'Buchholz', BEZ: '03' } }
				]
			},
			bezirkCodeToSlug: codeMap,
			scores: new Map(),
			bezirkSlug: 'pankow'
		});
		expect(refs.map((r) => r.name)).toEqual(['Buchholz']);
	});
});

describe('pickSiblings', () => {
	const kieze: KiezRef[] = [
		{ slug: 'buchholz', name: 'Buchholz', composite: 42 },
		{ slug: 'pankow-zentrum', name: 'Pankow Zentrum', composite: 55 },
		{ slug: 'prenzlauer-berg', name: 'Prenzlauer Berg', composite: 78 }
	];

	it('exkludiert current + alphabetisch sortiert', () => {
		const siblings = pickSiblings({ kieze, currentSlug: 'pankow-zentrum' }, 3);
		expect(siblings.map((k) => k.slug)).toEqual(['buchholz', 'prenzlauer-berg']);
	});

	it('respektiert max-N', () => {
		const siblings = pickSiblings({ kieze, currentSlug: 'buchholz' }, 1);
		expect(siblings).toHaveLength(1);
		expect(siblings[0].slug).toBe('pankow-zentrum');
	});
});

describe('buildKiezeInBezirk Slug-Disambiguierung', () => {
	const dupFc = {
		features: [
			{ properties: { BZR_NAME: 'Heerstraße', BEZ: '05' } },
			{ properties: { BZR_NAME: 'Heerstraße', BEZ: '04' } },
			{ properties: { BZR_NAME: 'Charlottenburg Nord', BEZ: '04' } }
		]
	};
	const dupCodes = new Map([
		['05', 'spandau'],
		['04', 'charlottenburg-wilmersdorf']
	]);

	it('suffigiert Duplikatnamen Berlin-weit mit dem Bezirk-Slug', () => {
		const spandau = buildKiezeInBezirk({
			lorFeatureCollection: dupFc,
			bezirkCodeToSlug: dupCodes,
			scores: new Map(),
			bezirkSlug: 'spandau'
		});
		expect(spandau.map((r) => r.slug)).toEqual(['heerstrasse-spandau']);
		const cw = buildKiezeInBezirk({
			lorFeatureCollection: dupFc,
			bezirkCodeToSlug: dupCodes,
			scores: new Map(),
			bezirkSlug: 'charlottenburg-wilmersdorf'
		});
		expect(cw.map((r) => r.slug).sort()).toEqual([
			'charlottenburg-nord',
			'heerstrasse-charlottenburg-wilmersdorf'
		]);
	});

	it('findet den Score über den suffigierten Slug', () => {
		const refs = buildKiezeInBezirk({
			lorFeatureCollection: dupFc,
			bezirkCodeToSlug: dupCodes,
			scores: new Map([['heerstrasse-spandau', 61]]),
			bezirkSlug: 'spandau'
		});
		expect(refs[0].composite).toBe(61);
	});

	it('lässt fehlende Scores null', () => {
		const refs = buildKiezeInBezirk({
			lorFeatureCollection: dupFc,
			bezirkCodeToSlug: dupCodes,
			scores: new Map([['heerstrasse', 99]]),
			bezirkSlug: 'spandau'
		});
		expect(refs[0].composite).toBeNull();
	});
});
