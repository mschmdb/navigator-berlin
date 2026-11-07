import { describe, expect, it } from 'vitest';
import data from '../../../../static/data/stories-wahl.json';
import { PARTY_COLORS } from './farben';
import { ogKompositionSvg, vorschauShares } from './og-komposition';
import { ORDER } from './parteien';
import type { StoriesWahlData } from './types';

const svg = ogKompositionSvg(data as StoriesWahlData, 400);

describe('ogKompositionSvg', () => {
	it('ein quadratisches SVG in der gewünschten Größe, auf Papier mit Rahmen', () => {
		expect(svg).toMatch(/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" width="400" height="400"/);
		expect(svg).toContain('fill="#efe6d2"');
		expect(svg).toContain('stroke="#26221e"');
	});

	it('zwölf Quadrate, eins je Bezirk, Abgeordnetenhaus 2026, ohne Text', () => {
		expect(svg.match(/<g transform="translate/g)).toHaveLength(12);
		expect(svg).toContain(`fill="${PARTY_COLORS.linke}"`);
		expect(svg).not.toContain('<text');
	});

	it('reproduzierbar und ohne NaN', () => {
		expect(ogKompositionSvg(data as StoriesWahlData, 400)).toBe(svg);
		expect(svg).not.toContain('NaN');
	});
});

describe('vorschauShares', () => {
	it('zwölf Bezirke alphabetisch, je ein Anteil pro Block, Summe 1', () => {
		const v = vorschauShares(data as StoriesWahlData);
		expect(v).toHaveLength(12);
		for (const s of v) {
			expect(s).toHaveLength(ORDER.length);
			expect(s.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 3);
		}
	});
});
