import { page } from 'vitest/browser';
import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import AddressSearchOverlay from './address-search-overlay.svelte';

afterEach(() => {
	overwriteGetLocale(() => 'de');
});

describe('address-search-overlay.svelte', () => {
	it('geschlossen: rendert nichts', async () => {
		render(AddressSearchOverlay, { open: false, geocode: async () => [], onClose: () => {} });
		await expect.element(page.getByTestId('address-search-overlay')).not.toBeInTheDocument();
	});

	it('DE: Ueberschrift + Combobox mit deutschem Placeholder', async () => {
		render(AddressSearchOverlay, { open: true, geocode: async () => [], onClose: () => {} });
		await expect.element(page.getByRole('heading', { name: 'Adresse suchen' })).toBeInTheDocument();
		const input = (await page.getByRole('combobox').element()) as HTMLInputElement;
		expect(input.placeholder).toBe('Berliner Adresse eingeben');
	});

	// i18n Block B2, Entscheidung 1A: Shell (Overlay wird vom Header
	// getriggert) ist auf jeder /en-Seite englisch.
	it('EN: Ueberschrift, Close-aria-label und Placeholder sind englisch', async () => {
		overwriteGetLocale(() => 'en');
		render(AddressSearchOverlay, { open: true, geocode: async () => [], onClose: () => {} });
		await expect.element(page.getByRole('heading', { name: 'Search address' })).toBeInTheDocument();
		const close = (await page.getByTestId('address-search-overlay-close').element()) as HTMLElement;
		expect(close.getAttribute('aria-label')).toBe('Close search');
		const input = (await page.getByRole('combobox').element()) as HTMLInputElement;
		expect(input.placeholder).toBe('Enter a Berlin address');
	});
});
