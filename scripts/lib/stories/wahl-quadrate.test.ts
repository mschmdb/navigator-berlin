import { describe, expect, it } from 'vitest';
import type { WahlMeta } from '../../../src/lib/stories/wahl-quadrate/types.js';
import { buildStoriesWahl, sumBerlin, sumByBezirk, type ZweitstimmenRow } from './wahl-quadrate.js';

const row = (
	bezirkCode: string,
	votes: Record<string, number>,
	wahlberechtigte = 100,
	waehlende = 60
): ZweitstimmenRow => {
	const list = Object.entries(votes).map(([parteiKurzname, stimmen]) => ({
		parteiKurzname,
		stimmen
	}));
	return {
		bezirkCode,
		wahlberechtigte,
		waehlende,
		gueltig: list.reduce((s, v) => s + v.stimmen, 0),
		votes: list
	};
};

const ALL_CODES = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];

describe('sumByBezirk', () => {
	it('summiert Stimmen, Gültige, Wahlberechtigte und Wählende je Bezirk', () => {
		const result = sumByBezirk([
			row('01', { SPD: 30, CDU: 20 }, 100, 60),
			row('01', { SPD: 10, FDP: 2 }, 0, 15),
			row('02', { GRÜNE: 5 }, 10, 6)
		]);
		const mitte = result.get('01');
		expect(mitte?.gueltig).toBe(62);
		expect(mitte?.wahlberechtigte).toBe(100);
		expect(mitte?.waehlende).toBe(75);
		expect(mitte?.wahlbeteiligung).toBeCloseTo(0.75);
		expect(mitte?.parteien).toEqual([
			{ kurzname: 'SPD', stimmen: 40, anteil: 40 / 62 },
			{ kurzname: 'CDU', stimmen: 20, anteil: 20 / 62 },
			{ kurzname: 'FDP', stimmen: 2, anteil: 2 / 62 }
		]);
		expect(result.get('02')?.parteien).toEqual([{ kurzname: 'GRÜNE', stimmen: 5, anteil: 1 }]);
	});

	it('fasst kleine Parteien nicht zu Sonstige zusammen', () => {
		const result = sumByBezirk([row('01', { SPD: 970, FDP: 10, 'FREIE WÄHLER': 5, Sonstige: 15 })]);
		expect(result.get('01')?.parteien.map((p) => p.kurzname)).toEqual([
			'SPD',
			'Sonstige',
			'FDP',
			'FREIE WÄHLER'
		]);
	});

	it('normalisiert einstellige Bezirkscodes', () => {
		expect([...sumByBezirk([row('7', { SPD: 1 })]).keys()]).toEqual(['07']);
	});

	it('bricht bei unbekanntem Bezirkscode ab', () => {
		expect(() => sumByBezirk([row('13', { SPD: 1 })])).toThrow(/13/);
	});

	it('bricht ab, wenn die Parteistimmen nicht die Gültigen ergeben', () => {
		const broken = { ...row('01', { SPD: 10 }), gueltig: 11 };
		expect(() => sumByBezirk([broken])).toThrow(/01/);
	});

	it('setzt die Wahlbeteiligung ohne Wahlberechtigte auf 0 statt NaN', () => {
		expect(sumByBezirk([row('01', { SPD: 1 }, 0, 1)]).get('01')?.wahlbeteiligung).toBe(0);
	});
});

describe('sumBerlin', () => {
	it('addiert die Bezirke und rechnet Anteile und Beteiligung neu', () => {
		const bezirke = sumByBezirk([
			row('01', { SPD: 30, CDU: 10 }, 100, 50),
			row('02', { CDU: 50, AfD: 10 }, 100, 70)
		]);
		const berlin = sumBerlin([...bezirke.values()]);
		expect(berlin.gueltig).toBe(100);
		expect(berlin.wahlberechtigte).toBe(200);
		expect(berlin.waehlende).toBe(120);
		expect(berlin.wahlbeteiligung).toBeCloseTo(0.6);
		expect(berlin.parteien).toEqual([
			{ kurzname: 'CDU', stimmen: 60, anteil: 0.6 },
			{ kurzname: 'SPD', stimmen: 30, anteil: 0.3 },
			{ kurzname: 'AfD', stimmen: 10, anteil: 0.1 }
		]);
	});
});

describe('buildStoriesWahl', () => {
	const meta = (slug: 'agh11' | 'btw13'): WahlMeta => ({
		slug,
		typ: slug.startsWith('agh') ? 'agh' : 'btw',
		jahr: slug === 'agh11' ? 2011 : 2013,
		wiederholung: false,
		vorlaeufig: false,
		quelle: 'https://example.org',
		lizenz: 'dl-de/by-2.0'
	});
	const rowsAll = (votes: Record<string, number>) => ALL_CODES.map((c) => row(c, votes));

	it('baut 12 Bezirke mit Namen, Slugs und allen Wahlen plus Berlin gesamt', () => {
		const out = buildStoriesWahl({
			generatedAt: '2026-11-07T00:00:00.000Z',
			wahlen: [
				{ meta: meta('agh11'), rows: rowsAll({ SPD: 3, CDU: 1 }) },
				{ meta: meta('btw13'), rows: rowsAll({ CDU: 1 }) }
			]
		});
		expect(out.schemaVersion).toBe(1);
		expect(out.stimmtyp).toBe('zweitstimme');
		expect(out.wahlen.map((w) => w.slug)).toEqual(['agh11', 'btw13']);
		expect(out.bezirke.map((b) => b.nr)).toEqual(ALL_CODES);
		expect(out.bezirke[1]).toMatchObject({
			nr: '02',
			slug: 'friedrichshain-kreuzberg',
			name: 'Friedrichshain-Kreuzberg'
		});
		expect(out.bezirke[0].wahlen.agh11.parteien[0]).toEqual({
			kurzname: 'SPD',
			stimmen: 3,
			anteil: 0.75
		});
		expect(out.berlin.agh11.gueltig).toBe(48);
		expect(out.berlin.btw13.parteien).toEqual([{ kurzname: 'CDU', stimmen: 12, anteil: 1 }]);
	});

	it('bricht ab, wenn einer Wahl ein Bezirk fehlt', () => {
		expect(() =>
			buildStoriesWahl({
				generatedAt: '2026-11-07T00:00:00.000Z',
				wahlen: [{ meta: meta('agh11'), rows: rowsAll({ SPD: 1 }).slice(1) }]
			})
		).toThrow(/agh11.*01/);
	});
});
