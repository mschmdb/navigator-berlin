import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
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
		await expect
			.element(page.getByTestId('dwd-source'))
			.toHaveTextContent('Deutscher Wetterdienst');
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

describe('DwdHitzewarnBanner · EN (i18n C4c)', () => {
	afterEach(() => overwriteGetLocale(() => 'de'));

	it('Stufe und Quelle englisch, Live-Warntext unverändert mit lang="de"', async () => {
		overwriteGetLocale(() => 'en');
		render(Banner, { warning: STARK });
		await expect.element(page.getByTestId('dwd-level')).toHaveTextContent('Strong heat');
		await expect
			.element(page.getByTestId('dwd-source'))
			.toHaveTextContent('German Weather Service (DWD)');
		const headline = page.getByText('Amtliche Warnung vor starker Hitze');
		await expect.element(headline).toHaveAttribute('lang', 'de');
	});

	it('extrem: "Extreme heat"', async () => {
		overwriteGetLocale(() => 'en');
		render(Banner, { warning: { ...STARK, level: 'extrem', label: 'Extreme Hitze' } });
		await expect.element(page.getByTestId('dwd-level')).toHaveTextContent('Extreme heat');
	});

	it('Fallback-Headline (Server setzt das DE-Label) erscheint übersetzt und ohne lang', async () => {
		overwriteGetLocale(() => 'en');
		render(Banner, { warning: { ...STARK, headline: 'Starke Hitze' } });
		const banner = (await page.getByTestId('dwd-hitzewarn-banner').element()) as HTMLElement;
		expect(banner.textContent).not.toContain('Starke Hitze');
		expect(banner.querySelector('[lang="de"]')).toBeNull();
	});
});

describe('DwdHitzewarnBanner · leere Headline (i18n C4c)', () => {
	afterEach(() => overwriteGetLocale(() => 'de'));

	it.each(['', '   '])(
		'Headline %j wird wie der Fallback behandelt, ohne lang="de"',
		async (headline) => {
			overwriteGetLocale(() => 'en');
			render(Banner, { warning: { ...STARK, headline } });
			const banner = (await page.getByTestId('dwd-hitzewarn-banner').element()) as HTMLElement;
			expect(banner.querySelector('[lang="de"]')).toBeNull();
			expect(banner.textContent).toContain('Strong heat');
		}
	);
});

describe('DwdHitzewarnBanner · DE-Wortlaut (i18n C4c)', () => {
	it('Quelle und Stufe deutsch, Live-Text ohne lang', async () => {
		render(Banner, { warning: STARK });
		const banner = (await page.getByTestId('dwd-hitzewarn-banner').element()) as HTMLElement;
		expect(banner.textContent?.replace(/\s+/g, ' ').trim()).toBe(
			'Starke Hitze Amtliche Warnung vor starker Hitze Deutscher Wetterdienst (DWD)'
		);
		expect(banner.querySelector('[lang]')).toBeNull();
	});
});
