import { describe, expect, it } from 'vitest';
import { renderFaviconSvg, renderPixelSvg } from './generate-pixel-logo.js';
import { PALETTE, PRESET } from '../src/lib/data/pixel-logo-geometry.js';

function fillsIn(svg: string): string[] {
	return [...svg.matchAll(/fill="(#[0-9A-Fa-f]{6})"/g)].map((match) => match[1]);
}

describe('renderPixelSvg', () => {
	it('bündelt die Zellen über eine einzige Rect-Definition', () => {
		const svg = renderPixelSvg();
		expect(svg.match(/<use /g)).toHaveLength(296);
		expect(svg.match(/<rect id="p"/g)).toHaveLength(1);
	});

	it('schreibt auf Wunsch jede Zelle als eigenes Rect, für resvg', () => {
		const svg = renderPixelSvg({ flat: true });
		expect(svg).not.toContain('<use ');
		expect(svg).not.toContain('<defs>');
		expect(svg.match(/<rect /g)).toHaveLength(296);
	});

	it('bleibt ohne Hintergrundfarbe transparent', () => {
		expect(renderPixelSvg()).not.toContain('width="100" height="100"');
	});

	it('legt mit Hintergrundfarbe eine Grundfläche unter das Raster', () => {
		const svg = renderPixelSvg({ background: '#ECEAE0' });
		expect(svg).toContain('<rect width="100" height="100" fill="#ECEAE0" />');
		expect(svg.indexOf('#ECEAE0')).toBeLessThan(svg.indexOf('<g fill='));
	});

	it('weist eine Hintergrundfarbe zurück, die kein Hex-Farbwert ist', () => {
		expect(() => renderPixelSvg({ background: '"/><script>' })).toThrow(/Hex/);
		expect(() => renderPixelSvg({ background: 'red' })).toThrow(/Hex/);
	});

	it('nennt Silhouette und Quelle im desc, damit die Lizenz mitreist', () => {
		const svg = renderPixelSvg();
		expect(svg).toContain('viewBox="0 0 100 100"');
		expect(svg).toContain('<title>navigator.berlin</title>');
		expect(svg).toMatch(/<desc>.*ODIS.*dl-de\/zero-2-0.*<\/desc>/);
	});

	it('färbt ausschließlich aus der Palette', () => {
		const fills = fillsIn(renderPixelSvg());
		expect(fills.length).toBeGreaterThan(0);
		expect(fills.every((fill) => (PALETTE as readonly string[]).includes(fill))).toBe(true);
	});

	it('liefert bei gleichem Preset byte-gleiche Ausgabe', () => {
		expect(renderPixelSvg()).toEqual(renderPixelSvg());
	});

	it('behält ungeschnitten die volle viewBox', () => {
		expect(renderPixelSvg({ flat: true })).toContain('viewBox="0 0 100 100"');
	});

	it('folgt einem abweichenden Preset', () => {
		const svg = renderPixelSvg({ preset: { ...PRESET, grid: 12 }, flat: true });
		expect(svg.match(/<rect /g)!.length).toBeLessThan(296);
	});
});

describe('renderFaviconSvg', () => {
	const svg = renderFaviconSvg();

	it('legt die beige Silhouette auf eine indigo Kachel', () => {
		expect(svg).toContain('viewBox="0 0 100 100"');
		expect(svg).toMatch(/<rect width="100" height="100" rx="[\d.]+" fill="#2A3F7C" \/>/);
		expect(svg).toMatch(/<path d="M [\d.,L Z]+" fill="#ECEAE0"/);
	});

	it('nennt Quelle und Lizenz im desc', () => {
		expect(svg).toMatch(/<desc>.*ODIS.*dl-de\/zero-2-0.*<\/desc>/);
	});

	it('bleibt unter 2 KB', () => {
		expect(svg.length).toBeLessThan(2048);
	});

	it('ist über zwei Aufrufe byte-gleich', () => {
		expect(renderFaviconSvg()).toBe(svg);
	});
});
