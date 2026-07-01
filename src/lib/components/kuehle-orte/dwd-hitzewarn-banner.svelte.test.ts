import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import Banner from './dwd-hitzewarn-banner.svelte';
import type { HeatWarning } from '$lib/data/dwd-warnung.types.js';

const STARK: HeatWarning = {
	level: 'stark',
	label: 'Starke Hitze',
	headline: 'Amtliche Warnung vor starker Hitze',
	source: 'Deutscher Wetterdienst (DWD)',
	sourceUrl: 'https://www.dwd.de/DE/wetter/warnungen/warnungen_node.html'
};

describe('DwdHitzewarnBanner', () => {
	it('stark: zeigt Stufentext + DWD-Quelle, ist Live-Region', async () => {
		render(Banner, { warning: STARK });
		const banner = page.getByTestId('dwd-hitzewarn-banner');
		await expect.element(banner).toBeInTheDocument();
		await expect.element(banner).toHaveAttribute('role', 'status');
		await expect.element(banner).toHaveAttribute('aria-live', 'polite');
		await expect.element(page.getByTestId('dwd-level')).toHaveTextContent('Starke Hitze');
		await expect.element(page.getByTestId('dwd-source')).toHaveTextContent('Deutscher Wetterdienst');
	});

	it('extrem: zeigt „Extreme Hitze"', async () => {
		render(Banner, { warning: { ...STARK, level: 'extrem', label: 'Extreme Hitze' } });
		await expect.element(page.getByTestId('dwd-level')).toHaveTextContent('Extreme Hitze');
	});

	it('null: rendert nichts (kein Banner-Knoten, kein Layout-Platzhalter)', async () => {
		render(Banner, { warning: null });
		await expect.element(page.getByTestId('dwd-hitzewarn-banner')).not.toBeInTheDocument();
	});
});
