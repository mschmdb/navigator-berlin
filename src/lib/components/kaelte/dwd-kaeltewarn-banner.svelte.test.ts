import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import Banner from './dwd-kaeltewarn-banner.svelte';
import type { ColdWarning } from '$lib/data/dwd-warnung.types.js';

const FROST: ColdWarning = {
	event: 'strenger-frost',
	level: 2,
	headline: 'Amtliche WARNUNG vor strengem Frost',
	source: 'Deutscher Wetterdienst (DWD)',
	sourceUrl: 'https://www.dwd.de/warnungen'
};
const GLATTEIS: ColdWarning = {
	event: 'glatteis',
	level: 3,
	headline: 'Amtliche UNWETTERWARNUNG vor Glatteis',
	source: 'Deutscher Wetterdienst (DWD)',
	sourceUrl: 'https://www.dwd.de/warnungen'
};

afterEach(() => overwriteGetLocale(() => 'de'));

describe('DwdKaeltewarnBanner', () => {
	it('eine Warnung: Ereignis, Stufe als Text, Headline, Quelle, Live-Region', async () => {
		render(Banner, { warnings: [FROST] });
		const banner = page.getByTestId('dwd-kaeltewarn-banner');
		await expect.element(banner).toHaveAttribute('role', 'status');
		await expect.element(banner).toHaveAttribute('aria-live', 'polite');
		await expect.element(page.getByTestId('dwd-kaelte-event')).toHaveTextContent('Strenger Frost');
		await expect
			.element(page.getByTestId('dwd-kaelte-level'))
			.toHaveTextContent('Warnstufe 2, Warnung vor markantem Wetter');
		await expect.element(page.getByText('Amtliche WARNUNG vor strengem Frost')).toBeVisible();
		const source = page.getByTestId('dwd-kaelte-source');
		await expect.element(source).toHaveTextContent('Quelle: Deutscher Wetterdienst');
		await expect.element(source).toHaveAttribute('href', 'https://www.dwd.de/warnungen');
	});

	it('mehrere Warnungen: Liste in übergebener Reihenfolge, eine Quelle', async () => {
		render(Banner, { warnings: [GLATTEIS, FROST] });
		const items = document.querySelectorAll('[data-testid="dwd-kaelte-warnung"]');
		expect(items).toHaveLength(2);
		expect(items[0]?.textContent).toContain('Glatteis');
		expect(items[1]?.textContent).toContain('Strenger Frost');
		expect(document.querySelectorAll('[data-testid="dwd-kaelte-source"]')).toHaveLength(1);
	});

	it('leere Liste: rendert nichts', async () => {
		render(Banner, { warnings: [] });
		await expect.element(page.getByTestId('dwd-kaeltewarn-banner')).not.toBeInTheDocument();
	});

	it('DE: Text ohne lang-Attribut und ohne em-dash', async () => {
		render(Banner, { warnings: [GLATTEIS, FROST] });
		const banner = (await page.getByTestId('dwd-kaeltewarn-banner').element()) as HTMLElement;
		expect(banner.querySelector('[lang]')).toBeNull();
		expect(banner.textContent?.includes('—')).toBe(false);
	});

	it('EN: Ereignis, Stufe und Quelle englisch, DWD-Text deutsch mit lang="de"', async () => {
		overwriteGetLocale(() => 'en');
		render(Banner, { warnings: [FROST] });
		await expect.element(page.getByTestId('dwd-kaelte-event')).toHaveTextContent('Severe frost');
		await expect
			.element(page.getByTestId('dwd-kaelte-level'))
			.toHaveTextContent('Warning level 2, Warning of significant weather');
		await expect
			.element(page.getByTestId('dwd-kaelte-source'))
			.toHaveTextContent('Source: German Weather Service (DWD)');
		await expect
			.element(page.getByText('Amtliche WARNUNG vor strengem Frost'))
			.toHaveAttribute('lang', 'de');
	});

	it('EN: Fehlende Headline (null) erscheint übersetzt ohne lang', async () => {
		overwriteGetLocale(() => 'en');
		render(Banner, { warnings: [{ ...FROST, headline: null }] });
		const banner = (await page.getByTestId('dwd-kaeltewarn-banner').element()) as HTMLElement;
		expect(banner.textContent).not.toContain('Strenger Frost');
		expect(banner.querySelector('[lang="de"]')).toBeNull();
	});

	it('Quellenlink trägt den Neuer-Tab-Hinweis', async () => {
		render(Banner, { warnings: [FROST] });
		await expect
			.element(page.getByTestId('dwd-kaelte-source'))
			.toHaveTextContent('(öffnet neuen Tab)');
	});

	it('null-Headline: übersetztes Ereignis ohne lang (DE)', async () => {
		render(Banner, { warnings: [{ ...FROST, headline: null }] });
		const banner = (await page.getByTestId('dwd-kaeltewarn-banner').element()) as HTMLElement;
		expect(banner.querySelector('[lang]')).toBeNull();
		expect(banner.querySelectorAll('li')[0]?.textContent).toContain('Strenger Frost');
	});
});

describe('DwdKaeltewarnBanner · Farbstufe', () => {
	const tone = async () =>
		((await page.getByTestId('dwd-kaeltewarn-banner').element()) as HTMLElement).className;

	it('nur Stufe 2: state-warning', async () => {
		render(Banner, { warnings: [FROST] });
		const cls = await tone();
		expect(cls).toContain('state-warning');
		expect(cls).not.toContain('state-error');
	});

	it('gemischte Liste mit Stufe 3: state-error', async () => {
		render(Banner, { warnings: [GLATTEIS, FROST] });
		expect(await tone()).toContain('state-error');
	});

	it('Stufe 4 mit Schnee-Code: state-error und Bedeutung', async () => {
		render(Banner, {
			warnings: [
				{
					...FROST,
					event: 'extrem-starker-schneefall',
					level: 4,
					headline: 'Amtliche WARNUNG vor extrem starkem Schneefall'
				}
			]
		});
		expect(await tone()).toContain('state-error');
		await expect
			.element(page.getByTestId('dwd-kaelte-level'))
			.toHaveTextContent('Warnstufe 4, Warnung vor extremem Unwetter');
		await expect
			.element(page.getByTestId('dwd-kaelte-event'))
			.toHaveTextContent('Extrem starker Schneefall');
	});
});
