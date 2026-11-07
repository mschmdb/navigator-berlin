import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import type { StoriesWahlData } from '$lib/stories/wahl-quadrate/types';
import raw from '../../../../../static/data/stories-wahl.json';

const nav = vi.hoisted(() => ({ after: [] as (() => void)[] }));
vi.mock('$app/navigation', () => ({
	replaceState: vi.fn(),
	afterNavigate: (fn: () => void) => nav.after.push(fn)
}));
vi.mock('$app/state', () => ({ page: { state: {} } }));

const { default: AlleBezirke } = await import('./alle-bezirke.svelte');

const data = raw as unknown as StoriesWahlData;
const NB = ' ';

let writes: string[] = [];
const writeUrl = (href: string): void => {
	writes.push(href);
};

const BASE = 'https://navigator.berlin/stories/berlin-in-quadraten';

function mount(href = '', width = 1400) {
	const target = document.createElement('div');
	target.style.width = `${width}px`;
	document.body.append(target);
	let url = new URL(href, BASE);
	const r = render(AlleBezirke, { target, props: { data, readUrl: () => url, writeUrl } });
	/** Simuliert eine Client-Navigation auf derselben Seite, etwa einen Deep-Link im Text. */
	const navigate = (next: string): void => {
		url = new URL(next, BASE);
		nav.after.forEach((fn) => fn());
	};
	return { ...r, target, navigate };
}

const squares = (c: HTMLElement): SVGSVGElement[] => [
	...c.querySelectorAll<SVGSVGElement>('.bq-wall svg[role="img"]')
];
const pressed = (name: string | RegExp) =>
	page.getByRole('button', { name }).element().getAttribute('aria-pressed');
const status = (): string => document.querySelector('.bq-wsum[role="status"]')?.textContent ?? '';

beforeEach(async () => {
	writes = [];
	nav.after = [];
	await page.viewport(1440, 900);
});
afterEach(() => {
	overwriteGetLocale(() => 'de');
	document.body.replaceChildren();
});

