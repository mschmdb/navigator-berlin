import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import KiezNeighbors from './kiez-neighbors.svelte';
import type { NeighborEntry } from '$lib/data/kiez-neighbors.js';

afterEach(() => {
	overwriteGetLocale(() => 'de');
});

const NEIGHBORS: NeighborEntry[] = [
	{ slug: 'schillerpromenade', name: 'Schillerpromenade', bezirkName: 'Neukölln', composite: 52 },
	{ slug: 'buchholz', name: 'Buchholz', bezirkName: 'Pankow', composite: null }
];
const SIMILAR: NeighborEntry[] = [
	{ slug: 'karlshorst', name: 'Karlshorst', bezirkName: 'Lichtenberg', composite: 61 }
];

describe('kiez-neighbors.svelte', () => {
	it('rendert beide Listen mit Überschrift und Links auf /kiez/{slug}', async () => {
		render(KiezNeighbors, { neighbors: NEIGHBORS, similar: SIMILAR });
		await expect
			.element(page.getByRole('heading', { level: 2, name: 'Angrenzende Kieze' }))
			.toBeVisible();
		await expect
			.element(page.getByRole('heading', { level: 2, name: 'Ähnliche Kieze' }))
			.toBeVisible();
		const first = (await page
			.getByTestId('kiez-sibling-link')
			.first()
			.element()) as HTMLAnchorElement;
		expect(first.getAttribute('href')).toBe('/kiez/schillerpromenade');
		const similar = (await page
			.getByTestId('kiez-similar-link')
			.first()
			.element()) as HTMLAnchorElement;
		expect(similar.getAttribute('href')).toBe('/kiez/karlshorst');
	});

	it('nennt Name, Bezirk und Score im Linknamen', async () => {
		render(KiezNeighbors, { neighbors: NEIGHBORS, similar: [] });
		await expect
			.element(
				page.getByRole('link', { name: 'Schillerpromenade, Neukölln, Kiez-Score 52 von 100' })
			)
			.toBeVisible();
	});

	it('lässt den Score ohne Daten weg', async () => {
		render(KiezNeighbors, { neighbors: NEIGHBORS, similar: [] });
		await expect.element(page.getByRole('link', { name: 'Buchholz, Pankow' })).toBeVisible();
	});

	it('rendert Listen als <ul>', async () => {
		render(KiezNeighbors, { neighbors: NEIGHBORS, similar: SIMILAR });
		expect(document.querySelectorAll('ul')).toHaveLength(2);
	});

	it('lässt die Ähnlichkeitsliste weg, wenn sie leer ist', async () => {
		render(KiezNeighbors, { neighbors: NEIGHBORS, similar: [] });
		expect(document.querySelector('[data-testid="kiez-similar-list"]')).toBeNull();
		expect(document.querySelector('[data-testid="kiez-siblings-list"]')).not.toBeNull();
	});

	it('rendert nichts, wenn beide Listen leer sind', async () => {
		render(KiezNeighbors, { neighbors: [], similar: [] });
		expect(document.querySelector('section')).toBeNull();
	});

	it('Englisch: Überschriften englisch, Link mit /en-Präfix', async () => {
		overwriteGetLocale(() => 'en');
		render(KiezNeighbors, { neighbors: NEIGHBORS, similar: SIMILAR });
		await expect
			.element(page.getByRole('heading', { level: 2, name: 'Neighbouring Kieze' }))
			.toBeVisible();
		await expect
			.element(page.getByRole('heading', { level: 2, name: 'Similar Kieze' }))
			.toBeVisible();
		await expect
			.element(
				page.getByRole('link', { name: 'Schillerpromenade, Neukölln, Kiez score 52 of 100' })
			)
			.toBeVisible();
		const link = (await page
			.getByTestId('kiez-sibling-link')
			.first()
			.element()) as HTMLAnchorElement;
		expect(link.getAttribute('href')).toBe('/en/kiez/schillerpromenade');
	});

	it('trennt Bezirk und Score mit Komma und Leerzeichen (#90)', async () => {
		render(KiezNeighbors, { neighbors: NEIGHBORS, similar: [] });
		const meta = document.querySelector('li span[aria-hidden="true"]');
		expect(meta?.textContent?.replace(/\s+/g, ' ').trim()).toMatch(/^[^,]+, Kiez-Score \d+$/);
	});
});
