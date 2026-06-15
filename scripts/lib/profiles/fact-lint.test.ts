import { describe, it, expect } from 'vitest';
import { extractNumbers, factLint } from './fact-lint.js';
import type { ProfileInput } from './input.js';

const INPUT: ProfileInput = {
	pageType: 'kiez',
	slug: 'test',
	name: 'Test',
	bezirk: 'Mitte',
	einwohner: null,
	flaecheHa: null,
	composite: { score: 51.1, rang: 19, total: 143 },
	dims: [
		{ label: 'Mobilität', score: 54.7, rang: 2, total: 143, bezirkMean: 38.2, berlinMedian: 21.8 }
	],
	facts: { petGrad: 36.8, oepnvStopsProKm2: 27.9 }
};

describe('extractNumbers', () => {
	it('liest Dezimal-Komma und Ganzzahlen', () => {
		expect(extractNumbers('Rang 2 von 143, 36,8 Grad')).toEqual([2, 143, 36.8]);
	});
});

describe('factLint', () => {
	it('akzeptiert gedeckte Zahlen inkl. ganzzahliger Rundung', () => {
		const r = factLint('Rang 2 von 143, fast 28 Haltestellen, knapp 37 Grad.', INPUT);
		// 28 = round(27.9), 37 = round(36.8) → gedeckt
		expect(r.ok).toBe(true);
		expect(r.unbackedNumbers).toEqual([]);
	});

	it('exakte Datenwerte sind gedeckt', () => {
		expect(factLint('Score 54,7 auf Rang 2.', INPUT).ok).toBe(true);
	});

	it('flaggt erfundene Zahl', () => {
		const r = factLint('Hier leben 12000 Menschen auf Rang 2.', INPUT);
		expect(r.ok).toBe(false);
		expect(r.unbackedNumbers).toContain(12000);
	});

	it('flaggt Gedankenstrich', () => {
		const r = factLint('Mobilität top — Lärm hoch.', INPUT);
		expect(r.ok).toBe(false);
		expect(r.hasDash).toBe(true);
	});
});

describe('factLint Stigma-Schutz (Story 14.8, ADR-019)', () => {
	it('flaggt Kriminalitäts-/Sicherheits-Aussagen', () => {
		expect(factLint('In diesem Kiez ist die Kriminalität hoch.', INPUT).ok).toBe(false);
		expect(factLint('Eine eher gefährliche Gegend.', INPUT).ok).toBe(false);
		expect(factLint('Ein sicherer Kiez zum Wohnen.', INPUT).ok).toBe(false);
		expect(factLint('Viele Einbrüche und Verbrechen.', INPUT).ok).toBe(false);
	});

	it('listet die gefundenen Stigma-Begriffe', () => {
		const r = factLint('Die Kriminalität ist gefährlich hoch.', INPUT);
		expect(r.stigmaHits.length).toBeGreaterThan(0);
	});

	it('lässt neutrale Lebensqualitäts-Prosa durch', () => {
		const r = factLint('Ruhige Lage mit guter Grünversorgung auf Rang 2.', INPUT);
		expect(r.ok).toBe(true);
		expect(r.stigmaHits).toEqual([]);
	});
});
