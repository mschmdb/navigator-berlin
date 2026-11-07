import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import type { ElectionShares } from '$lib/stories/wahl-quadrate/types';
import { PARTY_COLORS } from '$lib/stories/wahl-quadrate/farben';
import { ORDER } from '$lib/stories/wahl-quadrate/parteien';
import fixtures from '$lib/stories/wahl-quadrate/fixtures/wahlen.json';
import Quadrat from './quadrat.svelte';

type Fixture = ElectionShares & { bezirk: string; wahl: string; jahr: number; turnout: number };
const all = fixtures as Fixture[];
const mitte11 = all.find((f) => f.bezirk === 'mitte' && f.wahl === 'agh' && f.jahr === 2011)!;
const TITLE = 'Mitte, Abgeordnetenhaus 2011';
const NB = '\u00a0';

afterEach(() => overwriteGetLocale(() => 'de'));

const svgOf = (c: HTMLElement): SVGSVGElement => c.querySelector('svg')!;
const rects = (c: HTMLElement): SVGRectElement[] => [...svgOf(c).querySelectorAll('rect')];
const texts = (c: HTMLElement): string[] =>
	[...svgOf(c).querySelectorAll('text')].map((t) => t.textContent ?? '');
const sized = async (c: HTMLElement, px: number): Promise<void> => {
	c.style.width = `${px}px`;
	await vi.waitFor(() => expect(svgOf(c).getBoundingClientRect().width).toBe(px));
	// ResizeObserver meldet die Breite einen Frame später.
	await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
	await vi.waitFor(() => expect(texts(c).length).toBeGreaterThan(0));
};

describe('quadrat.svelte', () => {
	it('ist ein Bild mit Namen, den drei größten Parteien und der Wahlbeteiligung', () => {
		const { container } = render(Quadrat, {
			election: mitte11,
			title: TITLE,
			turnout: mitte11.turnout
		});
		const svg = svgOf(container);
		expect(svg.getAttribute('role')).toBe('img');
		expect(svg.getAttribute('aria-label')).toBe(
			`Mitte, Abgeordnetenhaus 2011: SPD 28,7${NB}%, Grüne 22,5${NB}%, CDU 17,9${NB}%. Wahlbeteiligung 55,9${NB}%.`
		);
	});

	it('zeichnet einen Block je Partei in fester Reihenfolge mit den Quadratfarben', () => {
		const { container } = render(Quadrat, { election: mitte11, title: TITLE });
		const r = rects(container);
		expect(r).toHaveLength(ORDER.length);
		expect(r[ORDER.indexOf('spd')].getAttribute('fill')).toBe(PARTY_COLORS.spd);
		expect(r[ORDER.indexOf('rest')].getAttribute('fill')).toBe(PARTY_COLORS.rest);
	});

	it('bietet eine Tabelle mit allen Blöcken als Alternative, Grau mit Schwelle', () => {
		const { container } = render(Quadrat, {
			election: mitte11,
			title: TITLE,
			turnout: mitte11.turnout
		});
		const table = container.querySelector('table')!;
		expect(table.closest('.sr-only')).not.toBeNull();
		expect(table.querySelector('caption')?.textContent).toBe(TITLE);
		const rows = [...table.querySelectorAll('tbody tr')].map((tr) =>
			[...tr.children].map((c) => c.textContent)
		);
		expect(rows).toContainEqual(['Piraten', `10,5${NB}%`]);
		expect(rows).toContainEqual([`Grau, alle Parteien unter 5${NB}%`, `9,6${NB}%`]);
		expect(rows).toContainEqual(['Wahlbeteiligung', `55,9${NB}%`]);
		expect(rows.find((r) => r[0] === 'AfD')).toBeUndefined();
	});

	it('versteckt die Tabelle, ohne dass sie die Seite verbreitert', () => {
		const { container } = render(Quadrat, { election: mitte11, title: TITLE });
		container.style.width = '120px';
		const hidden = container.querySelector('table')!.closest('.sr-only')!;
		expect(hidden.getBoundingClientRect().width).toBeLessThanOrEqual(1);
		// Tabellen ignorieren Breite und Überlauf am eigenen Element, der Wrapper schneidet sie ab.
		expect(hidden.tagName).not.toBe('TABLE');
		expect(getComputedStyle(hidden).overflow).toBe('hidden');
	});

	it('spricht Englisch, wenn die Seite englisch ist', () => {
		overwriteGetLocale(() => 'en');
		const { container } = render(Quadrat, { election: mitte11, title: 'Mitte, 2011' });
		expect(svgOf(container).getAttribute('aria-label')).toBe(
			'Mitte, 2011: SPD 28.7%, Greens 22.5%, CDU 17.9%.'
		);
	});

	it('legt kleine Parteien nach der Schwelle ins Grau', () => {
		const { container } = render(Quadrat, { election: mitte11, title: TITLE, threshold: 0.11 });
		const area = (k: (typeof ORDER)[number]): number => {
			const r = rects(container)[ORDER.indexOf(k)];
			return Number(r.getAttribute('width')) * Number(r.getAttribute('height'));
		};
		expect(area('piraten')).toBe(0);
		expect(area('linke')).toBe(0);
		expect(area('rest')).toBeGreaterThan(2500);
	});

	it('setzt Zahlen in die Blöcke, sobald die Breite bekannt ist', async () => {
		const { container } = render(Quadrat, { election: mitte11, title: TITLE });
		await sized(container, 320);
		expect(texts(container)).toContain(`29${NB}%`);
		for (const t of svgOf(container).querySelectorAll('text'))
			expect(t.getAttribute('aria-hidden')).toBe('true');
	});

	it('zeigt ohne `numbers` keine Zahlen', async () => {
		const { container } = render(Quadrat, { election: mitte11, title: TITLE, numbers: false });
		container.style.width = '320px';
		await new Promise((r) => setTimeout(r, 50));
		expect(texts(container)).toHaveLength(0);
	});

	it('beschriftet schmal mit `insideOnly` nur innen, ohne Linien nach außen', async () => {
		const { container } = render(Quadrat, { election: mitte11, title: TITLE, insideOnly: true });
		await sized(container, 90);
		expect(texts(container).length).toBeGreaterThan(0);
		expect(svgOf(container).querySelectorAll('path')).toHaveLength(0);
	});

	it('beschriftet zu kleine Blöcke außen mit Linie', async () => {
		const { container } = render(Quadrat, { election: mitte11, title: TITLE });
		await sized(container, 60);
		expect(svgOf(container).querySelectorAll('path').length).toBeGreaterThan(0);
	});

	it('zeigt mit Nichtwählern die Eckmarken und füllt nur die Wahlbeteiligung', () => {
		const { container } = render(Quadrat, {
			election: mitte11,
			title: TITLE,
			turnout: mitte11.turnout,
			nonVoters: true
		});
		const right = Math.max(
			...rects(container).map((r) => Number(r.getAttribute('x')) + Number(r.getAttribute('width')))
		);
		expect(right).toBeCloseTo(mitte11.turnout * 100, 1);
		expect(svgOf(container).querySelector('path')?.getAttribute('d')).toMatch(/^M0 4V0H4/);
	});

	it('hebt eine Partei hervor und blasst die anderen ab', () => {
		const { container } = render(Quadrat, { election: mitte11, title: TITLE, highlight: 'spd' });
		const r = rects(container);
		expect(r[ORDER.indexOf('spd')].getAttribute('fill')).toBe(PARTY_COLORS.spd);
		expect(r[ORDER.indexOf('cdu')].getAttribute('fill')).not.toBe(PARTY_COLORS.cdu);
	});
});
