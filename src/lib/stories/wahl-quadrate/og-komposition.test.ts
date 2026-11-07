import { describe, expect, it } from 'vitest';
import data from '../../../../static/data/stories-wahl.json';
import { PARTY_COLORS } from './farben';
import { ogKompositionSvg, vorschauShares } from './og-komposition';
import { ORDER } from './parteien';
import type { StoriesWahlData } from './types';

const D = data as StoriesWahlData;
const svg = ogKompositionSvg(D, 400);

describe('vorschauShares', () => {
	it('ein Quadrat: Friedrichshain-Kreuzberg, Abgeordnetenhaus 2026, Linke 44 %', () => {
		const s = vorschauShares(D);
		expect(s).toHaveLength(ORDER.length);
		expect(s.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 3);
		expect(Math.round(s[ORDER.indexOf('linke')] * 100)).toBe(44);
	});
});

describe('ogKompositionSvg', () => {
	it('ein einzelnes Quadrat, das die ganze Fläche füllt, ohne Rahmen und Text', () => {
		expect(svg).toMatch(/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" width="400" height="400"/);
		expect(svg.match(/<g /g)).toHaveLength(1);
		expect(svg).toContain('scale(4)');
		expect(svg).toContain(`fill="${PARTY_COLORS.linke}"`);
		expect(svg).not.toContain('stroke=');
		expect(svg).not.toContain('<text');
	});

	it('reproduzierbar und ohne NaN', () => {
		expect(ogKompositionSvg(D, 400)).toBe(svg);
		expect(svg).not.toContain('NaN');
	});
});
