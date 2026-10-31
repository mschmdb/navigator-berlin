import { describe, expect, it } from 'vitest';
import { posterSvg, POSTER_HEIGHT, POSTER_WIDTH, wrapText } from './poster-svg';
import { compositionElements } from './composition-svg';
import type { BezirkItem, KennzahlenQuelle } from './types';

const item: BezirkItem = {
	slug: 'friedrichshain-kreuzberg',
	name: 'Friedrichshain-Kreuzberg',
	kennzahlen: {
		slug: 'friedrichshain-kreuzberg',
		gruen: 0.4444,
		altbauAnteil: 0.5363,
		laermDb: 49.3,
		bewohnerProKm2: 14344,
		haltestelle400mAnteil: 0.994,
		clubs: 46
	}
};
const sources: KennzahlenQuelle[] = [
	{ name: 'Einwohner pro Planungsraum', stand: '2024-12-31' },
	{ name: 'Clubs (OpenStreetMap)', stand: '2026-06-07' }
];

describe('wrapText', () => {
	it('bricht an Wortgrenzen und überschreitet die Breite nicht', () => {
		const lines = wrapText('eins zwei drei vier fünf sechs sieben', 12 * 0.5 * 15, 12);
		expect(lines.length).toBeGreaterThan(1);
		for (const l of lines) expect(l.length * 6).toBeLessThanOrEqual(12 * 0.5 * 15 + 1);
		expect(lines.join(' ')).toBe('eins zwei drei vier fünf sechs sieben');
	});
});

describe('posterSvg', () => {
	it('ist ein 4:5-Poster mit Papierfläche und Rahmen', () => {
		const svg = posterSvg(item, sources, 'de');
		expect(POSTER_WIDTH / POSTER_HEIGHT).toBeCloseTo(0.8);
		expect(svg).toContain(`viewBox="0 0 ${POSTER_WIDTH} ${POSTER_HEIGHT}"`);
		expect(svg).toContain('fill="#efe6d2"');
		expect(svg).toContain('fill="none" stroke="#26221e"');
	});

	it('trägt Titel klein, Bezirksname, Legende mit Werten und Fußzeile (DE)', () => {
		const svg = posterSvg(item, sources, 'de');
		expect(svg).toContain('>punkt, linie, kiez<');
		expect(svg).toContain('>friedrichshain-kreuzberg<');
		expect(svg).toContain('kreis: grünversorgung');
		expect(svg).toContain('44 / 100');
		expect(svg).toContain('49,3 dB');
		expect(svg).toContain('navigator.berlin');
		expect(svg).toContain('Einwohner pro Planungsraum (Stand 2024-12-31)');
		expect(svg).toContain('© OpenStreetMap-Mitwirkende');
		expect(svg).toContain('MIT-Lizenz');
	});

	it('ist unabhängig von der Laufzeit-Locale englisch bei lang en', () => {
		const svg = posterSvg(item, sources, 'en');
		expect(svg).toContain('circle: green space');
		expect(svg).toContain('49.3 dB');
		expect(svg).toContain('© OpenStreetMap contributors');
		expect(svg).toContain('MIT licence');
	});

	it('nutzt dieselbe Komposition wie OG-Bild und Komponente', () => {
		expect(posterSvg(item, sources, 'de')).toContain(compositionElements(item.kennzahlen));
	});

	it('maskiert Sonderzeichen in Quellennamen', () => {
		const svg = posterSvg(item, [{ name: 'A & B <x>' }], 'de');
		expect(svg).toContain('A &amp; B &lt;x&gt;');
		expect(svg).not.toContain('A & B');
	});

	it('enthält keine Rastergrafik', () => {
		expect(posterSvg(item, sources, 'de')).not.toContain('<image');
	});
});
