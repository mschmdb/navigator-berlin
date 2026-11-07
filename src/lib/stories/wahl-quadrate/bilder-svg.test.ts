import { describe, expect, it } from 'vitest';
import { jostMeasure } from '$lib/server/stories/jost';
import data from '../../../../static/data/stories-wahl.json';
import { labelExtent } from './anordnung';
import { checkPage } from './label-check';
import { JAHRE, WAHL_TYPEN } from './parteien';
import { ogSvg, OG_SIZE, socialSvg, SOCIAL_SIZE } from './bilder-svg';
import type { StoriesWahlData } from './types';

const fonts = { black: jostMeasure(900), regular: jostMeasure(400) };
const DATA = data as StoriesWahlData;
const textOf = (svg: string): string =>
	[...svg.matchAll(/<text [^>]*>([^<]*)<\/text>/g)].map((x) => x[1]).join(' ');

describe('socialSvg (1080 × 1350)', () => {
	const fk = socialSvg({
		data: DATA,
		bezirk: 'friedrichshain-kreuzberg',
		typ: 'agh',
		lang: 'de',
		fonts
	});

	it('Format, Titel, Bezirk und Wahlart', () => {
		expect(SOCIAL_SIZE).toEqual({ width: 1080, height: 1350 });
		expect(fk.svg).toMatch(/^<svg [^>]*width="1080" height="1350"/);
		const text = textOf(fk.svg);
		expect(text).toContain('Berlin in Quadraten');
		expect(text).toContain('Friedrichshain-');
		expect(text).toContain('Kreuzberg');
		expect(text).toContain('Abgeordnetenhaus');
		expect(text).toContain('Grau: alle Parteien unter 5 %');
		expect(text).toContain('navigator.berlin');
	});

	it('ein Quadrat je Wahl, Jahr groß darunter', () => {
		expect(fk.squares).toHaveLength(5);
		for (const y of JAHRE.agh) expect(fk.svg).toContain(`>${y}<`);
		const yearY = Number(/<text x="[\d.]+" y="([\d.]+)"[^>]*>2011</.exec(fk.svg)![1]);
		expect(yearY).toBeGreaterThan(fk.squares[0].y + fk.squares[0].size);
	});

	it('alle Bezirke und Wahltypen: Zahlen ohne Kollision, alles auf dem Bild', () => {
		for (const b of DATA.bezirke)
			for (const typ of WAHL_TYPEN)
				for (const lang of ['de', 'en'] as const) {
					const s = socialSvg({ data: DATA, bezirk: b.slug, typ, lang, fonts });
					expect(s.squares).toHaveLength(JAHRE[typ].length);
					expect(checkPage(s.squares)).toEqual([]);
					for (const q of s.squares) {
						const e = labelExtent(q);
						expect(q.x - e.left).toBeGreaterThanOrEqual(0);
						expect(q.x + q.size + e.right).toBeLessThanOrEqual(SOCIAL_SIZE.width);
						expect(q.y + q.size + e.bottom).toBeLessThanOrEqual(SOCIAL_SIZE.height);
					}
					expect(s.svg).not.toContain('NaN');
					expect(s.svg).not.toMatch(/[–—·]/);
				}
	});

	it('Abstand zwischen Quadraten einer Reihe samt Außenzahlen', () => {
		const row = fk.squares.filter((q) => q.y === fk.squares[0].y);
		for (let i = 1; i < row.length; i++) {
			const prev = row[i - 1];
			const gap =
				row[i].x - labelExtent(row[i]).left - (prev.x + prev.size + labelExtent(prev).right);
			expect(gap).toBeGreaterThanOrEqual(24);
		}
	});

	it('Zahlen in Exportgröße (mindestens 17 px)', () => {
		for (const q of fk.squares) {
			for (const l of q.labels!.inside) expect(l.fontSize * q.scale).toBeGreaterThanOrEqual(17);
			for (const l of q.labels!.outside) expect(l.fontSize * q.scale).toBeCloseTo(17, 6);
		}
	});

	it('wirft bei unbekanntem Bezirk', () => {
		expect(() =>
			socialSvg({ data: DATA, bezirk: 'nirgendwo', typ: 'agh', lang: 'de', fonts })
		).toThrow(RangeError);
	});
});

describe('ogSvg (1200 × 630)', () => {
	const og = ogSvg({ data: DATA, lang: 'de', fonts });

	it('Titel, Untertitel, 12 Quadrate ohne Zahlen', () => {
		expect(OG_SIZE).toEqual({ width: 1200, height: 630 });
		expect(og.svg).toMatch(/^<svg [^>]*width="1200" height="630"/);
		const text = textOf(og.svg);
		expect(text).toContain('Berlin in Quadraten');
		expect(text).toContain('Alle Bezirke, alle Wahlen');
		expect(text).not.toMatch(/\d+ %/);
		expect(og.squares).toHaveLength(12);
		for (const q of og.squares) {
			expect(q.labels).toBeNull();
			expect(q.x + q.size).toBeLessThanOrEqual(OG_SIZE.width);
		}
	});

	it('englische Fassung', () => {
		const text = textOf(ogSvg({ data: DATA, lang: 'en', fonts }).svg);
		expect(text).toContain('Berlin in Squares');
		expect(text).toContain('all 12 districts');
	});
});
