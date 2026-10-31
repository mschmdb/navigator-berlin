import { userEvent } from 'vitest/browser';
import { flushSync } from 'svelte';
import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import type { Kennzahlen } from '$lib/stories/punkt-linie-kiez/types';
import PunktLinieKiez from './punkt-linie-kiez.svelte';

const fk: Kennzahlen = {
	slug: 'friedrichshain-kreuzberg',
	gruen: 0.4444,
	altbauAnteil: 0.5363,
	laermDb: 49.3,
	bewohnerProKm2: 14344,
	haltestelle400mAnteil: 0.994,
	clubs: 46
};
const NAME = 'Friedrichshain-Kreuzberg';

afterEach(() => overwriteGetLocale(() => 'de'));

const shape = (key: string): SVGElement | null =>
	document.querySelector(`[data-testid="plk-shape-${key}"]`);
const row = (key: string): HTMLElement =>
	document.querySelector(`[data-testid="plk-legend-${key}"]`) as HTMLElement;

describe('punkt-linie-kiez.svelte', () => {
	it('ist eine figure mit Textalternative, die Namen und Werte nennt', () => {
		render(PunktLinieKiez, { name: NAME, kennzahlen: fk });
		const figure = document.querySelector('figure')!;
		expect(figure).not.toBeNull();
		const svg = figure.querySelector('svg')!;
		expect(svg.getAttribute('aria-label')).toBe('punkt, linie, kiez: friedrichshain-kreuzberg');
		const desc = document.getElementById(svg.getAttribute('aria-describedby')!)!;
		expect(desc.textContent).toContain(NAME);
		expect(desc.textContent).not.toMatch(/\d/);
		expect(figure.querySelector('figcaption')?.textContent).toContain('friedrichshain-kreuzberg');
	});

	it('zeigt die Legende mit Form, Bedeutung und Wert (DE, klein)', () => {
		render(PunktLinieKiez, { name: NAME, kennzahlen: fk });
		expect(row('circle').textContent).toContain('kreis: grünversorgung');
		expect(row('circle').textContent).toContain('44 / 100');
		expect(row('lines').textContent).toContain('linien: haltestelle in 400 m');
		expect(row('donut').textContent).toContain('46');
	});

	it('zeigt die Legende auf Englisch', () => {
		overwriteGetLocale(() => 'en');
		render(PunktLinieKiez, { name: NAME, kennzahlen: fk });
		expect(row('circle').textContent).toContain('circle: green space');
		expect(row('bar').textContent).toContain('bar: residents per km²');
		expect(row('bar').textContent).toContain('14,344');
	});

	it('zeichnet alle sechs Zeichen für einen vollständigen Bezirk', () => {
		render(PunktLinieKiez, { name: NAME, kennzahlen: fk });
		for (const key of ['circle', 'square', 'triangle', 'bar', 'lines', 'donut']) {
			expect(shape(key), key).not.toBeNull();
		}
	});

	it('färbt die Zeichen nach den Tokens und gibt dem Dreieck eine Tinten-Kontur', () => {
		render(PunktLinieKiez, { name: NAME, kennzahlen: fk });
		expect(shape('circle')!.querySelector('circle')!.getAttribute('fill')).toBe('#3a8a55');
		expect(shape('square')!.querySelector('rect')!.getAttribute('fill')).toBe('#cf4128');
		const tri = shape('triangle')!.querySelector('path')!;
		expect(tri.getAttribute('fill')).toBe('#efbd2c');
		expect(tri.getAttribute('stroke')).toBe('#26221e');
		expect(shape('bar')!.querySelector('rect')!.getAttribute('fill')).toBe('#26221e');
	});

	it('zeichnet die Linien zuerst, unter allen Formen', () => {
		render(PunktLinieKiez, { name: NAME, kennzahlen: fk });
		const groups = [...document.querySelectorAll('figure svg:first-of-type > g')];
		expect(groups[0]!.getAttribute('data-testid')).toBe('plk-shape-lines');
		const shapes = groups.slice(1);
		expect(shapes.length).toBeGreaterThan(0);
		for (const key of ['circle', 'square', 'triangle', 'donut', 'bar']) {
			const el = shape(key)!;
			expect(
				groups[0]!.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING
			).toBeTruthy();
		}
		// Kein Blend-Modus: Farben bleiben die der Palette, in Miniatur und groß.
		expect(document.querySelector('figure [style*="mix-blend-mode"]')).toBeNull();
	});

	it('lässt ohne Clubs den Donut weg und schreibt 0', () => {
		render(PunktLinieKiez, { name: NAME, kennzahlen: { ...fk, clubs: 0 } });
		expect(shape('donut')).toBeNull();
		expect(row('donut').textContent).toContain('0');
	});

	it('lässt bei null das Dreieck weg und schreibt "keine Daten"', () => {
		render(PunktLinieKiez, { name: NAME, kennzahlen: { ...fk, laermDb: null } });
		expect(shape('triangle')).toBeNull();
		expect(row('triangle').textContent).toContain('keine Daten');
		expect(row('triangle').textContent).not.toMatch(/\d/);
	});

	it('macht jede Form per Tastatur fokussierbar und hebt Form und Legende hervor', async () => {
		render(PunktLinieKiez, { name: NAME, kennzahlen: fk });
		const circle = shape('circle') as unknown as HTMLElement;
		expect(circle.getAttribute('tabindex')).toBe('0');
		expect(circle.getAttribute('aria-label')).toBe('kreis: grünversorgung, 44 / 100');
		circle.focus();
		flushSync();
		expect(document.activeElement).toBe(circle);
		expect(circle.dataset.active).toBe('true');
		expect(row('circle').dataset.active).toBe('true');
		expect(shape('square')!.getAttribute('data-dimmed')).toBe('true');
		await userEvent.tab();
		flushSync();
		expect(document.activeElement).toBe(shape('square'));
		expect(circle.dataset.active).toBeUndefined();
		expect(row('circle').dataset.active).toBeUndefined();
		expect((shape('square') as unknown as HTMLElement).dataset.active).toBe('true');
	});

	it('hebt beim Hover über die Legende die Form hervor und beim Verlassen nicht mehr', async () => {
		render(PunktLinieKiez, { name: NAME, kennzahlen: fk });
		row('square').dispatchEvent(new PointerEvent('pointerenter', { bubbles: false }));
		await Promise.resolve();
		expect((shape('square') as unknown as HTMLElement).dataset.active).toBe('true');
		row('square').dispatchEvent(new PointerEvent('pointerleave', { bubbles: false }));
		await Promise.resolve();
		expect((shape('square') as unknown as HTMLElement).dataset.active).toBeUndefined();
	});

	it('ändert beim Hervorheben die Schriftstärke der Legende nicht (kein Umbruch, kein Springen)', async () => {
		render(PunktLinieKiez, { name: NAME, kennzahlen: fk });
		const before = getComputedStyle(row('lines')).fontWeight;
		const height = row('lines').getBoundingClientRect().height;
		row('lines').dispatchEvent(new PointerEvent('pointerenter', { bubbles: false }));
		await Promise.resolve();
		expect(row('lines').dataset.active).toBe('true');
		expect(getComputedStyle(row('lines')).fontWeight).toBe(before);
		expect(row('lines').getBoundingClientRect().height).toBe(height);
	});

	it('hebt beim Hover über die Form die Legendenzeile hervor', async () => {
		render(PunktLinieKiez, { name: NAME, kennzahlen: fk });
		shape('bar')!.dispatchEvent(new PointerEvent('pointerenter', { bubbles: false }));
		await Promise.resolve();
		expect(row('bar').dataset.active).toBe('true');
	});

	it('zeigt als Miniatur die Linien und den Donut, aber keine Legende', () => {
		render(PunktLinieKiez, { name: NAME, kennzahlen: fk, thumbnail: true, legend: false });
		expect(shape('lines')).not.toBeNull();
		expect(shape('donut')).not.toBeNull();
		expect(document.querySelector('[data-testid="plk-legend"]')).toBeNull();
	});

	it('ist dekorativ ohne Fokusziele, wenn ein Link den Namen trägt', () => {
		render(PunktLinieKiez, {
			name: NAME,
			kennzahlen: fk,
			thumbnail: true,
			legend: false,
			decorative: true
		});
		const figure = document.querySelector('figure')!;
		expect(figure.getAttribute('aria-hidden')).toBe('true');
		expect(figure.querySelectorAll('[tabindex]')).toHaveLength(0);
	});

	it('behält den Tastaturfokus, wenn der Pointer die Form verlässt', () => {
		render(PunktLinieKiez, { name: NAME, kennzahlen: fk });
		const circle = shape('circle') as unknown as HTMLElement;
		circle.focus();
		circle.dispatchEvent(new PointerEvent('pointerenter'));
		circle.dispatchEvent(new PointerEvent('pointerleave'));
		flushSync();
		expect(circle.dataset.active).toBe('true');
	});

	it('zeichnet den Balken im Fokus mit Tinten-Kontur', () => {
		render(PunktLinieKiez, { name: NAME, kennzahlen: fk });
		(shape('bar') as unknown as HTMLElement).focus();
		flushSync();
		const rect = shape('bar')!.querySelector('rect')!;
		expect(rect.getAttribute('stroke')).toBe('#26221e');
		expect(rect.getAttribute('stroke-width')).toBe('3');
	});

	it('hebt beim Hover über eine Legendenzeile ohne Form nichts hervor', () => {
		render(PunktLinieKiez, { name: NAME, kennzahlen: { ...fk, laermDb: null } });
		row('triangle').dispatchEvent(new PointerEvent('pointerenter'));
		flushSync();
		expect(document.querySelector('[data-dimmed="true"]')).toBeNull();
		expect(row('triangle').dataset.active).toBeUndefined();
	});

	it('rendert im bare-Modus nur das SVG ohne figure', () => {
		render(PunktLinieKiez, {
			name: NAME,
			kennzahlen: fk,
			thumbnail: true,
			legend: false,
			bare: true
		});
		expect(document.querySelector('figure')).toBeNull();
		expect(document.querySelector('svg')!.getAttribute('aria-hidden')).toBe('true');
		expect(document.querySelectorAll('[tabindex]')).toHaveLength(0);
	});

	it('zeigt die Miniatur mit derselben Geometrie wie die große Komposition', () => {
		const geoOf = (): string[] =>
			['lines', 'circle', 'square', 'triangle', 'donut', 'bar'].map((k) => {
				const el = shape(k)!;
				return [...el.querySelectorAll('*:not(title)')]
					.map((n) =>
						[
							'cx',
							'cy',
							'r',
							'x',
							'y',
							'x1',
							'y1',
							'y2',
							'width',
							'height',
							'd',
							'transform',
							'fill'
						]
							.map((a) => n.getAttribute(a))
							.join(',')
					)
					.join('|');
			});
		const large = render(PunktLinieKiez, { name: NAME, kennzahlen: fk, legend: false });
		const first = geoOf();
		large.unmount();
		render(PunktLinieKiez, {
			name: NAME,
			kennzahlen: fk,
			thumbnail: true,
			legend: false,
			bare: true
		});
		expect(geoOf()).toEqual(first);
	});

	it('rendert denselben Slug zweimal mit identischer Geometrie', () => {
		const a = render(PunktLinieKiez, { name: NAME, kennzahlen: fk, legend: false });
		const strip = (html: string): string => html.replace(/c\d+-desc/g, 'desc');
		const first = strip(document.querySelector('svg')!.innerHTML);
		a.unmount();
		render(PunktLinieKiez, { name: NAME, kennzahlen: fk, legend: false });
		expect(strip(document.querySelector('svg')!.innerHTML)).toBe(first);
	});

	it('nutzt keine Bewegung', () => {
		render(PunktLinieKiez, { name: NAME, kennzahlen: fk });
		for (const el of document.querySelectorAll('figure, figure *')) {
			const cs = getComputedStyle(el);
			expect(cs.transitionDuration, el.tagName).toMatch(/^0s(, 0s)*$/);
			expect(cs.animationName, el.tagName).toBe('none');
		}
	});
});
