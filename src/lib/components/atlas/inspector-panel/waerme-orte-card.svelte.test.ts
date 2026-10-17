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
	hoursSource: null,
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

	it('zeigt Status „laut Recherche“ bei Recherche-Zeiten, auch auf EN', async () => {
		vi.useFakeTimers({ toFake: ['Date'] });
		vi.setSystemTime(new Date('2026-10-14T10:00:00Z'));
		const index = [
			{ ...BASE, openingHours: 'Mo-Su 00:00-24:00', hoursSource: 'recherche' as const }
		];
		const view = render(WaermeOrteCard, props({ index }));
		const status = document.querySelector('[data-testid="waerme-orte-status"]')!;
		expect(status.textContent).toBe('laut Recherche: jetzt offen');
		view.unmount();
		overwriteGetLocale(() => 'en');
		render(WaermeOrteCard, props({ index }));
		expect(document.querySelector('[data-testid="waerme-orte-status"]')!.textContent).toBe(
			'per research: open now'
		);
	});

	it('zeigt bei hoursSource „unklar“ keinen Status', async () => {
		render(
			WaermeOrteCard,
			props({ index: [{ ...BASE, openingHours: '', hoursSource: 'unklar' as const }] })
		);
		expect(document.querySelectorAll('[data-testid="waerme-orte-status"]')).toHaveLength(0);
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

	describe('Filter „jetzt offen“', () => {
		const NOON = new Date('2026-10-14T10:00:00Z');
		const OFFEN: WaermeOrt = {
			...BASE,
			id: 'o',
			name: 'Offene Bibliothek',
			openingHours: 'Mo-Su 00:00-24:00'
		};
		const ZU: WaermeOrt = {
			...BASE,
			id: 'z',
			name: 'Zu Bibliothek',
			openingHours: 'Mo-Su 03:00-03:01'
		};
		const OFFENES_MUSEUM: WaermeOrt = {
			...MUSEUM,
			id: 'm',
			name: 'Offenes Museum',
			openingHours: 'Mo-Su 00:00-24:00'
		};
		const OHNE: WaermeOrt = { ...BASE, id: 'x', name: 'Ohne Zeiten', openingHours: '' };

		function itemNames(): string[] {
			return [...document.querySelectorAll('[data-testid="waerme-orte-item"]')].map((el) =>
				el.querySelector('span')!.textContent!.trim()
			);
		}

		it('Chip ist ein aria-pressed-Umschalter, Default aus, alle Orte sichtbar', async () => {
			vi.useFakeTimers({ toFake: ['Date'] });
			vi.setSystemTime(NOON);
			render(WaermeOrteCard, props({ index: [OFFEN, ZU, OHNE] }));
			const chip = page.getByTestId('waerme-orte-filter-offen');
			await expect.element(chip).toHaveAttribute('aria-pressed', 'false');
			await expect.element(chip).toHaveTextContent('jetzt offen');
			expect(itemNames()).toHaveLength(3);
		});

		it('zeigt bei aktivem Filter nur offene Orte, ohne oh ausgeblendet', async () => {
			vi.useFakeTimers({ toFake: ['Date'] });
			vi.setSystemTime(NOON);
			render(WaermeOrteCard, props({ index: [OFFEN, ZU, OHNE] }));
			const chip = page.getByTestId('waerme-orte-filter-offen');
			await chip.click();
			await expect.element(chip).toHaveAttribute('aria-pressed', 'true');
			expect(itemNames()).toEqual(['Offene Bibliothek']);
			await chip.click();
			await expect.element(chip).toHaveAttribute('aria-pressed', 'false');
			expect(itemNames()).toHaveLength(3);
		});

		it('kombiniert mit Kategorie (UND)', async () => {
			vi.useFakeTimers({ toFake: ['Date'] });
			vi.setSystemTime(NOON);
			render(WaermeOrteCard, props({ index: [OFFEN, ZU, OFFENES_MUSEUM] }));
			await page.getByTestId('waerme-orte-filter-offen').click();
			await page.getByRole('button', { name: 'Museum', exact: true }).click();
			expect(itemNames()).toEqual(['Offenes Museum']);
		});

		it('zeigt Leertext, wenn nichts offen ist', async () => {
			vi.useFakeTimers({ toFake: ['Date'] });
			vi.setSystemTime(NOON);
			render(WaermeOrteCard, props({ index: [ZU, OHNE] }));
			await page.getByTestId('waerme-orte-filter-offen').click();
			expect(document.querySelector('[data-testid="waerme-orte-list"]')).toBeNull();
			await expect
				.element(page.getByTestId('waerme-orte-empty'))
				.toHaveTextContent('Gerade ist kein passender Ort offen');
		});

		it('meldet bei 0 Treffern den Leertext statt „0 von 0“', async () => {
			vi.useFakeTimers({ toFake: ['Date'] });
			vi.setSystemTime(NOON);
			const live = document.createElement('div');
			live.id = 'global-aria-live';
			document.body.appendChild(live);
			render(WaermeOrteCard, props({ index: [ZU] }));
			await page.getByTestId('waerme-orte-filter-offen').click();
			expect(live.textContent).toBe(
				'Gerade ist kein passender Ort offen. Schalte „jetzt offen“ aus, um alle Orte zu sehen.'
			);
			live.remove();
		});

		it('EN: Leertext bei aktivem Filter', async () => {
			vi.useFakeTimers({ toFake: ['Date'] });
			vi.setSystemTime(NOON);
			render(WaermeOrteCard, props({ lang: 'en', index: [ZU] }));
			await page.getByTestId('waerme-orte-filter-offen').click();
			await expect
				.element(page.getByTestId('waerme-orte-empty'))
				.toHaveTextContent(
					'No matching place is open right now. Turn off “open now” to see all places.'
				);
		});

		it('Filter aus und kein Ort: Standard-Leertext', async () => {
			render(WaermeOrteCard, props({ index: [] }));
			await expect
				.element(page.getByTestId('waerme-orte-empty'))
				.toHaveTextContent('In dieser Kategorie gibt es keine Orte.');
		});

		it('meldet die Anzahl per Live-Region', async () => {
			vi.useFakeTimers({ toFake: ['Date'] });
			vi.setSystemTime(NOON);
			const live = document.createElement('div');
			live.id = 'global-aria-live';
			document.body.appendChild(live);
			render(WaermeOrteCard, props({ index: [OFFEN, ZU, OHNE] }));
			await page.getByTestId('waerme-orte-filter-offen').click();
			expect(live.textContent).toBe('1 von 1 Orten, nächste zuerst');
			live.remove();
		});

		it('EN: Chip heißt „open now“', async () => {
			render(WaermeOrteCard, props({ lang: 'en', index: [OFFEN] }));
			await expect
				.element(page.getByTestId('waerme-orte-filter-offen'))
				.toHaveTextContent('open now');
		});
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
