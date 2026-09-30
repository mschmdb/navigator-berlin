import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import InDeinerNaehe from './in-deiner-naehe.svelte';
import type { KuehleOrt } from '$lib/data/get-kuehle-orte-index.js';
import type { PositionResult } from '$lib/utils/geolocation.js';

const NOW = new Date(2026, 6, 1, 12, 0, 0);

function ort(over: Partial<KuehleOrt> & Pick<KuehleOrt, 'id' | 'name'>): KuehleOrt {
	return {
		cat: 'Kino',
		lat: 52.52,
		lng: 13.405,
		coolScore: 4,
		acStatus: 'yes',
		isFree: 'free',
		summerAvailable: 'yes',
		address: 'Teststr 1, 10117 Berlin',
		website: '',
		googleMapsUrl: 'https://www.google.com/maps/dir/?api=1&destination=52.52,13.405',
		appleMapsUrl: 'https://maps.apple.com/?daddr=52.52,13.405',
		openingHoursNote: '',
		openingHours: '24/7',
		...over
	};
}

const okPosition = async (): Promise<PositionResult> => ({ ok: true, lat: 52.52, lng: 13.405 });

describe('InDeinerNaehe (Story 16.3)', () => {
	it('Klick auf „in meiner Nähe" zeigt die nächsten offenen Orte', async () => {
		render(InDeinerNaehe, {
			explorerHref: '/explore?layers=kuehle-orte&mode=hitze',
			requestPositionFn: okPosition,
			loadIndex: async () => [ort({ id: 'node/1', name: 'Kino Nah' })],
			now: NOW
		});
		await page.getByTestId('naehe-locate').click();
		await expect.element(page.getByTestId('naehe-list')).toBeInTheDocument();
		await expect.element(page.getByText('Kino Nah')).toBeInTheDocument();
	});

	it('verweigerter Standort zeigt Fallback + Karten-Link', async () => {
		render(InDeinerNaehe, {
			explorerHref: '/explore?layers=kuehle-orte&mode=hitze',
			requestPositionFn: async () => ({ ok: false, reason: 'denied' }),
			loadIndex: async () => [],
			now: NOW
		});
		await page.getByTestId('naehe-locate').click();
		await expect.element(page.getByTestId('naehe-fallback')).toBeInTheDocument();
	});

	it('ohne now-Prop nutzt die Live-Uhr (Klick-Zeit) und findet 24/7-Orte', async () => {
		render(InDeinerNaehe, {
			explorerHref: '/explore?layers=kuehle-orte&mode=hitze',
			requestPositionFn: okPosition,
			loadIndex: async () => [ort({ id: 'node/9', name: 'Immer offen', openingHours: '24/7' })]
			// kein now: die Komponente fällt auf die Live-Uhr zurück
		});
		await page.getByTestId('naehe-locate').click();
		await expect.element(page.getByText('Immer offen')).toBeInTheDocument();
	});

	it('kein offener Ort in der Nähe zeigt Leer-Hinweis', async () => {
		render(InDeinerNaehe, {
			explorerHref: '/explore?layers=kuehle-orte&mode=hitze',
			requestPositionFn: okPosition,
			// Ort mit Zeiten, die um 12:00 geschlossen sind → jetzt-offen-Filter leert die Liste
			loadIndex: async () => [ort({ id: 'node/2', name: 'Zu', openingHours: 'Mo-Su 20:00-23:00' })],
			now: NOW
		});
		await page.getByTestId('naehe-locate').click();
		await expect.element(page.getByTestId('naehe-empty')).toBeInTheDocument();
	});
});

// i18n C4c: DE-Wortlaut und EN je Phase. Die Live-Region existiert im Layout,
// im Test legen wir sie selbst an.
const HREF = '/explore?layers=kuehle-orte&mode=hitze';

function liveRegion(): HTMLElement {
	document.getElementById('global-aria-live')?.remove();
	const el = document.createElement('div');
	el.id = 'global-aria-live';
	document.body.append(el);
	return el;
}

function sectionText(): string {
	const root = document.querySelector('[data-testid="in-deiner-naehe"]')!;
	return (root.textContent ?? '').replace(/\s+/g, ' ').trim();
}

