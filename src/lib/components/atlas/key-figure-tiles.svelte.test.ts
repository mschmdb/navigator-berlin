import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import KeyFigureTiles from './key-figure-tiles.svelte';
import { KEY_FIGURE_LAYERS, type KeyFigure } from '$lib/data/region-key-figures.js';

afterEach(() => {
	overwriteGetLocale(() => 'de');
});

const NONE = { level: null, berlinLevel: null } as const;
const FIGURES: KeyFigure[] = [
	{
		id: 'bestandsmiete',
		layer: KEY_FIGURE_LAYERS[0],
		unit: 'eur-m2',
		value: 8.1,
		berlin: 7.66,
		...NONE
	},
	{ id: 'altbau', layer: KEY_FIGURE_LAYERS[1], unit: 'percent', value: 60, berlin: 39.49, ...NONE },
	{
		id: 'laerm',
		layer: KEY_FIGURE_LAYERS[2],
		unit: 'level',
		value: null,
		berlin: null,
		level: 'gering',
		berlinLevel: 'mittel'
	},
	{ id: 'gruen', layer: KEY_FIGURE_LAYERS[3], unit: 'percent', value: null, berlin: 6.6, ...NONE },
	{ id: 'hitze', layer: KEY_FIGURE_LAYERS[4], unit: 'celsius', value: 37.2, berlin: 36, ...NONE },
	{ id: 'milieuschutz', layer: KEY_FIGURE_LAYERS[5], unit: 'percent', value: 0, berlin: 6, ...NONE }
];

function hrefs(): string[] {
	return Array.from(document.querySelectorAll('[data-testid="key-figure-link"]')).map(
		(a) => a.getAttribute('href') ?? ''
	);
}

