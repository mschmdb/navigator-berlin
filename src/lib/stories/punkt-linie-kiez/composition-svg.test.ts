import { describe, expect, it } from 'vitest';
import { compositionElements, compositionSvg } from './composition-svg';
import { geometry } from './geometry';
import type { Kennzahlen } from './types';

const fk: Kennzahlen = {
	slug: 'friedrichshain-kreuzberg',
	gruen: 0.4444,
	altbauAnteil: 0.5363,
	laermDb: 49.3,
	bewohnerProKm2: 14344,
	haltestelle400mAnteil: 0.994,
	clubs: 46
};

describe('compositionElements', () => {
	it('zeichnet die Linien vor allen Formen, ohne Blend-Modus', () => {
		const svg = compositionElements(fk);
		const lastLine = svg.lastIndexOf('<line');
		expect(lastLine).toBeGreaterThan(-1);
		for (const fill of ['#3a8a55', '#cf4128', '#efbd2c', '#24579e']) {
			expect(svg.indexOf(fill), fill).toBeGreaterThan(lastLine);
		}
		expect(svg.indexOf('fill="#26221e"')).toBeGreaterThan(lastLine);
		expect(svg).not.toContain('mix-blend-mode');
	});

	it('nutzt Palette und Geometrie aus geometry()', () => {
		const svg = compositionElements(fk);
		const g = geometry(fk);
		expect(svg).toContain('fill="#3a8a55"');
		expect(svg).toContain('fill="#cf4128"');
		expect(svg).toContain('fill="#efbd2c" stroke="#26221e"');
		expect(svg).toContain('stroke="#24579e"');
		expect(svg).toContain(`cx="${g.circle!.cx.toFixed(1)}"`);
		expect(svg.match(/<line/g)).toHaveLength(g.lines.length);
	});

	it('lässt Formen bei fehlenden Werten und ohne Clubs weg', () => {
		const svg = compositionElements({ ...fk, laermDb: null, clubs: 0 });
		expect(svg).not.toContain('#efbd2c');
		expect(svg).not.toContain('#24579e');
	});

	it('ist deterministisch', () => {
		expect(compositionElements(fk)).toBe(compositionElements({ ...fk }));
	});
});

describe('compositionSvg', () => {
	it('liefert ein eigenständiges SVG mit Größe und viewBox', () => {
		const svg = compositionSvg(fk, 300);
		expect(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg"')).toBe(true);
		expect(svg).toContain('viewBox="0 0 200 200"');
		expect(svg).toContain('width="300"');
		expect(svg.endsWith('</svg>')).toBe(true);
	});
});
