import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { toElectionShares } from './eingabe';
import { derive } from './grau';
import type { StoriesWahlData, WahlZahlen } from './types';

const data = JSON.parse(readFileSync('static/data/stories-wahl.json', 'utf-8')) as StoriesWahlData;

function zahlen(bezirk: string, wahl: keyof StoriesWahlData['berlin']): WahlZahlen {
	const b = data.bezirke.find((x) => x.slug === bezirk);
	if (!b) throw new Error(`Bezirk ${bezirk} fehlt`);
	return b.wahlen[wahl];
}

const zeile = (kurzname: string, anteil: number) => ({ kurzname, stimmen: 0, anteil });
const leer = { wahlberechtigte: 0, waehlende: 0, gueltig: 0, wahlbeteiligung: 0 };

describe('toElectionShares', () => {
	it('Friedrichshain-Kreuzberg AGH 2011: echte Werte', () => {
		const e = toElectionShares(zahlen('friedrichshain-kreuzberg', 'agh11'));
		expect(e.raw.piraten).toBeCloseTo(0.1467, 4);
		expect(e.raw.gruene).toBeCloseTo(0.3026, 4);
		expect(e.raw.fdp).toBeCloseTo(0.0099, 4);
		expect(e.raw.afd).toBeUndefined();
		// Sonstige 7,59 % plus Tierschutzpartei 1,24 %
		expect(e.sonst).toBeCloseTo(0.0883, 4);
		expect(e.fw).toBe(0);
	});

	it('Friedrichshain-Kreuzberg AGH 2011: Grau bei 5 % enthält FDP und Sonstige', () => {
		const d = derive(toElectionShares(zahlen('friedrichshain-kreuzberg', 'agh11')), 0.05);
		expect(d.disp.piraten).toBeCloseTo(0.1467, 4);
		expect(d.disp.fdp).toBe(0);
		expect(d.disp.rest).toBeCloseTo(0.0982, 4);
		expect(d.small.map((s) => s.key)).toEqual(['fdp']);
	});

	it('Freie Wähler gehen in fw, nicht in sonst', () => {
		const e = toElectionShares({
			...leer,
			parteien: [zeile('CDU', 0.9), zeile('FREIE WÄHLER', 0.07), zeile('Sonstige', 0.03)]
		});
		expect(e).toEqual({ raw: { cdu: 0.9 }, sonst: 0.03, fw: 0.07 });
	});

	it('unbekannte Kurznamen fallen in sonst', () => {
		const e = toElectionShares({
			...leer,
			parteien: [zeile('SPD', 0.5), zeile('Tierschutzpartei', 0.2), zeile('Neue Partei', 0.3)]
		});
		expect(e.raw).toEqual({ spd: 0.5 });
		expect(e.sonst).toBeCloseTo(0.5, 12);
	});

	it('doppelte Kurznamen summiert', () => {
		const e = toElectionShares({ ...leer, parteien: [zeile('SPD', 0.4), zeile('SPD', 0.1)] });
		expect(e.raw.spd).toBeCloseTo(0.5, 12);
	});

	it('leere Parteiliste ergibt leere Eingabe', () => {
		expect(toElectionShares({ ...leer, parteien: [] })).toEqual({ raw: {}, sonst: 0, fw: 0 });
	});

	it('Summe aller Töpfe ist 1 für jeden Bezirk und jede Wahl', () => {
		for (const b of data.bezirke) {
			for (const z of Object.values(b.wahlen)) {
				const e = toElectionShares(z);
				const sum = Object.values(e.raw).reduce((s, v) => s + v, 0) + e.sonst + e.fw;
				expect(sum).toBeCloseTo(1, 9);
			}
		}
	});
});
