import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// i18n Block C4b (spec-i18n-c4b-wahl-methodik-technik.md): Wahldaten-Methodik,
// Architektur, WebMCP und Score-Rangliste sind im Übersetzungs-Register.
//
// Hinweis: hreflang-Ziele per Pfad-Regex prüfen, nicht mit fester Origin
// (Preview-Server liefert die Request-Origin, nicht `prerender.origin`).

/** Maschinenlesbare Dateien bleiben unlokalisiert (Boundary C4b). */
const MACHINE_FILES = [
	'/llms.txt',
	'/llms-full.txt',
	'/webmcp-manifest.json',
	'/.well-known/webmcp.json'
];

const PAGES = [
	{
		path: '/en/methodik/wahldaten',
		dePath: '/methodik/wahldaten',
		h1: 'Methodology · Election data',
		files: []
	},
	{
		path: '/en/architektur',
		dePath: '/architektur',
		h1: 'Architecture',
		files: MACHINE_FILES
	},
	{ path: '/en/webmcp', dePath: '/webmcp', h1: 'WebMCP', files: MACHINE_FILES },
	{
		path: '/en/umwelt-infrastruktur-score',
		dePath: '/umwelt-infrastruktur-score',
		h1: 'Environment & infrastructure score',
		files: []
	}
] as const;

test.describe('i18n Block C4b: vier Seiten englisch, ohne Banner, indexierbar', () => {
	for (const { path, dePath, h1, files } of PAGES) {
		test(`${path}: 200, lang=en, kein Banner, kein noindex, hreflang de/en`, async ({ page }) => {
			const response = await page.goto(path);
			expect(response?.status()).toBe(200);
			await expect(page.locator('html')).toHaveAttribute('lang', 'en');
			await expect(page.locator('main#main')).toHaveAttribute('lang', 'en');
			await expect(page.getByTestId('translation-disclaimer')).toHaveCount(0);
			await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
			await expect(page.locator('main#main h1')).toHaveText(h1);
			await expect(page.locator('main#main [lang="de"]')).toHaveCount(0);
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

		test(`${path}: interne Seiten-Links liegen unter /en, Datei-Links bleiben`, async ({
			page
		}) => {
			await page.goto(path);
			await expect(page.locator('main#main h1')).toBeVisible();
			const links = page.locator('main#main a[href^="/"]');
			await expect(links.first()).toBeAttached();
			const hrefs = await links.evaluateAll((els) =>
				els.map((el) => el.getAttribute('href') ?? '')
			);
			const pageLinks = hrefs.filter((h) => !MACHINE_FILES.includes(h));
			expect(pageLinks.filter((h) => !h.startsWith('/en/'))).toEqual([]);
			for (const file of files) {
				expect(hrefs, file).toContain(file);
			}
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

	test('/en/architektur: Datei-Links unverändert, Seiten-Links unter /en', async ({ page }) => {
		await page.goto('/en/architektur');
		const main = page.locator('main#main');
		for (const file of MACHINE_FILES) {
			await expect(main.locator(`a[href="${file}"]`).first()).toBeAttached();
		}
		await expect(main.locator('a[href="/en/methodik"]')).toBeAttached();
		await expect(main.locator('a[href="/en/lizenzen"]')).toBeAttached();
		await expect(main.locator('a[href="/en/webmcp"]')).toBeAttached();
	});

	test('/en/webmcp: Tool-Namen bleiben unverändert, Beschreibung englisch', async ({ page }) => {
		await page.goto('/en/webmcp');
		const main = page.locator('main#main');
		await expect(main.getByText('address_lookup', { exact: true })).toBeVisible();
		await expect(main.getByText('set_finder_weights', { exact: true })).toBeVisible();
		await expect(main.getByRole('heading', { name: 'Available tools' })).toBeVisible();
	});

	test('/en/methodik/wahldaten: „provisional“ statt „vorläufig“, Anker bleiben', async ({
		page
	}) => {
		await page.goto('/en/methodik/wahldaten');
		await expect(page.locator('#cutoff')).toContainText('(provisional)');
		await expect(page.locator('#cutoff')).not.toContainText('vorläufig');
		await expect(page.locator('#wahldaten-briefwahl a[href="#aggregation"]')).toBeAttached();
	});

	test('/en/umwelt-infrastruktur-score: Rahmen englisch, Methodik-Link unter /en', async ({
		page
	}) => {
		await page.goto('/en/umwelt-infrastruktur-score');
		await expect(page.getByTestId('ranking-editorial-disclaimer')).toContainText(
			'A comparison, not a verdict.'
		);
		const table = page.getByTestId('ranking-table');
		if ((await table.count()) > 0) {
			await expect(table.locator('th[scope="row"] a').first()).toHaveAttribute(
				'href',
				/^\/en\/kiez\//
			);
		} else {
			await expect(page.getByTestId('ranking-empty')).toBeVisible();
		}
		await page.getByTestId('ranking-methodik-disclosure').click();
		await expect(page.locator('a[href="/en/methodik/kiez-score"]').first()).toBeVisible();
	});
});
