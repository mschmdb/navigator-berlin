import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import HitzeTrinkbrunnenToggle from './hitze-trinkbrunnen-toggle.svelte';
import {
	featureToTrinkbrunnen,
	type Trinkbrunnen
} from '$lib/data/get-trinkbrunnen-index.js';

const brunnen: Trinkbrunnen[] = [
	featureToTrinkbrunnen({
		type: 'Feature',
		id: 1,
		geometry: { type: 'Point', coordinates: [13.406, 52.521] },
		properties: { name: 'Nah-Brunnen', fee: 'no', bottle: 'yes' }
	})
];

describe('HitzeTrinkbrunnenToggle', () => {
	it('Klick auf den Toggle meldet den trinkbrunnen-Slug', async () => {
		const onToggleLayer = vi.fn();
		render(HitzeTrinkbrunnenToggle, { isActive: false, onToggleLayer });
		await page.getByTestId('trinkbrunnen-map-toggle').click();
		expect(onToggleLayer).toHaveBeenCalledWith('trinkbrunnen');
	});

	it('aria-pressed spiegelt den aktiven Zustand', async () => {
		render(HitzeTrinkbrunnenToggle, { isActive: true, onToggleLayer: () => {} });
		const btn = (await page.getByTestId('trinkbrunnen-map-toggle').element()) as HTMLButtonElement;
		expect(btn.getAttribute('aria-pressed')).toBe('true');
	});

	it('zeigt klaren Text-Button je nach Zustand', async () => {
		render(HitzeTrinkbrunnenToggle, { isActive: false, onToggleLayer: () => {} });
		await expect.element(page.getByText('Trinkbrunnen einblenden')).toBeInTheDocument();
	});

	it('aktiv zeigt Ausblenden-Label', async () => {
		render(HitzeTrinkbrunnenToggle, { isActive: true, onToggleLayer: () => {} });
		await expect.element(page.getByText('Trinkbrunnen ausblenden')).toBeInTheDocument();
	});

	it('ohne onToggleLayer kein Toggle-Button', async () => {
		render(HitzeTrinkbrunnenToggle, { isActive: false });
		await expect.element(page.getByTestId('trinkbrunnen-map-toggle')).not.toBeInTheDocument();
	});

	it('zeigt den nächsten Brunnen mit Navi-Links bei address + index', async () => {
		render(HitzeTrinkbrunnenToggle, {
			isActive: false,
			onToggleLayer: () => {},
			address: { lat: 52.52, lng: 13.405 },
			index: brunnen
		});
		await expect.element(page.getByTestId('trinkbrunnen-nearest')).toBeInTheDocument();
		await expect.element(page.getByText('Nächster: Nah-Brunnen')).toBeInTheDocument();
		const g = (await page.getByRole('link', { name: /Google Maps/ }).element()) as HTMLAnchorElement;
		expect(g.getAttribute('href')).toContain('google.com/maps');
	});

	it('ohne address keine Nächster-Zeile', async () => {
		render(HitzeTrinkbrunnenToggle, { isActive: false, onToggleLayer: () => {}, index: brunnen });
		await expect.element(page.getByTestId('trinkbrunnen-nearest')).not.toBeInTheDocument();
	});
});
