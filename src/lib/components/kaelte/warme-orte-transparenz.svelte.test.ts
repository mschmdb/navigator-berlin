import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import { KAELTEHILFE_WEGWEISER_URL } from '$lib/kaelte/hilfe-dienste.js';
import WarmeOrteTransparenz from './warme-orte-transparenz.svelte';

afterEach(() => overwriteGetLocale(() => 'de'));

describe('WarmeOrteTransparenz', () => {
	it('nennt die drei Quellen und die ODbL', async () => {
		render(WarmeOrteTransparenz);
		const text = (await page.getByTestId('waerme-transparenz').element()).textContent ?? '';
		expect(text).toContain('OpenStreetMap');
		expect(text).toContain('ODbL');
		expect(text).toContain('Redaktion navigator.berlin');
		expect(text).toContain('Deutscher Wetterdienst');
	});

	it('weist auf fehlende Notübernachtungen hin', async () => {
		render(WarmeOrteTransparenz);
		await expect
			.element(page.getByTestId('waerme-transparenz-notfall'))
			.toHaveTextContent('keine Notübernachtungen');
	});

	it('verlinkt nur den Kältehilfe-Wegweiser', async () => {
		render(WarmeOrteTransparenz);
		await expect
			.element(page.getByTestId('waerme-wegweiser-link'))
			.toHaveAttribute('href', KAELTEHILFE_WEGWEISER_URL);
	});

	it('EN: englische Überschrift, keine em-dashes', async () => {
		overwriteGetLocale(() => 'en');
		render(WarmeOrteTransparenz);
		await expect
			.element(page.getByRole('heading', { name: 'Where the information comes from' }))
			.toBeVisible();
		const text = (await page.getByTestId('waerme-transparenz').element()).textContent ?? '';
		expect(text.includes('—')).toBe(false);
	});

	it('Notfallzeile verlinkt die 112 als tel-Link', async () => {
		render(WarmeOrteTransparenz);
		await expect
			.element(page.getByTestId('waerme-transparenz-112'))
			.toHaveAttribute('href', 'tel:112');
	});

	it('EN: Eigenname Kältehilfe steht in lang="de", Satz idiomatisch', async () => {
		overwriteGetLocale(() => 'en');
		render(WarmeOrteTransparenz);
		const link = await page.getByTestId('waerme-wegweiser-link').element();
		expect(link.querySelector('[lang="de"]')?.textContent).toBe('Kältehilfe');
		expect(link.textContent).toContain(
			'Find emergency shelters and warming rooms in the Kältehilfe guide.'
		);
	});
});