describe('key-figure-tiles.svelte', () => {
	it('rendert eine Liste mit sechs Kacheln und Überschrift', async () => {
		render(KeyFigureTiles, {
			figures: FIGURES,
			regionName: 'Reuterstraße',
			kind: 'kiez',
			slug: 'reuterstrasse'
		});
		await expect
			.element(page.getByRole('heading', { level: 2 }))
			.toHaveTextContent(/Kennzahlen im Vergleich mit Berlin/);
		expect(document.querySelectorAll('[data-testid="key-figure-tile"]')).toHaveLength(6);
		expect(document.querySelector('ul[data-testid="key-figure-list"]')).not.toBeNull();
	});

	it('zeigt Wert und Berlin-Wert im DE-Format', async () => {
		render(KeyFigureTiles, {
			figures: FIGURES,
			regionName: 'Reuterstraße',
			kind: 'kiez',
			slug: 'reuterstrasse'
		});
		const miete = document.querySelector('[data-figure="bestandsmiete"]') as HTMLElement;
		expect(miete.textContent).toContain('8,10 €/m²');
		expect(miete.textContent).toContain('Berlin: 7,66 €/m²');
		const altbau = document.querySelector('[data-figure="altbau"]') as HTMLElement;
		expect(altbau.textContent).toContain('60 %');
		expect(altbau.textContent).toContain('Berlin: 39 %');
		const hitze = document.querySelector('[data-figure="hitze"]') as HTMLElement;
		expect(hitze.textContent).toContain('37,2 °C');
		const gruen = document.querySelector('[data-figure="milieuschutz"]') as HTMLElement;
		expect(gruen.textContent).toContain('Berlin: 6,0 %');
	});

	it('zeigt bei Lärm die überwiegende Stufe statt einer Zahl', async () => {
		render(KeyFigureTiles, {
			figures: FIGURES,
			regionName: 'Reuterstraße',
			kind: 'kiez',
			slug: 'reuterstrasse'
		});
		const laerm = document.querySelector('[data-figure="laerm"]') as HTMLElement;
		expect(laerm.textContent).toContain('überwiegend gering');
		expect(laerm.textContent).toContain('Berlin: überwiegend mittel');
		expect(laerm.textContent).not.toContain('keine Angabe');
	});

	it('zeigt "keine Angabe" und behält den Karten-Link', async () => {
		render(KeyFigureTiles, {
			figures: FIGURES,
			regionName: 'Reuterstraße',
			kind: 'kiez',
			slug: 'reuterstrasse'
		});
		const gruen = document.querySelector('[data-figure="gruen"]') as HTMLElement;
		expect(gruen.textContent).toContain('keine Angabe');
		expect(gruen.querySelector('a')?.getAttribute('href')).toBe(
			'/explore?kiez=reuterstrasse&layers=gruenanlagen'
		);
	});

	it('zeigt 0 als Wert, nicht als "keine Angabe"', async () => {
		render(KeyFigureTiles, {
			figures: FIGURES,
			regionName: 'Reuterstraße',
			kind: 'kiez',
			slug: 'reuterstrasse'
		});
		const ms = document.querySelector('[data-figure="milieuschutz"]') as HTMLElement;
		expect(ms.textContent).toContain('0,0 %');
		expect(ms.textContent).not.toContain('keine Angabe');
	});

	it('verlinkt jede Kachel mit ihrem Layer und dem Kiez-Fokus', async () => {
		render(KeyFigureTiles, {
			figures: FIGURES,
			regionName: 'Reuterstraße',
			kind: 'kiez',
			slug: 'reuterstrasse'
		});
		expect(hrefs()).toEqual(
			KEY_FIGURE_LAYERS.map((l) => `/explore?kiez=reuterstrasse&layers=${l}`)
		);
	});

	it('nutzt ?bezirk= für Bezirksseiten', async () => {
		render(KeyFigureTiles, {
			figures: FIGURES,
			regionName: 'Pankow',
			kind: 'bezirk',
			slug: 'pankow'
		});
		expect(hrefs()[0]).toBe('/explore?bezirk=pankow&layers=zensus-bestandsmiete-2022');
	});

	it('gibt jedem Link einen sprechenden Namen', async () => {
		render(KeyFigureTiles, {
			figures: FIGURES,
			regionName: 'Reuterstraße',
			kind: 'kiez',
			slug: 'reuterstrasse'
		});
		await expect
			.element(page.getByRole('link', { name: /Lärm in Reuterstraße.*Auf der Karte/ }))
			.toBeVisible();
	});

	it('färbt Werte nicht nach Gut/Schlecht', async () => {
		render(KeyFigureTiles, {
			figures: FIGURES,
			regionName: 'Reuterstraße',
			kind: 'kiez',
			slug: 'reuterstrasse'
		});
		const html = document.querySelector('[data-testid="key-figures"]')?.innerHTML ?? '';
		expect(html).not.toMatch(/scale-|text-(red|green)|bg-(red|green)/);
	});

	it('rendert EN-Texte, EN-Dezimalformat und /en-Links', async () => {
		overwriteGetLocale(() => 'en');
		render(KeyFigureTiles, {
			figures: FIGURES,
			regionName: 'Reuterstraße',
			kind: 'kiez',
			slug: 'reuterstrasse'
		});
		await expect
			.element(page.getByRole('heading', { level: 2 }))
			.toHaveTextContent(/Key figures compared with Berlin/);
		const miete = document.querySelector('[data-figure="bestandsmiete"]') as HTMLElement;
		expect(miete.textContent).toContain('8.10 €/m²');
		expect(miete.textContent).toContain('Berlin: 7.66 €/m²');
		expect(hrefs()[0]).toBe('/en/explore?kiez=reuterstrasse&layers=zensus-bestandsmiete-2022');
	});

	it('rendert nichts bei leerer Liste', async () => {
		render(KeyFigureTiles, { figures: [], regionName: 'X', kind: 'kiez', slug: 'x' });
		expect(document.querySelector('[data-testid="key-figures"]')).toBeNull();
	});
});
