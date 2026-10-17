import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import WarmeOrteNaehe from './warme-orte-naehe.svelte';
import type { WaermeOrt } from '$lib/data/get-waerme-orte-index.js';
import type { PositionResult } from '$lib/utils/geolocation.js';

const NOW = new Date(2026, 9, 21, 12, 0, 0);

function ort(over: Partial<WaermeOrt> & Pick<WaermeOrt, 'id' | 'name'>): WaermeOrt {
	return {
		cat: 'Bibliothek',
		lat: 52.52,
		lng: 13.405,
		winterOpen: 'yes',
		openingHoursNote: '',
		stayWithoutPurchase: 'unknown',
		isFree: 'unknown',
		website: '',
		sourceUrl: 'https://example.org/quelle',
		checkedAt: '2026-10-16',
		address: 'Teststr. 1',
		plz: '10115',
		openingHours: '',
		hoursSource: null,
		googleMapsUrl: 'https://www.google.com/maps/dir/?api=1&destination=52.52,13.405',
		appleMapsUrl: 'https://maps.apple.com/?daddr=52.52,13.405',
		...over
	};
}

const okPosition = async (): Promise<PositionResult> => ({ ok: true, lat: 52.52, lng: 13.405 });

afterEach(() => overwriteGetLocale(() => 'de'));

function mount(orte: WaermeOrt[], over: Record<string, unknown> = {}) {
	return render(WarmeOrteNaehe, {
		requestPositionFn: okPosition,
		loadIndex: async () => orte,
		now: NOW,
		...over
	});
}