async function locate(
	requestPositionFn: () => Promise<PositionResult>,
	orte: KuehleOrt[]
): Promise<void> {
	render(InDeinerNaehe, {
		explorerHref: HREF,
		requestPositionFn,
		loadIndex: async () => orte,
		now: NOW
	});
	await page.getByTestId('naehe-locate').click();
}

describe('InDeinerNaehe · DE-Wortlaut (i18n C4c)', () => {
	it('Ausgangszustand: Überschrift, Button, Hinweis', () => {
		render(InDeinerNaehe, { explorerHref: HREF, now: NOW });
		expect(sectionText()).toBe(
			'In deiner Nähe Orte in meiner Nähe Wir fragen deinen Standort ab und zeigen die nächsten jetzt geöffneten kühlen Orte.'
		);
	});

	it('Treffer: Status, Entfernung mit aria-label, Ansage im Plural', async () => {
		const live = liveRegion();
		await locate(okPosition, [
			ort({ id: 'node/1', name: 'Kino Nah' }),
			ort({ id: 'node/2', name: 'Kino Zwei', lat: 52.53, lng: 13.42 })
		]);
		await expect.element(page.getByTestId('naehe-list')).toBeInTheDocument();
		expect(live.textContent).toBe('2 offene kühle Orte in der Nähe gefunden');
		const list = document.querySelector('[data-testid="naehe-list"]')!;
		expect(list.textContent).toContain('jetzt offen');
		expect(list.textContent).toContain('Google Maps');
		expect(list.querySelector('[aria-label^="Entfernung "]')).not.toBeNull();
	});

	it('genau ein Treffer: Singular-Ansage', async () => {
		const live = liveRegion();
		await locate(okPosition, [ort({ id: 'node/1', name: 'Kino Nah' })]);
		await expect.element(page.getByTestId('naehe-list')).toBeInTheDocument();
		expect(live.textContent).toBe('1 offener kühler Ort in der Nähe gefunden');
	});

	it('schließt bald: Statustext', async () => {
		await locate(okPosition, [
			ort({ id: 'node/3', name: 'Bald zu', openingHours: 'Mo-Su 08:00-12:30' })
		]);
		await expect.element(page.getByTestId('naehe-list')).toBeInTheDocument();
		expect(document.querySelector('[data-testid="naehe-list"]')!.textContent).toContain(
			'schließt bald'
		);
	});

	it('kein Treffer: Leer-Text, Link, Ansage', async () => {
		const live = liveRegion();
		await locate(okPosition, [
			ort({ id: 'node/2', name: 'Zu', openingHours: 'Mo-Su 20:00-23:00' })
		]);
		await expect.element(page.getByTestId('naehe-empty')).toBeInTheDocument();
		expect(sectionText()).toContain(
			'Gerade sind keine offenen kühlen Orte in deiner Nähe. Auf der Karte siehst du alle, inklusive der geschlossenen.'
		);
		expect(sectionText()).toContain('Alle kühlen Orte auf der Karte');
		expect(live.textContent).toBe('Keine offenen kühlen Orte in der Nähe gefunden');
	});

	it.each([
		['denied', 'Ohne Standort können wir keine Orte in deiner Nähe zeigen.'],
		['unsupported', 'Dein Browser unterstützt keine Standort-Bestimmung.'],
		['error', 'Standort konnte nicht bestimmt werden.']
	] as const)('Fallback %s', async (reason, text) => {
		const live = liveRegion();
		await locate(async () => ({ ok: false, reason }), []);
		await expect.element(page.getByTestId('naehe-fallback')).toHaveTextContent(text);
		expect(live.textContent).toBe(text);
	});

	it('Locating-Phase: Button und Ansage', async () => {
		const live = liveRegion();
		let release: (r: PositionResult) => void = () => {};
		render(InDeinerNaehe, {
			explorerHref: HREF,
			requestPositionFn: () => new Promise<PositionResult>((r) => (release = r)),
			loadIndex: async () => [],
			now: NOW
		});
		await page.getByTestId('naehe-locate').click();
		expect(document.querySelector('[data-testid="naehe-locate"]')!.textContent).toContain(
			'Standort wird bestimmt …'
		);
		expect(live.textContent).toBe('Standort wird bestimmt');
		release({ ok: false, reason: 'denied' });
	});
});

