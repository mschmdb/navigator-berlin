import '../../../app.css';
import { page } from 'vitest/browser';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import PixelLogo from './pixel-logo.svelte';
import css from './pixel-logo.css?raw';
import { buildGeometry, initialFills, PALETTE, PRESET } from '$lib/data/pixel-logo-geometry';

async function svgOf(): Promise<SVGSVGElement> {
	return (await page.getByTestId('pixel-logo').element()) as unknown as SVGSVGElement;
}

/** Zellen tragen eine Klasse `c<Index>`; die Farbe steht in PALETTE. */
function fillsOf(svg: SVGSVGElement): string[] {
	return Array.from(svg.querySelectorAll('use')).map((cell) => {
		const index = Number(/\bc(\d+)\b/.exec(cell.getAttribute('class') ?? '')?.[1]);
		return PALETTE[index] ?? '';
	});
}

describe('pixel-logo.svelte', () => {
	it('rendert das Raster mit 296 Zellen', async () => {
		render(PixelLogo, { size: 240, animate: false });
		expect((await svgOf()).querySelectorAll('use')).toHaveLength(296);
	});

	it('behält das Raster in Header-Größe bei und zeichnet es nur kleiner', async () => {
		render(PixelLogo, { size: 44, animate: false });
		const svg = await svgOf();
		expect(svg.querySelectorAll('use')).toHaveLength(296);
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
		const hidden = (await page.getByText('Karte wird geladen').element()) as HTMLElement;
		expect(getComputedStyle(hidden).position).toBe('absolute');
		expect(getComputedStyle(hidden).width).toBe('1px');
		expect((await svgOf()).getAttribute('aria-hidden')).toBe('true');
	});

	it('staffelt die Zellen des Loaders über gestreute Verzögerungen', async () => {
		render(PixelLogo, { variant: 'loop', size: 128 });
		const delays = Array.from((await svgOf()).querySelectorAll('use')).map((r) =>
			r.getAttribute('style')
		);
		expect(new Set(delays).size).toBeGreaterThan(10);
	});

	it('teilt eine Zellform über <defs> statt 296 Rechtecke auszuliefern', async () => {
		render(PixelLogo, { size: 240, animate: false });
		const svg = await svgOf();
		expect(svg.querySelectorAll('rect')).toHaveLength(1);
		const id = svg.querySelector('defs rect')?.id ?? '';
		expect(id).not.toBe('');
		expect(
			Array.from(svg.querySelectorAll('use')).every((u) => u.getAttribute('href') === `#${id}`)
		).toBe(true);
	});

	it('löst die Palette-Klasse in die echte Zellfarbe auf', async () => {
		render(PixelLogo, { size: 240, animate: false });
		const first = (await svgOf()).querySelector('use') as SVGUseElement;
		const probe = document.createElement('span');
		probe.style.color = initialFills(1)[0];
		document.body.append(probe);
		const expected = getComputedStyle(probe).color;
		probe.remove();
		expect(getComputedStyle(first).fill).toBe(expected);
	});

	it('setzt jede Zelle an die Position und Größe aus der Geometrie', async () => {
		render(PixelLogo, { size: 100, animate: false });
		const svg = await svgOf();
		const origin = svg.getBoundingClientRect();
		const geometry = buildGeometry(PRESET);
		const cells = Array.from(svg.querySelectorAll('use'));
		expect(cells).toHaveLength(geometry.cells.length);
		cells.forEach((use, i) => {
			const box = use.getBoundingClientRect();
			expect(Math.abs(box.left - origin.left - geometry.cells[i].x)).toBeLessThan(0.05);
			expect(Math.abs(box.top - origin.top - geometry.cells[i].y)).toBeLessThan(0.05);
			expect(Math.abs(box.width - geometry.size)).toBeLessThan(0.05);
			expect(Math.abs(box.height - geometry.size)).toBeLessThan(0.05);
		});
	});

	it('nutzt für alle Start- und Wechselfarben gültige Palette-Klassen', async () => {
		expect(initialFills(296).every((color) => PALETTE.indexOf(color) >= 0)).toBe(true);
		const classCount = new Set(css.match(/\.nv-pixel \.c\d+/g)).size;
		expect(classCount).toBe(PALETTE.length);
		render(PixelLogo, { size: 240, animate: false });
		const classes = Array.from((await svgOf()).querySelectorAll('use')).map(
			(u) => u.getAttribute('class') ?? ''
		);
		expect(classes.every((c) => /^c\d+$/.test(c) && Number(c.slice(1)) < PALETTE.length)).toBe(
			true
		);
	});

	it('behält die Fill-Folge aus dem Seed', async () => {
		render(PixelLogo, { size: 240, animate: false });
		expect(fillsOf(await svgOf())).toEqual(initialFills(296));
	});

	it('vergibt je Instanz eine eigene Zell-ID', async () => {
		render(PixelLogo, { size: 240, animate: false });
		render(PixelLogo, { size: 64, animate: false });
		const ids = Array.from(document.querySelectorAll('defs rect')).map((r) => r.id);
		expect(new Set(ids).size).toBe(2);
	});

	it('zeichnet ohne Hintergrundfarbe keine Grundfläche', async () => {
		render(PixelLogo, { size: 240, animate: false });
		expect((await svgOf()).querySelector('rect[data-role="backdrop"]')).toBeNull();
	});

	it('lässt die Grundfläche des Loaders stehen, nur die Zellen blinken', async () => {
		render(PixelLogo, { variant: 'loop', size: 128, background: '#ECEAE0' });
		const svg = await svgOf();
		const backdrop = svg.querySelector('rect[data-role="backdrop"]') as SVGRectElement;
		const cell = svg.querySelector('use') as SVGUseElement;
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
