import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import KuehleOrteCard from './kuehle-orte-card.svelte';
import type { KuehleOrt } from '$lib/data/get-kuehle-orte-index.js';

afterEach(() => {
	overwriteGetLocale(() => 'de');
});

const ORT: KuehleOrt = {
	id: '1',
	name: 'Stadtbibliothek Mitte',
	cat: 'Bibliothek',
	lat: 52.52,
	lng: 13.4,
	coolScore: 3,
	acStatus: 'yes',
	isFree: 'free',
	summerAvailable: 'yes',
	address: 'Beispielstraße 1',
	website: '',
	googleMapsUrl: 'https://maps.google.com/?q=52.52,13.4',
	appleMapsUrl: 'https://maps.apple.com/?q=52.52,13.4',
	openingHoursNote: '',
	openingHours: 'Mo-Fr 10:00-18:00'
};

describe('kuehle-orte-card.svelte', () => {
	it('Detail-Bereich zeigt einen Opt-out-Mailto-Link mit aria-label (Review-Fix)', async () => {
		render(KuehleOrteCard, { layerName: 'Kühle Orte', address: null, index: null });
		await page.getByTestId('card-details-toggle').click();
		const link = (await page.getByTestId('card-opt-out').element()) as HTMLAnchorElement;
		expect(link.getAttribute('href')?.startsWith('mailto:')).toBe(true);
		expect(link.getAttribute('aria-label')).toBeTruthy();
	});

	// i18n Block B3b: Filter-Chips, Status, Distanz, Navi-Links + Legende englisch.
	// i18n Block C1: `explainEntry.short`/`.long` sind jetzt selbst
	// locale-fähig (Messages) -- kein `lang="de"`-Override mehr auf EN.
	it('explainEntry.short + .long zeigen EN-Text ohne lang-Attribut bei lang="en"', async () => {
		const { container } = render(KuehleOrteCard, {
			layerName: 'Cool places',
			address: null,
			index: null,
			lang: 'en'
		});
		const shortP = container.querySelector('[data-testid="kuehle-orte-card"] > p');
		expect(shortP?.textContent).toMatch(/Places to cool down in hot weather/);
		expect(shortP?.getAttribute('lang')).toBeNull();
		await page.getByTestId('card-details-toggle').click();
		const details = (await page.getByTestId('card-details').element()) as HTMLElement;
		const longP = details.querySelector('p');
		expect(longP?.textContent).toMatch(/Places in Berlin that offer relief from the heat/);
		expect(longP?.getAttribute('lang')).toBeNull();
	});

	it('explainEntry.short + .long haben KEIN lang-Attribut auf DE', async () => {
		const { container } = render(KuehleOrteCard, {
			layerName: 'Kühle Orte',
			address: null,
			index: null
		});
		const shortP = container.querySelector('[data-testid="kuehle-orte-card"] > p');
		expect(shortP?.getAttribute('lang')).toBeNull();
		await page.getByTestId('card-details-toggle').click();
		const details = (await page.getByTestId('card-details').element()) as HTMLElement;
		const longP = details.querySelector('p');
		expect(longP?.getAttribute('lang')).toBeNull();
	});

	it('lang="en": Filter, Status, Distanz und Navi-Links englisch', async () => {
		render(KuehleOrteCard, {
			layerName: 'Cool places',
			address: { lat: 52.52, lng: 13.4 },
			index: [ORT],
			lang: 'en'
		});
		await expect.element(page.getByTestId('filter-jetztOffen')).toHaveTextContent('open now');
		await expect.element(page.getByTestId('navi-google')).toHaveTextContent('Google Maps');
		await expect.element(page.getByTestId('kuehle-legende')).toHaveTextContent('“Cool x/5”');
		await expect.element(page.getByTestId('kuehle-ort')).toHaveTextContent('free');
	});

	it('rendert englisch über den Default-Pfad (getLocale())', async () => {
		overwriteGetLocale(() => 'en');
		render(KuehleOrteCard, {
			layerName: 'Cool places',
			address: { lat: 52.52, lng: 13.4 },
			index: [ORT]
		});
		await expect.element(page.getByTestId('filter-jetztOffen')).toHaveTextContent('open now');
	});
});
