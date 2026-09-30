import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// i18n Block C4c (spec-i18n-c4c-hitze-quellen.md): Hitze, Kühle Orte und Lizenzen
// sind im Übersetzungs-Register.
//
// Hinweis: hreflang-Ziele per Pfad-Regex prüfen, nicht mit fester Origin
// (Preview-Server liefert die Request-Origin, nicht `prerender.origin`).

const PAGES = [
	{ path: '/en/hitze', dePath: '/hitze', h1: 'Heat Navigator Berlin' },
	{ path: '/en/kuehle-orte', dePath: '/kuehle-orte', h1: 'Cool places in Berlin' },
	{ path: '/en/lizenzen', dePath: '/lizenzen', h1: 'Licences' }
] as const;

test.describe('i18n Block C4c: drei Seiten englisch, ohne Banner, indexierbar', () => {
	for (const { path, dePath, h1 } of PAGES) {
		test(`${path}: 200, lang=en, kein Banner, kein noindex, hreflang de/en`, async ({ page }) => {
			const response = await page.goto(path);
			expect(response?.status()).toBe(200);
			await expect(page.locator('html')).toHaveAttribute('lang', 'en');
			await expect(page.locator('main#main')).toHaveAttribute('lang', 'en');
			await expect(page.getByTestId('translation-disclaimer')).toHaveCount(0);
			await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
			await expect(page.locator('main#main h1')).toHaveText(h1);
			await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute(
				'href',
				new RegExp(`${path}$`)
			);
			await expect(page.locator('link[rel="alternate"][hreflang="de"]')).toHaveAttribute(
				'href',
				new RegExp(`${dePath}$`)
			);
			await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
				'href',
				new RegExp(`${path}$`)
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

		test(`${path}: interne Seiten-Links liegen unter /en`, async ({ page }) => {
			await page.goto(path);
			await expect(page.locator('main#main h1')).toBeVisible();
			const links = page.locator('main#main a[href^="/"]');
			await expect(links.first()).toBeAttached();
			const hrefs = await links.evaluateAll((els) =>
				els.map((el) => el.getAttribute('href') ?? '')
			);
			expect(hrefs.length).toBeGreaterThan(0);
			expect(hrefs.filter((h) => !h.startsWith('/en/'))).toEqual([]);
		});

		test(`${path}: 0 axe-Violations`, async ({ page }) => {
			await page.goto(path);
			await expect(page.locator('main#main h1')).toBeVisible();
			const results = await new AxeBuilder({ page })
				.withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
				.analyze();
			expect(results.violations).toEqual([]);
		});
	}

	test('/en/hitze: FAQ englisch und ohne lang="de"', async ({ page }) => {
		await page.goto('/en/hitze');
		const faq = page.getByTestId('faq-section');
		await expect(faq).toBeVisible();
		await expect(faq.locator('[lang]')).toHaveCount(0);
		await expect(faq.getByRole('button', { name: /Where can I find cool places/ })).toBeVisible();
		await expect(page.getByTestId('hitze-cta')).toHaveAttribute(
			'href',
			'/en/explore?layers=kuehle-orte&mode=hitze'
		);
	});

	test('/en/kuehle-orte: Rahmen englisch, Karte eingebettet', async ({ page }) => {
		await page.goto('/en/kuehle-orte');
		await expect(page.getByTestId('map-embed')).toBeAttached();
		await expect(page.getByTestId('explorer-cta')).toHaveText(/Explore the map/);
		await expect(page.getByTestId('explorer-cta')).toHaveAttribute(
			'href',
			'/en/explore?layers=kuehle-orte'
		);
	});

	test('/en/lizenzen: Kennungen unverändert, DataCatalog-JSON-LD bleibt deutsch', async ({
		page
	}) => {
		await page.goto('/en/lizenzen');
		const main = page.locator('main#main');
		await expect(main.getByRole('heading', { name: 'Data licences' })).toBeVisible();
		await expect(main.getByRole('link', { name: 'dl-de/by-2-0' }).first()).toBeAttached();
		await expect(main.getByRole('link', { name: 'ODbL 1.0' }).first()).toBeAttached();
		const catalog = await page.locator('[data-testid="lizenzen-datacatalog-jsonld"]').innerHTML();
		expect(catalog).toContain('navigator.berlin Daten-Katalog');
	});

	test('/en/methodik: Lizenz-Verweis zeigt das Label statt des Pfads', async ({ page }) => {
		await page.goto('/en/methodik');
		await expect(
			page.locator('main#main').getByRole('link', { name: 'licences page' }).first()
		).toHaveAttribute('href', '/en/lizenzen');
	});
});
