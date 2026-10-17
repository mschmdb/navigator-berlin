import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import WaermeOrteCard from './waerme-orte-card.svelte';
import type { WaermeOrt } from '$lib/data/get-waerme-orte-index.js';

afterEach(() => {
	overwriteGetLocale(() => 'de');
	vi.useRealTimers();
});

const BASE: WaermeOrt = {
	id: 'a',
	name: 'Zentralbibliothek',
	cat: 'Bibliothek',
	lat: 52.52,
	lng: 13.4,
	winterOpen: 'yes',
	openingHoursNote: '',
	stayWithoutPurchase: 'yes',
	isFree: 'free',
	website: '',
	sourceUrl: 'https://example.org/bib',
	checkedAt: '2026-10-16',
	address: 'Beispielstraße 1',
	plz: '10115',
	openingHours: '',
	googleMapsUrl: 'https://maps.google.com/?q=52.52,13.4',
	appleMapsUrl: 'https://maps.apple.com/?q=52.52,13.4'
};

const MUSEUM: WaermeOrt = {
	...BASE,
	id: 'b',
	name: 'Stadtmuseum',
	cat: 'Museum',
	lat: 52.53,
	winterOpen: 'unknown',
	stayWithoutPurchase: 'unknown',
	isFree: 'unknown',
	sourceUrl: '',
	checkedAt: ''
};

const ADDRESS = { lat: 52.52, lng: 13.4 };

function props(over: Record<string, unknown> = {}) {
	return {
		layerName: 'Warme Orte',
		address: ADDRESS,
		index: [BASE, MUSEUM],
		isActive: true,
		...over
	};
}

