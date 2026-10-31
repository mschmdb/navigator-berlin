import { describe, expect, it } from 'vitest';
import { overviewPosterSvg, posterSvg, POSTER_HEIGHT, POSTER_WIDTH, wrapText } from './poster-svg';
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

describe('overviewPosterSvg', () => {
	const names = [
		'Spandau',
		'Mitte',
		'Pankow',
		'Neukölln',
		'Lichtenberg',
		'Reinickendorf',
		'Treptow-Köpenick',
		'Marzahn-Hellersdorf',
		'Steglitz-Zehlendorf',
		'Tempelhof-Schöneberg',
		'Friedrichshain-Kreuzberg',
		'Charlottenburg-Wilmersdorf'
	];
	const bezirke: BezirkItem[] = names.map((name, i) => ({
		slug: name.toLowerCase(),
		name,
		kennzahlen: { ...item.kennzahlen, slug: name.toLowerCase(), gruen: 0.2 + i * 0.05 }
	}));

	it('zeigt 12 Kompositionen mit Namen, alphabetisch sortiert', () => {
		const svg = overviewPosterSvg(bezirke, sources, 'de');
		expect(svg.match(/clip-path="url\(#plk-clip\)"/g)).toHaveLength(12);
		const found = [...svg.matchAll(/font-size="20"[^>]*>([^<]+)</g)].map((x) => x[1]);
		expect(found).toEqual(
			[...names].sort((a, b) => a.localeCompare(b, 'de')).map((n) => n.toLowerCase())
		);
	});

	it('nutzt für jede Komposition die große Geometrie', () => {
		const svg = overviewPosterSvg(bezirke, sources, 'de');
		for (const b of bezirke) expect(svg).toContain(compositionElements(b.kennzahlen));
	});

	it('legt die Linien in jeder Komposition vor die Formen', () => {
		const svg = overviewPosterSvg(bezirke, sources, 'de');
		for (const part of svg.split('clip-path="url(#plk-clip)">').slice(1)) {
			const comp = part.slice(0, part.indexOf('</g></g>'));
			const lastLine = comp.lastIndexOf('<line');
			const firstShape = comp.search(/<(circle|path)/);
			if (lastLine >= 0 && firstShape >= 0) expect(lastLine).toBeLessThan(firstShape);
		}
	});

	it('trägt eine Legende ohne Werte (DE)', () => {
		const svg = overviewPosterSvg(bezirke, sources, 'de');
		for (const label of ['kreis: grünversorgung', 'donut: clubs', 'balken: bewohner pro km²'])
			expect(svg).toContain(label);
		expect(svg).not.toContain('keine Daten');
		expect(svg).not.toContain(' dB');
		expect(svg).not.toContain('/ 100');
	});

	it('trägt Quellen, OSM, Lizenz und Marke, englisch bei lang en', () => {
		const de = overviewPosterSvg(bezirke, sources, 'de');
		expect(de).toContain('Einwohner pro Planungsraum (Stand 2024-12-31)');
		expect(de).toContain('© OpenStreetMap-Mitwirkende');
		expect(de).toContain('MIT-Lizenz');
		expect(de).toContain('navigator.berlin');
		const en = overviewPosterSvg(bezirke, sources, 'en');
		expect(en).toContain('circle: green space');
		expect(en).toContain('© OpenStreetMap contributors');
		expect(en).toContain('MIT licence');
	});

	it('hält alle Elemente innerhalb des Blatts und nutzt keine Rastergrafik', () => {
		const svg = overviewPosterSvg(bezirke, sources, 'de');
		expect(svg).not.toContain('<image');
		for (const m of svg.matchAll(/<text x="([\d.]+)" y="([\d.]+)"/g)) {
			expect(Number(m[1])).toBeGreaterThan(20);
			expect(Number(m[1])).toBeLessThan(POSTER_WIDTH - 20);
			expect(Number(m[2])).toBeLessThan(POSTER_HEIGHT - 20);
		}
		for (const m of svg.matchAll(/translate\(([\d.]+) ([\d.]+)\) scale\(([\d.]+)\)/g)) {
			const [x, y, s] = [Number(m[1]), Number(m[2]), Number(m[3])];
			if (s < 1) {
				expect(x).toBeGreaterThanOrEqual(20);
				expect(x + 200 * s).toBeLessThanOrEqual(POSTER_WIDTH - 20);
				expect(y + 200 * s + 30).toBeLessThan(1000);
			}
		}
	});
});
