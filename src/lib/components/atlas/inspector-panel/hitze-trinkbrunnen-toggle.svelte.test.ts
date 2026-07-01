import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import HitzeTrinkbrunnenToggle from './hitze-trinkbrunnen-toggle.svelte';

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
});
