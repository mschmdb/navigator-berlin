import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page, userEvent } from 'vitest/browser';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import RegionFocusCard from './region-focus-card.svelte';

const KIEZ = {
	kind: 'kiez' as const,
	slug: 'reuterstrasse',
	name: 'Reuterstraße',
	bezirkName: 'Neukölln',
	score: 41.2,
	rang: 57,
	total: 143,
	onClose: () => {}
};

afterEach(() => {
	overwriteGetLocale(() => 'de');
});

describe('region-focus-card.svelte', () => {
	it('zeigt Name, Bezirk, Score mit Rang und Hinweis für einen Kiez', async () => {
		render(RegionFocusCard, KIEZ);
		await expect.element(page.getByTestId('region-focus-name')).toHaveTextContent('Reuterstraße');
		await expect.element(page.getByTestId('region-focus-bezirk')).toHaveTextContent('Neukölln');
		const score = page.getByTestId('region-focus-score');
		await expect.element(score).toHaveTextContent('Kiez-Score 41');
		await expect.element(score).toHaveTextContent('Platz 57 von 143');
		await expect
			.element(page.getByTestId('region-focus-hint'))
			.toHaveTextContent('Tippe in den Kiez für Werte an einer Adresse');
	});

	it('verlinkt auf die Kiez-Seite', async () => {
		render(RegionFocusCard, KIEZ);
		const link = (await page.getByTestId('region-focus-link').element()) as HTMLAnchorElement;
		expect(link.getAttribute('href')).toBe('/kiez/reuterstrasse');
		expect(link.textContent).toContain('Zur Kiez-Seite');
	});

	it('zeigt beim Bezirk "von 12", Bezirksseite und keine Bezirks-Unterzeile', async () => {
		render(RegionFocusCard, {
			...KIEZ,
			kind: 'bezirk',
			slug: 'neukoelln',
			name: 'Neukölln',
			score: 40.8,
			rang: 5,
			total: 12
		});
		await expect
			.element(page.getByTestId('region-focus-score'))
			.toHaveTextContent('Platz 5 von 12');
		await expect.element(page.getByTestId('region-focus-score')).toHaveTextContent('Bezirks-Score');
		const link = (await page.getByTestId('region-focus-link').element()) as HTMLAnchorElement;
		expect(link.getAttribute('href')).toBe('/bezirk/neukoelln');
		expect(link.textContent).toContain('Zur Bezirksseite');
		expect(document.querySelector('[data-testid="region-focus-bezirk"]')).toBeNull();
	});

	it('lässt die Score-Zeile ohne Score weg', async () => {
		render(RegionFocusCard, { ...KIEZ, score: null, rang: null, total: 0 });
		expect(document.querySelector('[data-testid="region-focus-score"]')).toBeNull();
		await expect.element(page.getByTestId('region-focus-link')).toBeVisible();
	});

	it('zeigt den Score ohne Rang, wenn der Rang fehlt', async () => {
		render(RegionFocusCard, { ...KIEZ, rang: null, total: 0 });
		const score = page.getByTestId('region-focus-score');
		await expect.element(score).toHaveTextContent('Kiez-Score 41');
		expect(document.querySelector('[data-testid="region-focus-score"]')?.textContent).not.toContain(
			'Platz'
		);
	});

	it('lokalisiert Texte und Link auf EN', async () => {
		overwriteGetLocale(() => 'en');
		render(RegionFocusCard, KIEZ);
		const link = (await page.getByTestId('region-focus-link').element()) as HTMLAnchorElement;
		expect(link.getAttribute('href')).toBe('/en/kiez/reuterstrasse');
		expect(link.textContent).toContain('Kiez page');
		await expect.element(page.getByTestId('region-focus-hint')).toHaveTextContent('Tap into');
	});

	it('schließt per Button und per Escape', async () => {
		const onClose = vi.fn();
		render(RegionFocusCard, { ...KIEZ, onClose });
		await page.getByTestId('region-focus-close').click();
		expect(onClose).toHaveBeenCalledTimes(1);

		(await page.getByTestId('region-focus-link').element()).focus();
		await userEvent.keyboard('{Escape}');
		expect(onClose).toHaveBeenCalledTimes(2);
	});

	it('hat eine benannte Region und einen erreichbaren Schließen-Button', async () => {
		render(RegionFocusCard, KIEZ);
		await expect
			.element(page.getByRole('region', { name: 'Kiez Reuterstraße' }))
			.toBeInTheDocument();
		await expect
			.element(page.getByRole('button', { name: 'Ortsfokus schließen' }))
			.toBeInTheDocument();
	});
});
