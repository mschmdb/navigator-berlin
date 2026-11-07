import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import raw from '../../../../../static/data/stories-wahl.json';
import { toHandbuchDaten } from '$lib/stories/wahl-quadrate/handbuch-daten';
import type { StoriesWahlData } from '$lib/stories/wahl-quadrate/types';
import Handbuch from './handbuch.svelte';

const daten = toHandbuchDaten(raw as StoriesWahlData);
const NB = ' ';

const sections = [
	{ id: null, heading: null, html: '<p>Lead.</p>' },
	{ id: 'anlaeufe', heading: 'Zwanzig Anläufe', html: '<p>Skizzen.</p>' },
	...[1, 2, 3, 4, 5, 6].map((n) => ({
		id: `s${n}`,
		heading: `Kapitel ${n}`,
		html: `<p>T${n}</p>`
	})),
	{ id: 'quellen', heading: 'Quellen und Regeln', html: '<ul><li>Daten.</li></ul>' }
];

const props = {
	title: 'Berlin in Quadraten',
	date: '2026-11-07',
	dateLabel: '7. November 2026',
	sections,
	daten
};

afterEach(() => overwriteGetLocale(() => 'de'));

const section = (id: string): HTMLElement => document.getElementById(id)!;
const fig = (id: string): HTMLElement => section(id).querySelector('[role="group"]')!;
const greyLines = (el: HTMLElement): string[] =>
	[...el.querySelectorAll('[data-testid="hb-grey"]')].map((e) => e.textContent ?? '');
const button = (el: HTMLElement, name: string): HTMLButtonElement =>
	[...el.querySelectorAll('button')].find((b) => b.textContent?.trim() === name)!;
const frame = (): Promise<void> =>
	new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));