describe('WarmeOrteNaehe', () => {
	it('zeigt nach Klick die 5 nächsten Orte mit Distanz, Kategorie, Adresse und Quelle', async () => {
		const orte = Array.from({ length: 7 }, (_, i) =>
			ort({ id: `node/${i}`, name: `Ort ${i}`, lat: 52.52 + i * 0.001 })
		);
		mount(orte);
		await page.getByTestId('waerme-locate').click();
		await expect.element(page.getByTestId('waerme-list')).toBeInTheDocument();
		expect(document.querySelectorAll('[data-testid="waerme-ort"]').length).toBe(5);
		const first = document.querySelector('[data-testid="waerme-ort"]')!;
		expect(first.textContent).toContain('Ort 0');
		expect(first.textContent).toContain('Bibliothek');
		expect(first.textContent).toContain('Teststr. 1');
		expect(first.querySelector('a[href="https://example.org/quelle"]')).not.toBeNull();
		expect(first.textContent).toContain('geprüft am 16. Oktober 2026');
	});

	it('zeigt unbelegte Angaben als „nicht geprüft“, nie als Ja', async () => {
		mount([ort({ id: 'node/1', name: 'Unbelegt', winterOpen: 'unknown' })]);
		await page.getByTestId('waerme-locate').click();
		const text = document.querySelector('[data-testid="waerme-ort"]')!.textContent!;
		expect(text).toContain('Aufenthalt ohne Konsum: nicht geprüft');
		expect(text).toContain('Winter-Öffnung: nicht geprüft');
		expect(text).toContain('Eintritt: nicht geprüft');
		expect(text).not.toContain('Aufenthalt ohne Konsum: ja');
	});

	it('zeigt belegte Angaben', async () => {
		mount([
			ort({
				id: 'node/1',
				name: 'Belegt',
				stayWithoutPurchase: 'yes',
				isFree: 'free',
				winterOpen: 'limited'
			})
		]);
		await page.getByTestId('waerme-locate').click();
		const text = document.querySelector('[data-testid="waerme-ort"]')!.textContent!;
		expect(text).toContain('Aufenthalt ohne Konsum: ja');
		expect(text).toContain('Eintritt frei');
		expect(text).toContain('Im Winter eingeschränkt geöffnet');
	});

	it('zeigt Offen-Status nur mit oh, sonst nur die Zeiten-Notiz', async () => {
		mount([
			ort({ id: 'node/1', name: 'Mit oh', openingHours: 'Mo-Su 00:00-24:00', lat: 52.5201 }),
			ort({
				id: 'node/2',
				name: 'Ohne oh',
				openingHours: '',
				openingHoursNote: 'Dienstag 14 bis 18 Uhr',
				lat: 52.53
			})
		]);
		await page.getByTestId('waerme-locate').click();
		const items = document.querySelectorAll('[data-testid="waerme-ort"]');
		expect(items[0].textContent).toContain('jetzt offen');
		expect(items[1].querySelector('[data-testid="waerme-status"]')).toBeNull();
		expect(items[1].textContent).toContain('Dienstag 14 bis 18 Uhr');
	});

	it('filtert per Kategorie-Chip und zeigt den Zähler', async () => {
		mount([
			ort({ id: 'node/1', name: 'Bib', cat: 'Bibliothek' }),
			ort({ id: 'node/2', name: 'Mus', cat: 'Museum' })
		]);
		await page.getByTestId('waerme-locate').click();
		await page.getByRole('button', { name: 'Museum' }).click();
		expect(document.querySelectorAll('[data-testid="waerme-ort"]').length).toBe(1);
		expect(document.querySelector('[data-testid="waerme-ort"]')!.textContent).toContain('Mus');
		await expect
			.element(page.getByRole('button', { name: 'Museum' }))
			.toHaveAttribute('aria-pressed', 'true');
		await expect.element(page.getByTestId('waerme-zaehler')).toHaveTextContent('1 von 1 Orten');
	});

	it('Melde-Link enthält Ortsname und ID im Betreff', async () => {
		mount([ort({ id: 'node/42', name: 'Bibliothek Süd' })]);
		await page.getByTestId('waerme-locate').click();
		const link = document.querySelector<HTMLAnchorElement>('[data-testid="waerme-melden"]')!;
		const href = link.getAttribute('href')!;
		expect(href.startsWith('mailto:')).toBe(true);
		const subject = decodeURIComponent(href.match(/subject=([^&]+)/)![1]);
		expect(subject).toContain('Bibliothek Süd');
		expect(subject).toContain('node/42');
	});

	it('verlinkt Google und Apple Maps', async () => {
		mount([ort({ id: 'node/1', name: 'Nav' })]);
		await page.getByTestId('waerme-locate').click();
		expect(document.querySelector('a[href^="https://www.google.com/maps"]')).not.toBeNull();
		expect(document.querySelector('a[href^="https://maps.apple.com"]')).not.toBeNull();
	});

	it('verweigerter Standort zeigt Hinweis mit Retry', async () => {
		mount([], { requestPositionFn: async () => ({ ok: false, reason: 'denied' }) });
		await page.getByTestId('waerme-locate').click();
		await expect
			.element(page.getByTestId('waerme-fallback'))
			.toHaveTextContent('Ohne Standort können wir keine Orte in deiner Nähe zeigen.');
		await expect.element(page.getByTestId('waerme-retry')).toBeInTheDocument();
		expect(document.activeElement).toBe(document.querySelector('[data-testid="waerme-fallback"]'));
	});

	it('nicht unterstützter Standort zeigt Hinweis ohne Retry', async () => {
		mount([], { requestPositionFn: async () => ({ ok: false, reason: 'unsupported' }) });
		await page.getByTestId('waerme-locate').click();
		await expect
			.element(page.getByTestId('waerme-fallback'))
			.toHaveTextContent('Dein Browser unterstützt keine Standort-Bestimmung.');
		expect(document.querySelector('[data-testid="waerme-retry"]')).toBeNull();
	});

	it('rejectende Standortabfrage wird als Fehler behandelt', async () => {
		mount([], {
			requestPositionFn: async () => {
				throw new Error('boom');
			}
		});
		await page.getByTestId('waerme-locate').click();
		await expect
			.element(page.getByTestId('waerme-fallback'))
			.toHaveTextContent('Der Standort konnte nicht bestimmt werden.');
	});

	it('setzt den Fokus nach dem Laden auf die Überschrift', async () => {
		mount([ort({ id: 'node/1', name: 'A' })]);
		await page.getByTestId('waerme-locate').click();
		await expect.element(page.getByTestId('waerme-list')).toBeInTheDocument();
		expect(document.activeElement).toBe(document.getElementById('waerme-naehe-h'));
	});

	it('nennt die Quelle "laut Recherche" und zeigt bei "unklar" keinen Status', async () => {
		mount(
			[
				ort({
					id: 'way/37533771',
					name: 'Heilandskirche',
					openingHours: 'We 12:00-18:00; Sa 11:00-13:00',
					hoursSource: 'recherche',
					lat: 52.5201
				}),
				ort({
					id: 'node/9',
					name: 'Unklar',
					openingHours: '',
					hoursSource: 'unklar',
					openingHoursNote: 'nach dem Gottesdienst',
					lat: 52.5202
				})
			],
			{ now: new Date(2026, 9, 17, 12, 17, 0) }
		);
		await page.getByTestId('waerme-locate').click();
		const [heiland, unklar] = Array.from(document.querySelectorAll('[data-testid="waerme-ort"]'));
		expect(heiland.querySelector('[data-testid="waerme-status"]')!.textContent).toBe(
			'laut Recherche: jetzt offen'
		);
		expect(unklar.querySelector('[data-testid="waerme-status"]')).toBeNull();
	});

	it('zeigt closed und closing-soon mit eigenem Text und Ton', async () => {
		mount([
			ort({ id: 'node/1', name: 'Zu', openingHours: 'Mo-Su 03:00-04:00', lat: 52.5201 }),
			ort({ id: 'node/2', name: 'Bald', openingHours: 'Mo-Su 08:00-12:15', lat: 52.5202 })
		]);
		await page.getByTestId('waerme-locate').click();
		const [closed, soon] = Array.from(document.querySelectorAll('[data-testid="waerme-ort"]'));
		const closedStatus = closed.querySelector('[data-testid="waerme-status"]')!;
		expect(closedStatus.textContent).toBe('laut OSM: geschlossen');
		expect(closed.textContent).not.toContain('jetzt offen');
		const soonStatus = soon.querySelector('[data-testid="waerme-status"]')!;
		expect(soonStatus.textContent).toBe('laut OSM: schließt bald');
		expect(soonStatus.className).toContain('text-state-warning');
		expect(soonStatus.className).not.toContain('text-state-success');
	});

	it('leerer Index zeigt „Keine Orte verfügbar“ mit Retry statt Kategorie-Leertext', async () => {
		mount([]);
		await page.getByTestId('waerme-locate').click();
		await expect
			.element(page.getByTestId('waerme-keine-daten'))
			.toHaveTextContent('Keine Orte verfügbar.');
		await expect.element(page.getByTestId('waerme-retry')).toBeInTheDocument();
		expect(document.querySelector('[data-testid="waerme-empty"]')).toBeNull();
	});

	it('Retry nach Ladefehler lädt nur den Index neu, fragt den Standort nicht erneut', async () => {
		let positionCalls = 0;
		let loadCalls = 0;
		mount([], {
			requestPositionFn: async () => {
				positionCalls += 1;
				return { ok: true, lat: 52.52, lng: 13.405 };
			},
			loadIndex: async () => {
				loadCalls += 1;
				if (loadCalls === 1) throw new Error('x');
				return [ort({ id: 'node/1', name: 'Da' })];
			}
		});
		await page.getByTestId('waerme-locate').click();
		await page.getByTestId('waerme-retry').click();
		await expect.element(page.getByText('Da', { exact: true })).toBeInTheDocument();
		expect(positionCalls).toBe(1);
		expect(loadCalls).toBe(2);
	});

	it('„Standort aktualisieren“ fragt in ready den Standort neu ab', async () => {
		let positionCalls = 0;
		mount([ort({ id: 'node/1', name: 'A' })], {
			requestPositionFn: async () => {
				positionCalls += 1;
				return { ok: true, lat: 52.52, lng: 13.405 };
			}
		});
		await page.getByTestId('waerme-locate').click();
		await page.getByTestId('waerme-refresh').click();
		await expect.element(page.getByTestId('waerme-list')).toBeInTheDocument();
		expect(positionCalls).toBe(2);
	});

	it('zeigt den Website-Link nur, wenn er sich von der Quelle unterscheidet', async () => {
		mount([
			ort({
				id: 'node/1',
				name: 'Mit',
				website: 'https://example.org/start',
				sourceUrl: 'https://example.org/quelle',
				lat: 52.5201
			}),
			ort({
				id: 'node/2',
				name: 'Gleich',
				website: 'https://example.org/quelle',
				sourceUrl: 'https://example.org/quelle',
				lat: 52.5202
			})
		]);
		await page.getByTestId('waerme-locate').click();
		const [a, b] = Array.from(document.querySelectorAll('[data-testid="waerme-ort"]'));
		expect(a.querySelector('[data-testid="waerme-website"]')?.getAttribute('href')).toBe(
			'https://example.org/start'
		);
		expect(b.querySelector('[data-testid="waerme-website"]')).toBeNull();
	});

	it('Melde-Link: sichtbarer Text steht am Anfang des aria-label', async () => {
		mount([ort({ id: 'node/42', name: 'Bibliothek Süd' })]);
		await page.getByTestId('waerme-locate').click();
		const link = document.querySelector('[data-testid="waerme-melden"]')!;
		expect(link.getAttribute('aria-label')).toBe('Fehler melden: Bibliothek Süd');
		expect(link.textContent!.trim()).toBe('Fehler melden');
	});

	it('Melde-Mail trennt Kategorie und Prüfdatum vom Datenstand', async () => {
		mount([ort({ id: 'node/42', name: 'B', cat: 'Museum', checkedAt: '2026-10-16' })]);
		await page.getByTestId('waerme-locate').click();
		const href = document.querySelector('[data-testid="waerme-melden"]')!.getAttribute('href')!;
		const body = decodeURIComponent(href.match(/body=(.+)$/)![1]);
		expect(body).toContain('Kategorie: Museum');
		expect(body).toContain('Geprüft am: 2026-10-16');
		expect(body).not.toContain('Datenstand');
	});

	it('fehlgeschlagenes Laden zeigt Fehler mit Retry, Retry lädt neu', async () => {
		let calls = 0;
		mount([], {
			loadIndex: async () => {
				calls += 1;
				if (calls === 1) throw new Error('404');
				return [ort({ id: 'node/1', name: 'Danach da' })];
			}
		});
		await page.getByTestId('waerme-locate').click();
		await expect.element(page.getByTestId('waerme-load-error')).toBeInTheDocument();
		await page.getByTestId('waerme-retry').click();
		await expect.element(page.getByText('Danach da')).toBeInTheDocument();
	});

	it('EN: UI englisch, Ortsname und Notiz mit lang="de"', async () => {
		overwriteGetLocale(() => 'en');
		mount([ort({ id: 'node/1', name: 'Zentralbibliothek', openingHoursNote: 'Mo bis Fr' })]);
		await page.getByTestId('waerme-locate').click();
		const item = document.querySelector('[data-testid="waerme-ort"]')!;
		expect(item.textContent).toContain('Staying without buying: not checked');
		expect(item.textContent).toContain('Library');
		expect(item.textContent).toContain('checked on October 16, 2026');
		expect(item.querySelector('[lang="de"]')?.textContent).toContain('Zentralbibliothek');
		expect(item.querySelectorAll('[lang="de"]').length).toBeGreaterThanOrEqual(2);
	});

	it('enthält keine em-dashes', async () => {
		mount([ort({ id: 'node/1', name: 'X' })]);
		await page.getByTestId('waerme-locate').click();
		const text = (await page.getByTestId('waerme-orte-naehe').element()).textContent ?? '';
		expect(text.includes('—')).toBe(false);
	});
});