describe('waerme-orte-card.svelte', () => {
	it('zeigt die nächsten Orte mit Distanz, Kategorie und Winter-Angaben', async () => {
		render(WaermeOrteCard, props());
		const items = document.querySelectorAll('[data-testid="waerme-orte-item"]');
		expect(items).toHaveLength(2);
		expect(items[0]!.textContent).toContain('Zentralbibliothek');
		expect(items[0]!.textContent).toContain('Bibliothek');
		expect(items[0]!.textContent).toContain('Im Winter geöffnet');
		expect(items[0]!.textContent).toContain('Aufenthalt ohne Konsum: ja');
		expect(items[0]!.textContent).toContain('Eintritt frei');
		expect(items[0]!.textContent).toContain('Quelle');
		expect(items[0]!.textContent).toContain('geprüft am');
	});

	it('zeigt unknown als „nicht geprüft“, nie als Ja', async () => {
		render(WaermeOrteCard, props());
		const second = document.querySelectorAll('[data-testid="waerme-orte-item"]')[1]!;
		expect(second.textContent).toContain('Winter-Öffnung: nicht geprüft');
		expect(second.textContent).toContain('Aufenthalt ohne Konsum: nicht geprüft');
		expect(second.textContent).toContain('Eintritt: nicht geprüft');
		expect(second.textContent).toContain('Keine Quelle hinterlegt');
	});

	it('zeigt Status „laut OSM“ nur mit oh', async () => {
		vi.useFakeTimers({ toFake: ['Date'] });
		vi.setSystemTime(new Date('2026-10-14T10:00:00Z'));
		render(
			WaermeOrteCard,
			props({ index: [{ ...BASE, openingHours: 'Mo-Su 00:00-24:00' }, MUSEUM] })
		);
		const statuses = document.querySelectorAll('[data-testid="waerme-orte-status"]');
		expect(statuses).toHaveLength(1);
		expect(statuses[0]!.textContent).toContain('laut OSM');
	});

	it('begrenzt auf 5 Orte', async () => {
		const many = Array.from({ length: 8 }, (_, i) => ({
			...BASE,
			id: `x${i}`,
			name: `Ort ${i}`,
			lat: 52.52 + i * 0.001
		}));
		render(WaermeOrteCard, props({ index: many }));
		expect(document.querySelectorAll('[data-testid="waerme-orte-item"]')).toHaveLength(5);
	});

	it('Kategorie-Filter schränkt die Liste ein und setzt aria-pressed', async () => {
		render(WaermeOrteCard, props());
		const museumChip = page.getByRole('button', { name: 'Museum', exact: true });
		await museumChip.click();
		await expect.element(museumChip).toHaveAttribute('aria-pressed', 'true');
		const items = document.querySelectorAll('[data-testid="waerme-orte-item"]');
		expect(items).toHaveLength(1);
		expect(items[0]!.textContent).toContain('Stadtmuseum');
	});

	it('zeigt Ladehinweis ohne Index', async () => {
		render(WaermeOrteCard, props({ index: null }));
		await expect.element(page.getByTestId('waerme-orte-loading')).toBeVisible();
		expect(document.querySelector('[data-testid="waerme-orte-list"]')).toBeNull();
	});

	it('zeigt Fehlerhinweis statt Absturz', async () => {
		render(WaermeOrteCard, props({ index: null, loadError: true }));
		await expect.element(page.getByTestId('waerme-orte-load-error')).toBeVisible();
		expect(document.querySelector('[data-testid="waerme-orte-loading"]')).toBeNull();
	});

	it('zeigt bei inaktivem Layer Hinweis mit Einblenden-Button statt Liste', async () => {
		const onToggleLayer = vi.fn();
		render(WaermeOrteCard, props({ isActive: false, onToggleLayer }));
		expect(document.querySelector('[data-testid="waerme-orte-list"]')).toBeNull();
		await page.getByTestId('waerme-orte-show-layer').click();
		expect(onToggleLayer).toHaveBeenCalledWith('waerme-orte');
	});

	it('Map-Toggle meldet den Slug', async () => {
		const onToggleLayer = vi.fn();
		render(WaermeOrteCard, props({ onToggleLayer }));
		await page.getByTestId('map-toggle').click();
		expect(onToggleLayer).toHaveBeenCalledWith('waerme-orte');
	});

	it('Details zeigen Erklärtext, Disclaimer und Opt-out-Mailto', async () => {
		render(WaermeOrteCard, props());
		const toggle = page.getByTestId('card-details-toggle');
		await expect.element(toggle).toHaveAttribute('aria-expanded', 'false');
		await toggle.click();
		await expect.element(page.getByTestId('card-details')).toBeVisible();
		const link = (await page.getByTestId('card-opt-out').element()) as HTMLAnchorElement;
		expect(link.getAttribute('href')?.startsWith('mailto:')).toBe(true);
		expect(link.getAttribute('aria-label')).toBeTruthy();
	});

	it('Navi- und Melde-Links je Ort', async () => {
		render(WaermeOrteCard, props({ index: [BASE] }));
		await expect
			.element(page.getByTestId('navi-google'))
			.toHaveAttribute('href', BASE.googleMapsUrl);
		await expect.element(page.getByTestId('navi-apple')).toHaveAttribute('href', BASE.appleMapsUrl);
		const melden = (await page.getByTestId('waerme-orte-melden').element()) as HTMLAnchorElement;
		expect(melden.getAttribute('href')?.startsWith('mailto:')).toBe(true);
	});

	it('lang="en": UI englisch, Ortsname mit lang="de"', async () => {
		overwriteGetLocale(() => 'en');
		render(WaermeOrteCard, props({ layerName: 'Warm places', lang: 'en' }));
		const first = document.querySelectorAll('[data-testid="waerme-orte-item"]')[0]!;
		expect(first.textContent).toContain('Open in winter');
		expect(first.textContent).not.toContain('Im Winter');
		expect(first.querySelector('[lang="de"]')?.textContent).toContain('Zentralbibliothek');
		await expect.element(page.getByRole('button', { name: 'All' })).toBeVisible();
	});

	it('EN: Ladehinweis englisch', async () => {
		overwriteGetLocale(() => 'en');
		render(WaermeOrteCard, props({ index: null, lang: 'en' }));
		await expect.element(page.getByTestId('waerme-orte-loading')).toHaveTextContent(/Loading/);
	});

	it('ohne Adresse: kein Absturz, keine Liste', async () => {
		render(WaermeOrteCard, props({ address: null }));
		expect(document.querySelector('[data-testid="waerme-orte-list"]')).toBeNull();
	});
});
