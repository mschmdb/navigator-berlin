import { page } from 'vitest/browser';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import PixelLogo from './pixel-logo.svelte';
import { initialFills, PALETTE } from '$lib/data/pixel-logo-geometry';

async function svgOf(): Promise<SVGSVGElement> {
	return (await page.getByTestId('pixel-logo').element()) as unknown as SVGSVGElement;
}

function fillsOf(svg: SVGSVGElement): string[] {
	return Array.from(svg.querySelectorAll('rect')).map((r) => r.getAttribute('fill') ?? '');
}

describe('pixel-logo.svelte', () => {
	it('rendert das Raster mit 296 Zellen', async () => {
		render(PixelLogo, { size: 240, animate: false });
		expect((await svgOf()).querySelectorAll('rect')).toHaveLength(296);
	});

	it('behält das Raster in Header-Größe bei und zeichnet es nur kleiner', async () => {
		render(PixelLogo, { size: 44, animate: false });
		const svg = await svgOf();
		expect(svg.querySelectorAll('rect')).toHaveLength(296);
		expect(svg.getAttribute('viewBox')).toBe('0 0 100 100');
		expect(svg.getAttribute('width')).toBe('44');
	});

	it('färbt jede Zelle mit einer Farbe aus der Palette', async () => {
		render(PixelLogo, { size: 240, animate: false });
		const fills = fillsOf(await svgOf());
		expect(fills.every((fill) => PALETTE.includes(fill))).toBe(true);
	});

	it('startet deterministisch, damit SSR-Markup und Hydration übereinstimmen', async () => {
		render(PixelLogo, { size: 240, animate: false });
		const first = fillsOf(await svgOf());
		const second = fillsOf(await svgOf());
		expect(first).toEqual(second);
	});

	it('meldet sich mit Titel als Bild an die Assistenztechnik', async () => {
		render(PixelLogo, { size: 240, title: 'navigator.berlin', animate: false });
		const svg = await svgOf();
		expect(svg.getAttribute('role')).toBe('img');
		expect(svg.getAttribute('aria-label')).toBe('navigator.berlin');
		expect(svg.querySelector('title')?.textContent).toBe('navigator.berlin');
	});

	it('versteckt sich ohne Titel vor der Assistenztechnik', async () => {
		render(PixelLogo, { size: 240, title: '', animate: false });
		const svg = await svgOf();
		expect(svg.getAttribute('aria-hidden')).toBe('true');
		expect(svg.getAttribute('role')).toBeNull();
	});

	it('meldet den Ladezustand als Status mit unsichtbarem Text', async () => {
		render(PixelLogo, { variant: 'loop', size: 128, loadingLabel: 'Karte wird geladen' });
		const status = (await page.getByRole('status').element()) as HTMLElement;
		expect(status.getAttribute('aria-live')).toBe('polite');
		expect(status.textContent).toContain('Karte wird geladen');
		expect((await svgOf()).getAttribute('aria-hidden')).toBe('true');
	});

	it('staffelt die Zellen des Loaders über gestreute Verzögerungen', async () => {
		render(PixelLogo, { variant: 'loop', size: 128 });
		const delays = Array.from((await svgOf()).querySelectorAll('rect')).map((r) =>
			r.getAttribute('style')
		);
		expect(new Set(delays).size).toBeGreaterThan(10);
	});

	it('zeichnet ohne Hintergrundfarbe keine Grundfläche', async () => {
		render(PixelLogo, { size: 240, animate: false });
		expect((await svgOf()).querySelector('rect[data-role="backdrop"]')).toBeNull();
	});

	it('lässt die Grundfläche des Loaders stehen, nur die Zellen blinken', async () => {
		render(PixelLogo, { variant: 'loop', size: 128, background: '#ECEAE0' });
		const svg = await svgOf();
		const backdrop = svg.querySelector('rect[data-role="backdrop"]') as SVGRectElement;
		const cell = svg.querySelector('rect:not([data-role="backdrop"])') as SVGRectElement;
		expect(getComputedStyle(backdrop).animationName).toBe('none');
		expect(getComputedStyle(cell).animationName).not.toBe('none');
	});

	it('zeichnet mit Hintergrundfarbe eine Grundfläche', async () => {
		render(PixelLogo, { size: 240, animate: false, background: '#ECEAE0' });
		const backdrop = (await svgOf()).querySelector('rect[data-role="backdrop"]');
		expect(backdrop?.getAttribute('fill')).toBe('#ECEAE0');
	});
});

describe('pixel-logo.svelte · Farbwechsel-Takt', () => {
	afterEach(() => {
		vi.useRealTimers();
		vi.restoreAllMocks();
	});

	it('invalidiert die abgeleiteten Farben, wenn der Takt neue Overlay-Keys setzt', async () => {
		vi.useFakeTimers();
		// Deterministisch: Zelle 0 bekommt sicher eine andere Farbe als ihren Startwert.
		const initial = PALETTE.indexOf(initialFills(1)[0]);
		const replacement = (initial + 1) / PALETTE.length;
		vi.spyOn(Math, 'random').mockReturnValueOnce(0).mockReturnValue(replacement);
		render(PixelLogo, { size: 240, animate: true, interval: 50, perTick: 1 });
		const before = fillsOf(await svgOf())[0];
		vi.advanceTimersByTime(60);
		const after = fillsOf(await svgOf())[0];
		expect(before).toBe(PALETTE[initial]);
		expect(after).toBe(PALETTE[(initial + 1) % PALETTE.length]);
	});
});
