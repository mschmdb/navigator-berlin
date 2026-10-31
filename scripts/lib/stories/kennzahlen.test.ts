import { describe, expect, it } from 'vitest';
import {
	aggregateKennzahlen,
	buildKennzahlen,
	ordinalScore,
	weightedMean,
	type PlrKennzahlInput
} from './kennzahlen.js';

function plr(over: Partial<PlrKennzahlInput> = {}): PlrKennzahlInput {
	return {
		plrId: '01100101',
		kiezSlug: 'mitte',
		bezirkSlug: 'mitte',
		einwohner: 1000,
		flaecheM2: 1_000_000,
		laermDb: 60,
		laermCount: 10,
		altbauAnteil: 50,
		wohnungen: 100,
		bioklima: 'hoch',
		gruen: 'gut',
		clubs: 1,
		gehweiteEinwohner: 1000,
		gehweiteMitHaltestelle: 900,
		...over
	};
}

describe('weightedMean', () => {
	it('gewichtet den Mittelwert', () => {
		expect(
			weightedMean([
				{ value: 10, weight: 1 },
				{ value: 20, weight: 3 }
			])
		).toBe(17.5);
	});
	it('liefert null bei Gewicht 0', () => {
		expect(weightedMean([{ value: 10, weight: 0 }])).toBeNull();
	});
	it('ignoriert null-Werte und null-Gewichte', () => {
		expect(
			weightedMean([
				{ value: null, weight: 5 },
				{ value: 4, weight: null },
				{ value: 8, weight: 2 }
			])
		).toBe(8);
	});
	it('liefert null bei leerer Liste und bei nur null-Werten', () => {
		expect(weightedMean([])).toBeNull();
		expect(weightedMean([{ value: null, weight: 1 }])).toBeNull();
	});
});

describe('ordinalScore', () => {
	it('mappt Kategorien', () => {
		expect(ordinalScore('hoch', { hoch: 1, mittel: 0.5, gering: 0 })).toBe(1);
		expect(ordinalScore('mittel', { hoch: 1, mittel: 0.5, gering: 0 })).toBe(0.5);
		expect(ordinalScore('gering', { hoch: 1, mittel: 0.5, gering: 0 })).toBe(0);
	});
	it('liefert null bei unbekannter oder fehlender Kategorie', () => {
		expect(ordinalScore(null, { gut: 1 })).toBeNull();
		expect(ordinalScore('xyz', { gut: 1 })).toBeNull();
	});
});

describe('aggregateKennzahlen', () => {
	it('rechnet alle Kennzahlen einer Gruppe', () => {
		const k = aggregateKennzahlen([
			plr(),
			plr({
				plrId: '2',
				einwohner: 3000,
				flaecheM2: 1_000_000,
				laermDb: 70,
				laermCount: 30,
				altbauAnteil: 10,
				wohnungen: 300,
				bioklima: 'gering',
				gruen: 'schlecht',
				clubs: 2,
				gehweiteEinwohner: 3000,
				gehweiteMitHaltestelle: 1000
			})
		]);
		expect(k.bewohner).toBe(4000);
		expect(k.bewohnerProKm2).toBe(2000);
		expect(k.laermDb).toBe(67.5);
		expect(k.altbauAnteil).toBe(0.2);
		expect(k.hitze).toBe(0.5);
		expect(k.gruen).toBe(0.5);
		expect(k.clubs).toBe(3);
		expect(k.haltestelle400mAnteil).toBe(0.475);
	});

	it('liefert null statt Ersatzwerten, clubs bleibt 0', () => {
		const k = aggregateKennzahlen([
			plr({
				einwohner: null,
				flaecheM2: null,
				laermDb: null,
				altbauAnteil: null,
				bioklima: null,
				gruen: null,
				clubs: 0,
				gehweiteEinwohner: null,
				gehweiteMitHaltestelle: null
			})
		]);
		expect(k).toEqual({
			bewohner: null,
			bewohnerProKm2: null,
			laermDb: null,
			altbauAnteil: null,
			hitze: null,
			gruen: null,
			clubs: 0,
			haltestelle400mAnteil: null
		});
	});

	it('behandelt einen leeren Kiez', () => {
		const k = aggregateKennzahlen([]);
		expect(k.bewohner).toBeNull();
		expect(k.clubs).toBe(0);
	});

	it('liefert null bei Gitter-Einwohnern 0', () => {
		const k = aggregateKennzahlen([plr({ gehweiteEinwohner: 0, gehweiteMitHaltestelle: 0 })]);
		expect(k.haltestelle400mAnteil).toBeNull();
	});

	it('rechnet Dichte nur aus PLR mit Einwohnern und Fläche', () => {
		const k = aggregateKennzahlen([
			plr({ einwohner: 1000, flaecheM2: 500_000 }),
			plr({ einwohner: 5000, flaecheM2: null })
		]);
		expect(k.bewohnerProKm2).toBe(2000);
		expect(k.bewohner).toBe(6000);
	});

	it('gewichtet Hitze mit der Fläche', () => {
		const k = aggregateKennzahlen([
			plr({ flaecheM2: 3_000_000, bioklima: 'hoch' }),
			plr({ flaecheM2: 1_000_000, bioklima: 'gering' })
		]);
		expect(k.hitze).toBe(0.75);
	});
});

describe('buildKennzahlen', () => {
	it('gruppiert nach Kiez und Bezirk, sortiert, und zählt Planungsräume ohne Kiez', () => {
		const res = buildKennzahlen([
			plr({ plrId: 'b', kiezSlug: 'zzz', bezirkSlug: 'pankow' }),
			plr({ plrId: 'a', kiezSlug: 'aaa', bezirkSlug: 'mitte' }),
			plr({ plrId: 'c', kiezSlug: 'aaa', bezirkSlug: 'mitte' }),
			plr({ plrId: 'd', kiezSlug: '', bezirkSlug: 'mitte' })
		]);
		expect(res.kieze.map((k) => k.slug)).toEqual(['aaa', 'zzz']);
		expect(res.kieze[0].bezirkSlug).toBe('mitte');
		expect(res.kieze[0].bewohner).toBe(2000);
		expect(res.bezirke.map((b) => b.slug)).toEqual(['mitte', 'pankow']);
		expect(res.bezirke[0].bewohner).toBe(2000);
		expect(res.ohneKiez).toBe(1);
	});

	it('wirft, wenn ein Kiez in zwei Bezirken liegt', () => {
		expect(() =>
			buildKennzahlen([
				plr({ plrId: 'a', kiezSlug: 'x', bezirkSlug: 'mitte' }),
				plr({ plrId: 'b', kiezSlug: 'x', bezirkSlug: 'pankow' })
			])
		).toThrow(/x/);
	});
});
