import { afterEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import KlimaPetCard from './klima-pet-card.svelte';

afterEach(() => {
	overwriteGetLocale(() => 'de');
});
import type { LayerHit } from '$lib/data';
import type { NumericMedianAggregate } from '$lib/data/layer-aggregates-types.js';

const hit: LayerHit = {
	layer: 'klima-pet-2022',
	value: { schl5: '0100', pet14h: 40.3 },
	source: '',
	updatedAt: '',
	license: 'dl-de/by-2-0'
};

function agg(median: number, min: number, max: number): NumericMedianAggregate {
	return {
		type: 'numeric-median',
		median,
		min,
		max,
		contributingMembers: 10,
		totalMembers: 10,
		coverage: '10/10'
	};
}

describe('KlimaPetCard', () => {
	it('zeigt Adresswert prominent', async () => {
		render(KlimaPetCard, {
			hit,
			layerName: 'Gefühlte Temperatur 2022',
			kiezName: 'Lichtenrade',
			kiezAggregate: agg(36, 24, 45),
			bezirkName: 'Tempelhof-Schöneberg',
			bezirkAggregate: agg(37, 22, 46),
			berlinAggregate: agg(35.5, 20, 48)
		});
		const val = (await page.getByTestId('pet-address-value').element()) as HTMLElement;
		expect(val.textContent).toContain('40,3');
	});

	it('rendert Score-Bar im Kiez-Kontext', async () => {
		render(KlimaPetCard, {
			hit,
			layerName: 'Gefühlte Temperatur 2022',
			kiezName: 'Lichtenrade',
			kiezAggregate: agg(36, 24, 45),
			bezirkName: 'X',
			bezirkAggregate: null,
			berlinAggregate: null
		});
		await expect.element(page.getByTestId('score-bar')).toBeInTheDocument();
	});

	it('listet verfügbare Kontext-Skalen (Kiez/Bezirk/Berlin) mit Median + Spanne', async () => {
		render(KlimaPetCard, {
			hit,
			layerName: 'Gefühlte Temperatur 2022',
			kiezName: 'Lichtenrade',
			kiezAggregate: agg(36, 24, 45),
			bezirkName: 'Tempelhof-Schöneberg',
			bezirkAggregate: agg(37, 22, 46),
			berlinAggregate: agg(35.5, 20, 48)
		});
		const card = (await page.getByTestId('klima-pet-card').element()) as HTMLElement;
		expect(card.textContent).toContain('Lichtenrade');
		expect(card.textContent).toContain('Tempelhof-Schöneberg');
		expect(card.textContent).toContain('Berlin');
		expect(card.textContent).toContain('36');
	});

	it('kein Punkt-Messwert + Kontext da → Umfeld-Hinweis + Kontext-Zeilen', async () => {
		const noPointHit: LayerHit = {
			layer: 'klima-pet-2022',
			value: {},
			source: '',
			updatedAt: '',
			license: 'dl-de/by-2-0'
		};
		render(KlimaPetCard, {
			hit: noPointHit,
			layerName: 'Gefühlte Temperatur 2022',
			kiezName: 'Tegel-Süd',
			kiezAggregate: agg(37.3, 25.8, 41),
			bezirkName: 'Reinickendorf',
			bezirkAggregate: agg(36.3, 24.7, 42.6),
			berlinAggregate: agg(36.5, 24.4, 45.2)
		});
		await expect.element(page.getByTestId('pet-address-value')).not.toBeInTheDocument();
		await expect.element(page.getByTestId('pet-no-point-value')).toBeInTheDocument();
		const card = (await page.getByTestId('klima-pet-card').element()) as HTMLElement;
		expect(card.textContent).toContain('Tegel-Süd');
	});

	it('ohne Aggregate: nur Adresswert, kein Score-Bar, kein Crash', async () => {
		render(KlimaPetCard, {
			hit,
			layerName: 'Gefühlte Temperatur 2022',
			kiezName: null,
			kiezAggregate: null,
			bezirkName: null,
			bezirkAggregate: null,
			berlinAggregate: null
		});
		await expect.element(page.getByTestId('pet-address-value')).toBeInTheDocument();
		await expect.element(page.getByTestId('score-bar')).not.toBeInTheDocument();
	});

	// i18n Block B3a Task 3: DE hat KEINEN URL-Präfix (Boundary), vormals
	// `/de/layer/...` (301-Umweg-Bug).
	it('Learn-more-Link hat bei lang: "de" keinen /de/-Präfix', async () => {
		render(KlimaPetCard, {
			hit,
			layerName: 'Gefühlte Temperatur 2022',
			lang: 'de',
			kiezName: null,
			kiezAggregate: null,
			bezirkName: null,
			bezirkAggregate: null,
			berlinAggregate: null
		});
		const link = (await page.getByTestId('learn-more').element()) as HTMLAnchorElement;
		expect(link.getAttribute('href')).toBe('/layer/klima-pet-2022');
	});

	it('Learn-more-Link nutzt /en/-Präfix bei lang: "en"', async () => {
		render(KlimaPetCard, {
			hit,
			layerName: 'Perceived temperature 2022',
			lang: 'en',
			kiezName: null,
			kiezAggregate: null,
			bezirkName: null,
			bezirkAggregate: null,
			berlinAggregate: null
		});
		const link = (await page.getByTestId('learn-more').element()) as HTMLAnchorElement;
		expect(link.getAttribute('href')).toBe('/en/layer/klima-pet-2022');
	});

	// i18n Block B3b
	it('lang="en": kein direkter Messwert-Hinweis + Details-Toggle + Map-Toggle-Titel englisch', async () => {
		render(KlimaPetCard, {
			hit: { ...hit, value: null },
			layerName: 'Perceived temperature 2022',
			lang: 'en',
			kiezName: 'Lichtenrade',
			kiezAggregate: agg(36, 24, 45),
			bezirkName: 'Tempelhof-Schöneberg',
			bezirkAggregate: agg(37, 22, 46),
			berlinAggregate: agg(35.5, 20, 48),
			onToggleLayer: () => {}
		});
		await expect
			.element(page.getByTestId('pet-no-point-value'))
			.toHaveTextContent('No direct reading at this exact point');
		await expect
			.element(page.getByTestId('pet-details-toggle'))
			.toHaveTextContent('Source & details');
		const toggle = (await page.getByTestId('map-toggle').element()) as HTMLButtonElement;
		expect(toggle.getAttribute('title')).toBe('Show on map');
	});

	it('lang="en": Score-Bar-Anchor + sr-only-Tabelle englisch ("Value"/"Median")', async () => {
		render(KlimaPetCard, {
			hit,
			layerName: 'Perceived temperature 2022',
			lang: 'en',
			kiezName: 'Lichtenrade',
			kiezAggregate: agg(36, 24, 45),
			bezirkName: 'X',
			bezirkAggregate: null,
			berlinAggregate: agg(35.5, 20, 48)
		});
		const table = (await page.getByTestId('score-bar-table').element()) as HTMLElement;
		expect(table.textContent).toContain('Value');
		expect(table.textContent).toContain('Median');
	});

	it('rendert englisch über den Default-Pfad (getLocale())', async () => {
		overwriteGetLocale(() => 'en');
		render(KlimaPetCard, {
			hit,
			layerName: 'Perceived temperature 2022',
			kiezName: null,
			kiezAggregate: null,
			bezirkName: null,
			bezirkAggregate: null,
			berlinAggregate: null
		});
		const link = (await page.getByTestId('learn-more').element()) as HTMLAnchorElement;
		expect(link.getAttribute('href')).toBe('/en/layer/klima-pet-2022');
	});

	// spec-i18n-teiluebersetzung-banner.md: `explainEntry.long` bleibt bis
	// Block C deutsch (WCAG 3.1.2).
	it('explainEntry.long bekommt lang="de" bei lang="en"', async () => {
		render(KlimaPetCard, {
			hit,
			layerName: 'Perceived temperature 2022',
			lang: 'en',
			kiezName: null,
			kiezAggregate: null,
			bezirkName: null,
			bezirkAggregate: null,
			berlinAggregate: null
		});
		await page.getByTestId('pet-details-toggle').click();
		const details = (await page.getByTestId('pet-details').element()) as HTMLElement;
		const explain = details.querySelector('p');
		expect(explain?.getAttribute('lang')).toBe('de');
	});

	it('explainEntry.long hat KEIN lang-Attribut auf DE', async () => {
		render(KlimaPetCard, {
			hit,
			layerName: 'Gefühlte Temperatur 2022',
			kiezName: null,
			kiezAggregate: null,
			bezirkName: null,
			bezirkAggregate: null,
			berlinAggregate: null
		});
		await page.getByTestId('pet-details-toggle').click();
		const details = (await page.getByTestId('pet-details').element()) as HTMLElement;
		const explain = details.querySelector('p');
		expect(explain?.getAttribute('lang')).toBeNull();
	});
});
