import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import KiezSiblingsList from './kiez-siblings-list.svelte';
import type { KiezRef } from '$lib/data/get-kieze-in-bezirk.js';

afterEach(() => {
	overwriteGetLocale(() => 'de');
});

const SIBLINGS: KiezRef[] = [
	{ slug: 'buchholz', name: 'Buchholz', composite: 42 },
	{ slug: 'pankow-zentrum', name: 'Pankow Zentrum', composite: null }
];

describe('kiez-siblings-list.svelte', () => {
	it('rendert Headline mit Parent-Bezirk', async () => {
		render(KiezSiblingsList, { siblings: SIBLINGS, parentBezirkName: 'Pankow' });
		const h2 = page.getByRole('heading', { level: 2 });
		await expect.element(h2).toHaveTextContent(/Andere Kieze in Pankow/);
	});

	it('rendert Links auf /kiez/{slug}', async () => {
		render(KiezSiblingsList, { siblings: SIBLINGS, parentBezirkName: 'Pankow' });
		const link = (await page
			.getByTestId('kiez-sibling-link')
			.first()
			.element()) as HTMLAnchorElement;
		expect(link.getAttribute('href')).toBe('/kiez/buchholz');
	});

	it('rendert nichts wenn siblings leer', async () => {
		render(KiezSiblingsList, { siblings: [], parentBezirkName: 'Mitte' });
		expect(document.querySelector('[data-testid="kiez-siblings-list"]')).toBeNull();
	});

	// i18n Block B4a
	describe('opts.locale (EN)', () => {
		it('Headline englisch (Kieze bleibt deutsch), Link mit /en-Präfix', async () => {
			overwriteGetLocale(() => 'en');
			render(KiezSiblingsList, { siblings: SIBLINGS, parentBezirkName: 'Pankow' });
			const h2 = page.getByRole('heading', { level: 2 });
			await expect.element(h2).toHaveTextContent(/Other Kieze in Pankow/);
			const link = (await page
				.getByTestId('kiez-sibling-link')
				.first()
				.element()) as HTMLAnchorElement;
			expect(link.getAttribute('href')).toBe('/en/kiez/buchholz');
		});
	});
});