describe('handbuch.svelte', () => {
	it('zeigt Titel, Lead und Kapitel mit Anker, Nummer nur für Sehende', () => {
		render(Handbuch, props);
		expect(document.querySelector('h1')?.textContent).toBe('Berlin in Quadraten');
		expect(document.querySelector('time')?.getAttribute('datetime')).toBe('2026-11-07');
		const h2 = section('s3').querySelector('h2')!;
		expect(h2.querySelector('[aria-hidden="true"]')?.textContent).toBe('3');
		expect(h2.textContent?.replace('3', '')).toBe('Kapitel 3');
		expect(section('anlaeufe').querySelector('h2 [aria-hidden]')).toBeNull();
		expect(section('s1').getAttribute('aria-labelledby')).toBe(h2.id.replace('3', '1'));
	});

	it('Kapitel 1: Friedrichshain-Kreuzberg, Abgeordnetenhaus 2026, Linke vorn', () => {
		render(Handbuch, props);
		expect(fig('s1').getAttribute('aria-label')).toBe(
			'Beispiel: Friedrichshain-Kreuzberg, Abgeordnetenhaus 2026'
		);
		expect(fig('s1').querySelector('svg')?.getAttribute('aria-label')).toMatch(
			new RegExp(`^Friedrichshain-Kreuzberg, Abgeordnetenhaus 2026: Die Linke 44,\\d${NB}%`)
		);
		expect(fig('s1').textContent).toContain(`Wahlbeteiligung`);
		expect(greyLines(fig('s1'))[0]).toMatch(/^Grau \d+/);
	});

	it('Kapitel 2: Der Regler auf 0 leert das Grau bis auf die Sonstigen', async () => {
		render(Handbuch, props);
		const before = greyLines(fig('s2'))[0];
		const input = fig('s2').querySelector<HTMLInputElement>('input[type="range"]')!;
		expect(input.value).toBe('5');
		input.value = '0';
		input.dispatchEvent(new Event('input', { bubbles: true }));
		await vi.waitFor(() => expect(greyLines(fig('s2'))[0]).not.toBe(before));
	});

	it('Kapitel 3: zwei Quadrate 2016 und 2026, „Nach Größe“ gilt für beide', async () => {
		render(Handbuch, props);
		const svgs = [...fig('s3').querySelectorAll('svg')];
		expect(svgs.map((s) => s.getAttribute('aria-label')?.split(':')[0])).toEqual([
			'Friedrichshain-Kreuzberg, Abgeordnetenhaus 2016',
			'Friedrichshain-Kreuzberg, Abgeordnetenhaus 2026'
		]);
		const firstX = (): string[] =>
			svgs.map((s) =>
				[...s.querySelectorAll('rect')]
					.filter((r) => r.getAttribute('x') === '0' && r.getAttribute('y') === '0')
					.map((r) => r.getAttribute('fill') ?? '')
					.join()
			);
		const fixed = firstX();
		button(fig('s3'), 'Nach Größe').click();
		await vi.waitFor(() => expect(firstX()).not.toEqual(fixed));
		expect(button(fig('s3'), 'Nach Größe').getAttribute('aria-pressed')).toBe('true');
	});

	it('Kapitel 4: startet mit eingeschalteten Nichtwählern und Eckmarken', async () => {
		render(Handbuch, props);
		const toggle = fig('s4').querySelector('button[aria-pressed]')!;
		expect(toggle.getAttribute('aria-pressed')).toBe('true');
		expect(fig('s4').querySelector('svg path')).not.toBeNull();
		(toggle as HTMLButtonElement).click();
		await vi.waitFor(() => expect(toggle.getAttribute('aria-pressed')).toBe('false'));
		expect(fig('s4').querySelector('svg path[d^="M0 4"]')).toBeNull();
	});

	it('Kapitel 5: Bezirk und Wahl wählen, Reihe passt sich an, BTW mit Fußnote', async () => {
		const onzeit = vi.fn();
		render(Handbuch, { ...props, onzeit });
		const series = (): HTMLElement => fig('s5').querySelector('ol')!;
		expect(series().children).toHaveLength(5);
		expect(fig('s5').textContent).not.toContain('Wiederholungswahl');

		const select = fig('s5').querySelector('select')!;
		select.value = 'mitte';
		select.dispatchEvent(new Event('change', { bubbles: true }));
		await vi.waitFor(() =>
			expect(onzeit).toHaveBeenLastCalledWith({ bezirk: 'mitte', wahl: 'agh' })
		);
		expect(series().getAttribute('aria-label')).toBe('Mitte, Abgeordnetenhaus');

		button(fig('s5'), 'Bundestag').click();
		await vi.waitFor(() => expect(series().children).toHaveLength(4));
		expect(onzeit).toHaveBeenLastCalledWith({ bezirk: 'mitte', wahl: 'btw' });
		expect(fig('s5').textContent).toContain('Wiederholungswahl vom Februar 2024');
	});

	it('Kapitel 5: übernimmt Bezirk und Wahl aus `zeit`', () => {
		render(Handbuch, { ...props, zeit: { bezirk: 'pankow', wahl: 'btw' } });
		expect(fig('s5').querySelector('select')?.value).toBe('pankow');
		expect(fig('s5').querySelector('ol')?.children).toHaveLength(4);
	});

	it('Kapitel 5: Anhalten und Abspielen', async () => {
		render(Handbuch, props);
		const pause = button(fig('s5'), 'Anhalten');
		expect(pause).toBeTruthy();
		pause.click();
		await vi.waitFor(() => expect(button(fig('s5'), 'Abspielen')).toBeTruthy());
	});

	it('Kapitel 5: Die Karte über der Reihe hat eine feste Größe', async () => {
		render(Handbuch, props);
		const card = fig('s5').querySelector<HTMLElement>('[data-testid="hb-anim"]')!;
		await frame();
		const h0 = card.getBoundingClientRect().height;
		expect(h0).toBeGreaterThan(300);
		// Die Tailwind-Klasse `.fixed` setzt position: fixed. Tests laden app.css nicht, darum per Name.
		expect(card.querySelector('.fixed')).toBeNull();
		const select = fig('s5').querySelector('select')!;
		select.value = 'marzahn-hellersdorf';
		select.dispatchEvent(new Event('change', { bubbles: true }));
		await frame();
		expect(card.getBoundingClientRect().height).toBe(h0);
	});

	it('Kapitel 6: Überschrift, Text und Platzhalter', () => {
		render(Handbuch, props);
		expect(section('s6').querySelector('h2')?.textContent).toContain('Kapitel 6');
		expect(section('s6').textContent).toContain('T6');
		expect(section('s6').querySelector('[data-testid="hb-alle-platzhalter"]')).not.toBeNull();
	});

	it('Quellen: Legende mit allen Parteien und Grau', () => {
		render(Handbuch, props);
		const items = [...section('quellen').querySelectorAll('[data-testid="hb-legende"] li')].map(
			(li) => li.textContent?.trim()
		);
		expect(items).toHaveLength(9);
		expect(items).toContain('Piraten');
		expect(items.at(-1)).toBe(`Grau: alle Parteien unter 5${NB}%`);
	});

	it('spricht Englisch auf der englischen Seite', () => {
		overwriteGetLocale(() => 'en');
		render(Handbuch, props);
		expect(fig('s1').getAttribute('aria-label')).toBe(
			'Example: Friedrichshain-Kreuzberg, House of Representatives 2026'
		);
		expect(button(fig('s3'), 'By size')).toBeTruthy();
		expect(button(fig('s5'), 'Pause')).toBeTruthy();
	});
	it('zeigt keine Implementierungsnotizen aus dem Komponentenkommentar', () => {
		const { container } = render(Handbuch, props);
		expect(container.textContent).not.toContain('runde-20-ux');
	});
});
