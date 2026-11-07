import { describe, expect, it } from 'vitest';
import { fillsFor, squareSvg } from './svg';
import { layout } from './layout';
import { shareTexts, type Measure } from './labels';
import { ORDER } from './parteien';
import { STORY_INK, STORY_PAPER } from '../tokens';

const measure: Measure = (t) => ({
	abl: 0,
	w: t.length * 0.6,
	asc: 0.7,
	h: 0.72,
	adv: t.length * 0.6
});
const COLORS = [
	'#009EE0',
	'#722282',
	'#3b3936',
	'#FFEF00',
	'#1AA037',
	'#BE3075',
	'#FF820A',
	'#E3000F',
	'#8d887d'
];
const SHARES = [0.1, 0, 0.3, 0.002, 0.2, 0.15, 0, 0.2, 0.048];
const blocks = layout(SHARES);
const count = (s: string, re: RegExp): number => (s.match(re) ?? []).length;

describe('fillsFor', () => {
	it('ohne Optionen die Parteifarben', () => {
		expect(fillsFor(COLORS)).toEqual(COLORS);
	});

	it('Hervorhebung blasst die anderen Parteien zu 80 % Richtung Papier ab', () => {
		const f = fillsFor(COLORS, { highlight: 'spd' });
		expect(f[7]).toBe('#E3000F');
		expect(f[0]).toBe('#bfd8d5');
	});

	it('Grau ausblenden setzt den Grau-Block auf null', () => {
		const f = fillsFor(COLORS, { hideGrey: true });
		expect(f[8]).toBeNull();
		expect(f[0]).toBe(COLORS[0]);
	});

	it('verlangt eine Farbe pro Partei', () => {
		expect(() => fillsFor(COLORS.slice(0, 3))).toThrow(RangeError);
	});
});

describe('squareSvg', () => {
	const base = { blocks, colors: COLORS, title: 'Mitte, AGH 2026: SPD 20,0 %' };

	it('ein Rechteck pro Partei mit exakter Geometrie', () => {
		const s = squareSvg(base);
		expect(count(s, /<rect /g)).toBe(ORDER.length);
		expect(s).toContain(
			`<rect x="0.000" y="0.000" width="${blocks[0].w.toFixed(3)}" height="100.000" fill="#009EE0"/>`
		);
	});

	it('ist als Bild beschriftet, Titel escaped', () => {
		const s = squareSvg({ ...base, title: 'A & B <C> "D"' });
		expect(s).toMatch(/^<svg [^>]*role="img"/);
		expect(s).toContain('aria-label="A &amp; B &lt;C&gt; &quot;D&quot;"');
		expect(s).toContain('viewBox="0 0 100 100"');
	});

	it('Eckmarken nur mit Nichtwählern', () => {
		expect(squareSvg(base)).not.toContain('M0 4V0H4');
		expect(squareSvg({ ...base, paper: true })).toContain('M0 4V0H4');
	});

	it('verborgenes Grau als leere Kontur', () => {
		const s = squareSvg({ ...base, hideGrey: true });
		expect(s).toMatch(/<rect [^>]*fill="none" stroke="#26221e" stroke-opacity="0.45"/);
	});

	it('Zahlen innen mit Kontrastfarbe, außen mit Linie in Tinte', () => {
		const s = squareSvg({ ...base, texts: shareTexts(SHARES, 'de'), scale: 2, measure });
		expect(s).toContain(`fill="${STORY_PAPER}"`);
		expect(count(s, /<text /g)).toBe(SHARES.filter((v) => v > 0).length);
		expect(s).toMatch(/<path d="M[^"]+L[^"]+" stroke="#26221e"/);
		expect(s).toContain('30 %');
		expect(s).toContain('aria-hidden="true"');
		expect(s).not.toContain('NaN');
	});

	it('ohne Zahlen keine Texte', () => {
		expect(count(squareSvg(base), /<text /g)).toBe(0);
	});

	it('Rand erweitert die viewBox für Außenbeschriftung', () => {
		const s = squareSvg({ ...base, margin: { top: 2, right: 20, bottom: 15, left: 3 } });
		expect(s).toContain('viewBox="-3 -2 123 117"');
	});

	it('Zahlen verlangen Messung und Skalierung', () => {
		expect(() => squareSvg({ ...base, texts: shareTexts(SHARES, 'de') })).toThrow(TypeError);
	});

	it('Tinte als Textfarbe auf hellen Blöcken', () => {
		const s = squareSvg({
			...base,
			colors: COLORS.map(() => '#FFEF00'),
			texts: shareTexts(SHARES, 'de'),
			scale: 2,
			measure
		});
		expect(s).toContain(`fill="${STORY_INK}" font-size`);
	});
});
