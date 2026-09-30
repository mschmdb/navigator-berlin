import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// i18n Block C4a (spec-i18n-c4a-methodik-kern.md): /methodik,
// /methodik/kiez-score und /methodik/cross-layer-templates sind im
// Übersetzungs-Register. /methodik/wahldaten folgt in C4b (`i18n-c4b.e2e.ts`).
//
// Hinweis: hreflang-Ziele per Pfad-Regex prüfen, nicht mit fester Origin
// (Preview-Server liefert die Request-Origin, nicht `prerender.origin`).

const INDEXABLE_PAGES = [
	{ path: '/en/methodik', dePath: '/methodik', h1: 'Methodology', testid: 'methodik-page-title' },
	{
		path: '/en/methodik/kiez-score',
		dePath: '/methodik/kiez-score',
		h1: 'Environment & infrastructure score',
		testid: 'methodik-kiez-score-h1'
	}
] as const;

test.describe('i18n Block C4a: Methodik-Seiten englisch, ohne Banner, indexierbar', () => {
	for (const { path, dePath, h1, testid } of INDEXABLE_PAGES) {
		test(`${path}: 200, lang=en, kein Banner, kein noindex, hreflang de/en`, async ({ page }) => {
			const response = await page.goto(path);
			expect(response?.status()).toBe(200);
			await expect(page.locator('html')).toHaveAttribute('lang', 'en');
			await expect(page.locator('main#main')).toHaveAttribute('lang', 'en');
			await expect(page.getByTestId('translation-disclaimer')).toHaveCount(0);
			await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
			await expect(page.getByTestId(testid)).toHaveText(h1);
			await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute(
				'href',
				new RegExp(`${path}$`)
			);
			await expect(page.locator('link[rel="alternate"][hreflang="de"]')).toHaveAttribute(
				'href',
				new RegExp(`${dePath}$`)
			);
		});

		test(`${dePath} (DE): hreflang=en vorhanden, lang=de`, async ({ page }) => {
			await page.goto(dePath);
			await expect(page.locator('html')).toHaveAttribute('lang', 'de');
			await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute(
				'href',
				new RegExp(`${path}$`)
			);
		});

		test(`${path}: alle internen Inhalts-Links liegen unter /en`, async ({ page }) => {
			await page.goto(path);
			const links = page.locator('main#main article a[href^="/"]');
			// Unter Parallel-Last fehlen die Links direkt nach Load kurz; warten statt einmalig lesen.
			await expect(links.nth(2)).toBeAttached();
			const hrefs = await links.evaluateAll((els) =>
				els.map((el) => el.getAttribute('href') ?? '')
			);
			expect(hrefs.length).toBeGreaterThanOrEqual(3);
			expect(hrefs.filter((h) => !h.startsWith('/en/'))).toEqual([]);
		});

		test(`${path}: 0 axe-Violations`, async ({ page }) => {
			await page.goto(path);
			await expect(page.getByTestId(testid)).toBeVisible();
			const results = await new AxeBuilder({ page })
				.withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
				.analyze();
			expect(results.violations).toEqual([]);
		});
	}

	test('/en/methodik: Daten-Tabelle englisch, Layer-Link unter /en', async ({ page }) => {
		await page.goto('/en/methodik');
		const table = page.getByTestId('methodik-daten-table');
		await expect(table.locator('caption')).toHaveText('Data status table of all active layers');
		await expect(table.getByRole('columnheader', { name: 'Last updated' })).toBeVisible();
		await expect(table.locator('a[href="/en/layer/laerm-2023"]')).toHaveText(
			'Noise pollution 2023'
		);
	});

	test('/en/methodik: Wahldaten-Link führt auf /en/methodik/wahldaten (seit C4b ohne Banner)', async ({
		page
	}) => {
		await page.goto('/en/methodik');
		await page.getByTestId('methodik-wahldaten-link').click();
		await expect(page).toHaveURL(/\/en\/methodik\/wahldaten$/);
		await expect(page.getByTestId('translation-disclaimer')).toHaveCount(0);
	});

	test('/en/methodik/kiez-score: Dimensionsliste und Gewichte englisch', async ({ page }) => {
		await page.goto('/en/methodik/kiez-score');
		const dimensions = page.locator('#dimensionen');
		await expect(dimensions).toContainText('Quiet & air');
		await expect(dimensions).toContainText('Tenant protection');
		await expect(page.locator('#gewichte')).toContainText(
			'Recorded crime (not in the overall score)'
		);
		await expect(page.getByTestId('methodik-kiez-score-back-link')).toHaveAttribute(
			'href',
			'/en/methodik'
		);
	});

	test('/en/methodik/cross-layer-templates: Template-Text und Fixture englisch, nur die deutsche Editorial-Note trägt lang="de"', async ({
		page
	}) => {
		const response = await page.goto('/en/methodik/cross-layer-templates');
		expect(response?.status()).toBe(200);
		await expect(page.getByTestId('translation-disclaimer')).toHaveCount(0);
		// Die Editorial-Note hat keine EN-Fassung und bleibt deutsch (WCAG 3.1.2).
		const germanParts = page.locator('main#main [lang="de"]');
		await expect(germanParts).toHaveCount(1);
		await expect(germanParts.first()).toHaveJSProperty('tagName', 'P');
		await expect(page.getByTestId('block-wahl-trend-zeit-kiez-kiez-body')).not.toHaveAttribute(
			'lang',
			/.+/
		);
		const block = page.getByTestId('block-wahl-trend-zeit-kiez-kiez-body');
		await expect(block).toContainText(
			'In the Kiez Friedrichshain Nord, the party votes were distributed'
		);
		await expect(page.getByTestId('preview-wahl-trend-zeit-kiez-kiez')).toContainText(
			'Fixture: Kiez Friedrichshain Nord'
		);
		await expect(page.getByTestId('block-wahl-trend-zeit-kiez-kiez-methodik-link')).toHaveAttribute(
			'href',
			'/en/methodik'
		);
	});

	test('/methodik/cross-layer-templates (DE): Template-Text deutsch', async ({ page }) => {
		await page.goto('/methodik/cross-layer-templates');
		await expect(page.getByTestId('block-wahl-trend-zeit-kiez-kiez-body')).toContainText(
			'Im Kiez Friedrichshain Nord verteilten sich die Zweitstimmen'
		);
	});
});