describe('InDeinerNaehe · Kategorie und Distanz (i18n C4c)', () => {
	afterEach(() => overwriteGetLocale(() => 'de'));
	const FAR = { lat: 52.54, lng: 13.405 };

	it('DE: Kategorie als Rohwert, Distanz ab 1 km mit Dezimalkomma', async () => {
		await locate(okPosition, [ort({ id: 'node/5', name: 'Fern', cat: 'Bibliothek', ...FAR })]);
		await expect.element(page.getByTestId('naehe-list')).toBeInTheDocument();
		const list = document.querySelector('[data-testid="naehe-list"]')!;
		expect(list.textContent).toContain('Bibliothek');
		expect(list.querySelector('[aria-label^="Entfernung "]')?.textContent).toMatch(/^\d,\d km$/);
		expect(list.querySelector('[lang]')).toBeNull();
	});

	it('EN: Kategorie übersetzt, Distanz mit Dezimalpunkt', async () => {
		overwriteGetLocale(() => 'en');
		await locate(okPosition, [ort({ id: 'node/5', name: 'Fern', cat: 'Bibliothek', ...FAR })]);
		await expect.element(page.getByTestId('naehe-list')).toBeInTheDocument();
		const list = document.querySelector('[data-testid="naehe-list"]')!;
		expect(list.textContent).toContain('Library');
		expect(list.textContent).not.toContain('Bibliothek');
		expect(list.querySelector('[aria-label^="Distance "]')?.textContent).toMatch(/^\d\.\d km$/);
	});

	it('EN: unbekannte Kategorie bleibt Rohwert mit lang="de"', async () => {
		overwriteGetLocale(() => 'en');
		await locate(okPosition, [ort({ id: 'node/6', name: 'Sauna Nah', cat: 'Sauna' })]);
		await expect.element(page.getByTestId('naehe-list')).toBeInTheDocument();
		const raw = document.querySelector('[data-testid="naehe-list"] [lang="de"]');
		expect(raw?.textContent).toBe('Sauna');
	});
});

describe('InDeinerNaehe · EN (i18n C4c)', () => {
	afterEach(() => overwriteGetLocale(() => 'de'));

	it('Ausgangszustand englisch', () => {
		overwriteGetLocale(() => 'en');
		render(InDeinerNaehe, { explorerHref: HREF, now: NOW });
		expect(sectionText()).toBe(
			'Near you Places near me We ask for your location and show the nearest cool places that are open now.'
		);
	});

	it('Treffer: englische Ansage im Singular und Plural, Entfernung englisch', async () => {
		overwriteGetLocale(() => 'en');
		const live = liveRegion();
		await locate(okPosition, [ort({ id: 'node/1', name: 'Kino Nah' })]);
		await expect.element(page.getByTestId('naehe-list')).toBeInTheDocument();
		expect(live.textContent).toBe('1 open cool place found nearby');
		expect(document.querySelector('[aria-label^="Distance "]')).not.toBeNull();
		expect(document.querySelector('[data-testid="naehe-list"]')!.textContent).toContain('open now');
	});

	it('Plural und Leer-Text englisch', async () => {
		overwriteGetLocale(() => 'en');
		const live = liveRegion();
		await locate(okPosition, [
			ort({ id: 'node/1', name: 'A' }),
			ort({ id: 'node/2', name: 'B', lat: 52.53, lng: 13.42 })
		]);
		await expect.element(page.getByTestId('naehe-list')).toBeInTheDocument();
		expect(live.textContent).toBe('2 open cool places found nearby');
	});

	it('Fallback englisch', async () => {
		overwriteGetLocale(() => 'en');
		const live = liveRegion();
		await locate(async () => ({ ok: false, reason: 'denied' }), []);
		await expect
			.element(page.getByTestId('naehe-fallback'))
			.toHaveTextContent('Without your location we cannot show places near you.');
		expect(live.textContent).toBe('Without your location we cannot show places near you.');
		expect(sectionText()).toContain('All cool places on the map');
	});
});
