import { describe, expect, it } from 'vitest';
import { jostMeasure } from '$lib/server/stories/jost';
import data from '../../../../static/data/stories-wahl.json';
import { checkPage } from './label-check';
import { derive } from './grau';
import { toElectionShares } from './eingabe';
import { JAHRE, wahlSlug } from './parteien';
import { GRID, POSTER_HEIGHT, POSTER_WIDTH, wallPoster } from './poster-svg';
import type { StoriesWahlData } from './types';

const fonts = { black: jostMeasure(900), regular: jostMeasure(400) };
const DATA = data as StoriesWahlData;
/** Sichtbarer Text, Zeilen mit Leerzeichen verbunden. */
const textOf = (svg: string): string =>
	[...svg.matchAll(/<text [^>]*>([^<]*)<\/text>/g)].map((x) => x[1]).join(' ');

const agh = wallPoster({ data: DATA, typ: 'agh', lang: 'de', fonts });
const btw = wallPoster({ data: DATA, typ: 'btw', lang: 'en', fonts });

describe('wallPoster', () => {
	it('ein Quadrat je Bezirk und Wahl', () => {
		expect(agh.squares).toHaveLength(12 * 5);
		expect(btw.squares).toHaveLength(12 * 4);
	});

	it('Plakatformat 1000 × 1250 auf Papier', () => {
		expect(agh.svg).toMatch(
			new RegExp(`^<svg [^>]*width="${POSTER_WIDTH}" height="${POSTER_HEIGHT}"`)
		);
		expect(agh.svg).toContain('fill="#efe6d2"');
	});

	it('Titel, Untertitel und Wahlart', () => {
		expect(agh.svg).toContain('>Berlin in Quadraten<');
		expect(agh.svg).toContain('>Alle Bezirke, alle Wahlen<');
		expect(agh.svg).toContain('Abgeordnetenhaus');
		expect(btw.svg).toContain('>Berlin in Squares<');
		expect(btw.svg).toContain('>All districts, all elections<');
		expect(btw.svg).toContain('Bundestag');
	});

	it('Jahre als Kopfzeile, Bezirke alphabetisch', () => {
		for (const y of JAHRE.agh) expect(agh.svg).toContain(`>${y}<`);
		expect(agh.squares[0].title).toMatch(/^Charlottenburg-Wilmersdorf/);
		expect(agh.squares.at(-1)!.title).toMatch(/^Treptow-Köpenick/);
		expect(agh.svg).toContain('>Tempelhof-<');
		expect(agh.svg).toContain('>Neukölln<');
	});

	it('Legende mit Parteien und Grau', () => {
		for (const n of ['AfD', 'CDU', 'Grüne', 'Die Linke', 'Piraten', 'SPD'])
			expect(agh.svg).toContain(`>${n}<`);
		expect(agh.svg).toContain('>Grau: alle Parteien unter 5 %<');
		expect(btw.svg).toContain('>Greens<');
		expect(btw.svg).toContain('>Grey: all parties below 5%<');
	});

	it('Grau erklärt: Tabelle mit berlinweitem Grau je Wahl', () => {
		expect(textOf(agh.svg)).toContain(
			'Grau fasst alle Parteien unter 5 % und die Sonstigen zusammen.'
		);
		expect(agh.svg).toContain('Abgeordnetenhaus: Grau in ganz Berlin');
		for (const jahr of JAHRE.agh) {
			const slug = wahlSlug('agh', jahr)!;
			const grey = Math.round(derive(toElectionShares(DATA.berlin[slug])).disp.rest * 100);
			expect(agh.svg).toContain(`data-wahl="${slug}" data-grau="${grey}"`);
		}
		expect(agh.svg).toContain('FDP 1,8 %');
		expect(agh.svg).toContain('und Sonstige');
		expect(btw.svg).toContain('Bundestag: grey across Berlin');
	});

	it('Quellenzeile mit Lizenz und Marke', () => {
		expect(textOf(agh.svg)).toContain('Amt für Statistik Berlin-Brandenburg');
		expect(agh.svg).toContain('dl-de/by-2.0');
		expect(agh.svg).toContain('>navigator.berlin<');
		expect(textOf(btw.svg)).toContain('Bundeswahlleiterin');
	});

	it('Prozentzahlen: keine Kollision, nichts außerhalb des Rasters', () => {
		for (const p of [agh, btw]) {
			expect(checkPage(p.squares).slice(0, 10)).toEqual([]);
			const outside = p.squares.flatMap((s) => s.labels?.outside ?? []);
			expect(outside.length).toBeGreaterThan(0);
			for (const s of p.squares) {
				expect(s.x).toBeGreaterThanOrEqual(GRID.left);
				expect(s.x + s.size).toBeLessThanOrEqual(GRID.right);
				expect(s.y + s.size).toBeLessThanOrEqual(GRID.bottom);
			}
		}
	});

	it('beide Sprachen ohne NaN und ohne Gedankenstriche', () => {
		for (const p of [agh, btw, wallPoster({ data: DATA, typ: 'agh', lang: 'en', fonts })]) {
			expect(p.svg).not.toContain('NaN');
			expect(p.svg).not.toMatch(/[\u2013\u2014\u00b7]/);
		}
	});

	it('reproduzierbar: gleiche Eingabe, gleiches SVG', () => {
		expect(wallPoster({ data: DATA, typ: 'agh', lang: 'de', fonts }).svg).toBe(agh.svg);
	});
});