describe('alle-bezirke.svelte', () => {
	it('zeigt 12 Bezirke mal 5 Abgeordnetenhauswahlen', async () => {
		const { target } = mount();
		await vi.waitFor(() => expect(squares(target)).toHaveLength(60));
		expect(squares(target)[0].getAttribute('aria-label')).toMatch(
			/^Charlottenburg-Wilmersdorf, Abgeordnetenhaus 2011: /
		);
	});

	it('zeigt 12 mal 4 Bundestagswahlen und beide Wahlarten untereinander', async () => {
		const btw = mount('?wahl=btw');
		await vi.waitFor(() => expect(squares(btw.target)).toHaveLength(48));
		document.body.replaceChildren();
		const both = mount('?wahl=both');
		await vi.waitFor(() => expect(squares(both.target)).toHaveLength(108));
		const titles = [...both.target.querySelectorAll('h3')].map((h) => h.textContent);
		expect(titles).toEqual(['Abgeordnetenhaus', 'Bundestag']);
	});

	it('sortiert die Bezirke standardmäßig nach Alphabet', async () => {
		const { target } = mount();
		await vi.waitFor(() => expect(target.querySelectorAll('.bq-rbtn').length).toBe(12));
		const names = [...target.querySelectorAll('.bq-rbtn')].map((b) => b.textContent?.trim());
		expect(names[0]).toBe('04 Charlottenburg-Wilmersdorf');
		expect(names.at(-1)).toBe('09 Treptow-Köpenick');
	});

	it('öffnet einen Deep-Link mit hervorgehobener Partei', async () => {
		mount('?hl=piraten#s6');
		await vi.waitFor(() => expect(pressed('Piraten')).toBe('true'));
		expect(pressed('SPD')).toBe('false');
		expect(status()).toContain('Piraten hervorgehoben');
		const sort = page.getByLabelText('Bezirke sortieren').element() as HTMLSelectElement;
		expect([...sort.options].map((o) => o.text)).toContain('Nach Anteil Piraten');
	});

	it('folgt Deep-Links, die auf derselben Seite navigieren', async () => {
		const { navigate } = mount();
		navigate('?hl=fdp#s6');
		await vi.waitFor(() => expect(pressed('FDP')).toBe('true'));
		navigate('?hl=piraten#s6');
		await vi.waitFor(() => expect(pressed('Piraten')).toBe('true'));
		expect(pressed('FDP')).toBe('false');
	});

	it('hebt eine Partei per Klick hervor und schreibt die URL mit Kapitel', async () => {
		mount('#s6');
		await page.getByRole('button', { name: 'SPD' }).click();
		expect(pressed('SPD')).toBe('true');
		expect(writes.at(-1)).toBe('/stories/berlin-in-quadraten?hl=spd#s6');
	});

	it('blendet eine Wahl aus, zeigt „Alles einblenden“ und blendet wieder alles ein', async () => {
		const { target } = mount();
		expect(page.getByRole('button', { name: 'Alles einblenden' }).query()).toBeNull();
		const y2011 = page.getByRole('button', { name: 'Abgeordnetenhaus 2011' });
		expect(y2011.element().getAttribute('aria-pressed')).toBe('true');
		await y2011.click();
		await vi.waitFor(() => expect(squares(target)).toHaveLength(48));
		expect(writes.at(-1)).toContain('y=a2016%2Ca2021%2Ca2023%2Ca2026');
		expect(status()).toContain('4 Wahlen');
		await page.getByRole('button', { name: 'Alles einblenden' }).click();
		await vi.waitFor(() => expect(squares(target)).toHaveLength(60));
		expect(page.getByRole('button', { name: 'Alles einblenden' }).query()).toBeNull();
	});

	it('blendet einen Bezirk aus und nennt ihn ausgeblendet', async () => {
		const { target } = mount();
		await page.getByRole('button', { name: '05 Spandau' }).click();
		await vi.waitFor(() => expect(squares(target)).toHaveLength(55));
		expect(pressed('Spandau ausgeblendet')).toBe('false');
		expect(status()).toContain('11 Bezirke');
	});

	it('setzt alles zurück', async () => {
		mount('?hl=cdu&thr=3&sort=nr');
		await page.getByRole('button', { name: 'Zurücksetzen' }).click();
		expect(pressed('CDU')).toBe('false');
		expect(writes.at(-1)).toBe('/stories/berlin-in-quadraten');
		expect(status()).toBe(`12 Bezirke, 5 Wahlen, Schwelle 5${NB}%`);
	});

	it('bedient die Jahresknöpfe per Tastatur, der Fokus bleibt stehen', async () => {
		mount();
		const b = page.getByRole('button', { name: 'Abgeordnetenhaus 2016' }).element() as HTMLElement;
		b.focus();
		await userEvent.keyboard('{Enter}');
		await vi.waitFor(() => expect(b.getAttribute('aria-pressed')).toBe('false'));
		expect(document.activeElement).toBe(b);
	});

	it('öffnet die Tooltips von Jahres- und Bezirksknöpfen nach unten', async () => {
		const { target } = mount();
		await vi.waitFor(() => expect(target.querySelectorAll('.bq-rbtn').length).toBe(12));
		const wraps = [...target.querySelectorAll('.bq-ybtn, .bq-rbtn')].map((b) =>
			b.closest('.bq-tipwrap')
		);
		expect(wraps.every((w) => w?.classList.contains('below'))).toBe(true);
	});

	it('hat an den Partei-Chips keinen Tooltip', async () => {
		mount();
		const chip = page.getByRole('button', { name: 'SPD' }).element();
		expect(chip.getAttribute('aria-describedby')).toBeNull();
	});

	it('erklärt Grau unter der Ansicht als Tabelle je Wahlart', async () => {
		const { target } = mount();
		expect(target.textContent).toContain(
			`Grau fasst alle Parteien unter 5${NB}% und die Sonstigen zusammen.`
		);
		const table = page.getByRole('table', { name: 'Abgeordnetenhaus: Grau in ganz Berlin' });
		const rows = [...table.element().querySelectorAll('tbody tr')];
		expect(rows).toHaveLength(5);
		const y2016 = rows.find((r) => r.firstElementChild?.textContent === '2016')!;
		expect(y2016.lastElementChild?.textContent).toMatch(/Piraten 1,7.%.*und Sonstige$/);
	});

	it('bietet Bildschirmlesern eine Tabelle der ganzen Ansicht statt 60 einzelner', async () => {
		const { target } = mount();
		const table = page.getByRole('table', {
			name: 'Abgeordnetenhaus: Zweitstimmen je Bezirk und Wahl'
		});
		const el = table.element();
		expect(el.closest('.bq-sr')).not.toBeNull();
		expect(el.querySelectorAll('tbody tr')).toHaveLength(60);
		const first = el.querySelector('tbody tr')!;
		expect(first.querySelector('th')?.textContent).toBe(
			'Charlottenburg-Wilmersdorf, Abgeordnetenhaus 2011'
		);
		expect(target.querySelectorAll('.bq-quadrat table')).toHaveLength(0);
		const cells = (row: Element): string[] => [...row.children].map((c) => c.textContent ?? '');
		const head = cells(el.querySelector('thead tr')!);
		const bsw = head.indexOf('BSW');
		const fdp = head.indexOf('FDP');
		// 2011 gab es kein BSW; die FDP lag in Charlottenburg-Wilmersdorf unter 5 %.
		expect(cells(first)[bsw]).toBe('nicht einzeln ausgewiesen');
		expect(cells(first)[fdp]).toBe('im Grau');
	});

	it('scrollt schmal nicht seitwärts, Namen stehen über ihrer Reihe, Zahlen nur im Block', async () => {
		await page.viewport(390, 844);
		const { target } = mount('', 358);
		await vi.waitFor(() => expect(target.querySelector('.bq-wall.narrow')).not.toBeNull());
		const box = target.querySelector<HTMLElement>('.bq-wbox')!;
		expect(box.scrollWidth).toBeLessThanOrEqual(box.clientWidth);
		expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(390);
		const name = page.getByRole('button', { name: '04 Charlottenburg-Wilmersdorf' }).element();
		const firstSq = squares(target)[0];
		expect(name.getBoundingClientRect().bottom).toBeLessThanOrEqual(
			firstSq.getBoundingClientRect().top
		);
		await vi.waitFor(() =>
			expect(target.querySelectorAll('.bq-wall svg text').length).toBeGreaterThan(0)
		);
		expect(target.querySelectorAll('.bq-wall svg path')).toHaveLength(0);
	});

	it('hält die Jahreszeile am Desktop oben', async () => {
		const { target } = mount();
		await vi.waitFor(() => expect(target.querySelector('.bq-whead')).not.toBeNull());
		expect(getComputedStyle(target.querySelector('.bq-whead')!).position).toBe('sticky');
	});

	it('spricht Englisch', async () => {
		overwriteGetLocale(() => 'en');
		mount();
		expect(page.getByRole('button', { name: 'State parliament 2011' }).query()).not.toBeNull();
		expect(status()).toBe('12 districts, 5 elections, threshold 5%');
	});
});
