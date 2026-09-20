import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import WinnerMapParteiTabs from './winner-map-partei-tabs.svelte';
import { FINDER_PARTIES } from '$lib/components/atlas/internal/kiez-finder-engine.js';

describe('winner-map-partei-tabs.svelte', () => {
	it('rendert "Gewinner" + einen Tab pro FINDER_PARTIES-Partei (7 Parteien)', async () => {
		render(WinnerMapParteiTabs, { aktivePartei: null, onSelect: () => {} });
		await expect.element(page.getByTestId('winner-map-partei-tab-gewinner')).toBeInTheDocument();
		for (const partei of FINDER_PARTIES) {
			await expect.element(page.getByTestId(`winner-map-partei-tab-${partei}`)).toBeInTheDocument();
		}
		expect(FINDER_PARTIES.length).toBe(7);
	});

	it('markiert den aktiven Tab über aria-checked', async () => {
		render(WinnerMapParteiTabs, { aktivePartei: 'CDU', onSelect: () => {} });
		await expect
			.element(page.getByTestId('winner-map-partei-tab-CDU'))
			.toHaveAttribute('aria-checked', 'true');
		await expect
			.element(page.getByTestId('winner-map-partei-tab-gewinner'))
			.toHaveAttribute('aria-checked', 'false');
	});

	it('Klick auf einen Partei-Tab ruft onSelect mit dem Kurznamen auf', async () => {
		const onSelect = vi.fn();
		render(WinnerMapParteiTabs, { aktivePartei: null, onSelect });
		await page.getByTestId('winner-map-partei-tab-SPD').click();
		expect(onSelect).toHaveBeenCalledWith('SPD');
	});

	it('Klick auf "Gewinner" ruft onSelect mit null auf (zurück zum Bestand)', async () => {
		const onSelect = vi.fn();
		render(WinnerMapParteiTabs, { aktivePartei: 'SPD', onSelect });
		await page.getByTestId('winner-map-partei-tab-gewinner').click();
		expect(onSelect).toHaveBeenCalledWith(null);
	});

	it('ArrowRight bewegt den Fokus zum nächsten Tab und wählt ihn', async () => {
		const onSelect = vi.fn();
		render(WinnerMapParteiTabs, { aktivePartei: null, onSelect });
		const gewinner = page.getByTestId('winner-map-partei-tab-gewinner');
		await gewinner.click();
		await gewinner
			.element()
			.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
		expect(onSelect).toHaveBeenCalledWith(FINDER_PARTIES[0]);
	});
});
