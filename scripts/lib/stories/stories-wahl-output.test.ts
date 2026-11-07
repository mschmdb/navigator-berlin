import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type {
	StoriesWahlData,
	WahlSlug,
	WahlZahlen
} from '../../../src/lib/stories/wahl-quadrate/types.js';

const out = JSON.parse(readFileSync('static/data/stories-wahl.json', 'utf-8')) as StoriesWahlData;

const SLUGS: WahlSlug[] = [
	'agh11',
	'agh16',
	'agh21',
	'agh23',
	'agh26',
	'btw13',
	'btw17',
	'btw21',
	'btw25'
];

/** Parteien mit eigenem Block in der Skizze (`runde-20-ux/gen.mjs`), Piraten kommen mit #179. */
const EIGENER_BLOCK = new Set(['AfD', 'BSW', 'CDU', 'FDP', 'GRÜNE', 'Die Linke', 'PIRATEN', 'SPD']);

const anteil = (z: WahlZahlen, kurzname: string) =>
	z.parteien.find((p) => p.kurzname === kurzname)?.anteil ?? 0;

/** Grau wie in `regeln.md`: alle Parteien unter der Schwelle plus Sonstige und Freie Wähler. */
const grau = (z: WahlZahlen, schwelle = 0.05) =>
	z.parteien
		.filter((p) => !EIGENER_BLOCK.has(p.kurzname) || p.anteil < schwelle)
		.reduce((s, p) => s + p.anteil, 0);

const pct = (v: number) => Math.round(v * 1000) / 10;

const bezirk = (slug: string) => {
	const b = out.bezirke.find((x) => x.slug === slug);
	if (!b) throw new Error(`Bezirk ${slug} fehlt`);
	return b;
};

describe('static/data/stories-wahl.json', () => {
	it('hat 12 Bezirke in Nummernfolge und alle 9 Wahlen', () => {
		expect(out.schemaVersion).toBe(1);
		expect(out.stimmtyp).toBe('zweitstimme');
		expect(out.wahlen.map((w) => w.slug)).toEqual(SLUGS);
		expect(out.bezirke.map((b) => b.nr)).toEqual([
			'01',
			'02',
			'03',
			'04',
			'05',
			'06',
			'07',
			'08',
			'09',
			'10',
			'11',
			'12'
		]);
		for (const b of out.bezirke) expect(Object.keys(b.wahlen).sort()).toEqual([...SLUGS].sort());
		expect(Object.keys(out.berlin).sort()).toEqual([...SLUGS].sort());
		for (const w of out.wahlen) expect(w.quelle).toMatch(/^https:\/\//);
	});

	it('Stimmen ergeben je Bezirk und Wahl die Gültigen, Anteile ergeben 100 %', () => {
		for (const b of out.bezirke) {
			for (const slug of SLUGS) {
				const z = b.wahlen[slug];
				const label = `${b.slug}/${slug}`;
				expect(
					z.parteien.reduce((s, p) => s + p.stimmen, 0),
					label
				).toBe(z.gueltig);
				expect(
					z.parteien.reduce((s, p) => s + p.anteil, 0),
					label
				).toBeCloseTo(1, 6);
				expect(z.gueltig, label).toBeLessThanOrEqual(z.waehlende);
				expect(z.wahlbeteiligung, label).toBeGreaterThan(0.45);
				expect(z.wahlbeteiligung, label).toBeLessThan(0.9);
			}
		}
	});

	it('Berlin gesamt ist die Summe der Bezirke', () => {
		for (const slug of SLUGS) {
			const sum = (f: (z: WahlZahlen) => number) =>
				out.bezirke.reduce((s, b) => s + f(b.wahlen[slug]), 0);
			expect(out.berlin[slug].gueltig, slug).toBe(sum((z) => z.gueltig));
			expect(out.berlin[slug].waehlende, slug).toBe(sum((z) => z.waehlende));
			expect(out.berlin[slug].wahlberechtigte, slug).toBe(sum((z) => z.wahlberechtigte));
		}
	});

	it('fasst kleine Parteien nicht vorab zusammen', () => {
		const mitte11 = bezirk('mitte').wahlen.agh11;
		expect(anteil(mitte11, 'FDP')).toBeGreaterThan(0.01);
		expect(anteil(mitte11, 'FDP')).toBeLessThan(0.05);
		expect(anteil(out.berlin.agh23, 'FDP')).toBeCloseTo(0.046, 3);
	});

	it('Prüfwert Grau berlinweit AGH 2016, 2021, 2023 (Skizze runde-20-ux)', () => {
		expect(pct(grau(out.berlin.agh16))).toBe(9.2);
		expect(pct(grau(out.berlin.agh21))).toBe(12.5);
		expect(pct(grau(out.berlin.agh23))).toBe(13.7);
	});

	it('Prüfwert Sonstige berlinweit AGH 2016, 2021, 2023, mit Piraten falls ausgewiesen', () => {
		const sonstige = (z: WahlZahlen) => anteil(z, 'Sonstige') + anteil(z, 'PIRATEN');
		expect(pct(sonstige(out.berlin.agh16))).toBe(9.2);
		expect(pct(sonstige(out.berlin.agh21))).toBe(11.6);
		expect(pct(sonstige(out.berlin.agh23))).toBe(8.8);
	});

	it('Prüfwert Mitte AGH 2011: SPD-Stimmen wie API und Skizze', () => {
		const spd = bezirk('mitte').wahlen.agh11.parteien.find((p) => p.kurzname === 'SPD');
		expect(spd?.stimmen).toBe(31057);
	});

	it('Prüfwert Wahlbeteiligung wie tools/bezirk-turnout.ts', () => {
		expect(pct(bezirk('mitte').wahlen.agh11.wahlbeteiligung)).toBe(55.9);
		expect(pct(bezirk('friedrichshain-kreuzberg').wahlen.agh11.wahlbeteiligung)).toBe(62.2);
		expect(pct(bezirk('steglitz-zehlendorf').wahlen.btw25.wahlbeteiligung)).toBe(84.7);
		expect(pct(bezirk('mitte').wahlen.agh26.wahlbeteiligung)).toBe(71.5);
		expect(pct(bezirk('tempelhof-schoeneberg').wahlen.btw21.wahlbeteiligung)).toBe(74.3);
	});

	// Piraten führt die Pipeline erst mit #179 als eigene Partei.
	it.todo('Prüfwert Piraten AGH 2011 Friedrichshain-Kreuzberg ≈ 14,7 % (#179)');
});
