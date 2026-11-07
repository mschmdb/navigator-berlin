import { describe, expect, it } from 'vitest';
import { toHandbuchDaten } from './handbuch-daten';
import { loadStoriesWahl } from './handbuch-daten.server';
import type { StoriesWahlData, WahlZahlen } from './types';

const zahlen = (beteiligung: number, parteien: [string, number][]): WahlZahlen => ({
	wahlberechtigte: 1000,
	waehlende: 600,
	gueltig: 590,
	wahlbeteiligung: beteiligung,
	parteien: parteien.map(([kurzname, anteil]) => ({ kurzname, stimmen: 0, anteil }))
});

const mini = {
	schemaVersion: 1,
	generatedAt: '2026-11-07',
	stimmtyp: 'zweitstimme',
	wahlen: [
		{
			slug: 'agh26',
			typ: 'agh',
			jahr: 2026,
			wiederholung: false,
			vorlaeufig: false,
			quelle: 'x',
			lizenz: 'y'
		}
	],
	bezirke: [
		{
			nr: '02',
			slug: 'friedrichshain-kreuzberg',
			name: 'Friedrichshain-Kreuzberg',
			wahlen: {
				agh26: zahlen(0.612345678, [
					['Die Linke', 0.4412345678],
					['GRÜNE', 0.2],
					['FREIE WÄHLER', 0.01],
					['Die PARTEI', 0.3487654322]
				])
			}
		}
	],
	berlin: {}
} as unknown as StoriesWahlData;

describe('toHandbuchDaten', () => {
	it('behält nur Wahl-Metadaten, die das Handbuch braucht', () => {
		expect(toHandbuchDaten(mini).wahlen).toEqual([{ slug: 'agh26', typ: 'agh', jahr: 2026 }]);
	});

	it('wandelt jede Wahl in Eingabe für derive plus Wahlbeteiligung, auf 6 Stellen gerundet', () => {
		const [b] = toHandbuchDaten(mini).bezirke;
		expect(b).toMatchObject({ nr: '02', slug: 'friedrichshain-kreuzberg' });
		expect(b.wahlen.agh26).toEqual({
			turnout: 0.612346,
			e: { raw: { linke: 0.441235, gruene: 0.2 }, sonst: 0.348765, fw: 0.01, tier: 0 }
		});
	});
});

describe('loadStoriesWahl', () => {
	it('liefert 12 Bezirke mit allen 9 Wahlen und Berlin gesamt', () => {
		const d = loadStoriesWahl();
		expect(d.bezirke).toHaveLength(12);
		expect(d.wahlen).toHaveLength(9);
		expect(Object.keys(d.berlin)).toHaveLength(9);
	});

	it('Friedrichshain-Kreuzberg 2026: Linke 44 % wie im Handbuch-Text', () => {
		const fk = toHandbuchDaten(loadStoriesWahl()).bezirke.find(
			(b) => b.slug === 'friedrichshain-kreuzberg'
		);
		expect(Math.round((fk?.wahlen.agh26.e.raw.linke ?? 0) * 100)).toBe(44);
	});
});
