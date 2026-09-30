import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readdirSync } from 'node:fs';

// i18n Block C4d (spec-i18n-c4d-updates.md): /updates und alle Einträge sind
// englisch, ohne Banner, indexierbar. Die Feeds bleiben deutsch.
//
// Hinweis: hreflang-Ziele per Pfad-Regex prüfen, nicht mit fester Origin
// (Preview-Server liefert die Request-Origin, nicht `prerender.origin`).
// Link-Ziele über `el.href` auflösen: das prerenderte HTML enthält relative Pfade
// (`../../en/updates`), die erst nach der Hydration absolut sind.

// Anzahl der DE-Einträge aus dem Content-Ordner, jede hat eine .en.md-Schwester.
const CONTENT_FILES = readdirSync('_content/updates');
const DE_FILES = CONTENT_FILES.filter((f) => /^\d{4}-\d{2}-\d{2}-.+(?<!\.en)\.md$/.test(f));
const ENTRY_COUNT = DE_FILES.length;
const FEED_PATHS = ['/updates/rss.xml', '/updates/atom.xml', '/updates/feed.json'];

test.describe('i18n Block C4d: Updates englisch, ohne Banner, indexierbar', () => {
	test('jeder DE-Eintrag hat eine .en.md-Schwester', () => {
		expect(ENTRY_COUNT).toBeGreaterThan(0);
		for (const file of DE_FILES) {
			expect(CONTENT_FILES, file).toContain(file.replace(/\.md$/, '.en.md'));
		}
	});

	test('/en/updates: 200, lang=en, kein Banner, kein noindex, hreflang de/en', async ({ page }) => {
		const response = await page.goto('/en/updates');
		expect(response?.status()).toBe(200);
		await expect(page.locator('html')).toHaveAttribute('lang', 'en');
		await expect(page.locator('main#main')).toHaveAttribute('lang', 'en');
		await expect(page.getByTestId('translation-disclaimer')).toHaveCount(0);
		await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
		await expect(page.getByTestId('updates-page-title')).toHaveText('Updates');
		await expect(page.locator('link[rel="alternate"][hreflang="en"]:not([type])')).toHaveAttribute(
			'href',
			/\/en\/updates$/
		);
		await expect(page.locator('link[rel="alternate"][hreflang="de"]:not([type])')).toHaveAttribute(
			'href',
			/\/updates$/
		);
		await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/en\/updates$/);
		// Feeds bleiben DE und sind als solche gekennzeichnet.
		await expect(page.locator('link[rel="alternate"][type*="xml"][hreflang="de"]')).toHaveCount(2);
		await expect(page.locator('main#main header a[hreflang="de"]')).toHaveCount(3);
	});

	test('/en/updates: Liste, Filter und Kategorien englisch, Links unter /en', async ({ page }) => {
		await page.goto('/en/updates');
		await expect(page.getByTestId('updates-entry-card')).toHaveCount(ENTRY_COUNT);
		await expect(page.getByTestId('updates-filter-feedback')).toHaveText(
			`All categories active. ${ENTRY_COUNT} entries.`
		);
		await expect(page.getByTestId('filter-toggle').first()).toHaveText('Data update');
		await expect(page.getByTestId('updates-list').locator('[lang]')).toHaveCount(0);
		const cardHrefs = await page
			.getByTestId('updates-list')
			.locator('a')
			.evaluateAll((els) => els.map((el) => new URL((el as HTMLAnchorElement).href).pathname));
		expect(cardHrefs.length).toBe(ENTRY_COUNT * 2);
		expect(cardHrefs.filter((h) => !h.startsWith('/en/updates/'))).toEqual([]);
	});

	test('/en/updates/launch: Body englisch, kein Banner, kein noindex, JSON-LD en-US', async ({
		page
	}) => {
		const response = await page.goto('/en/updates/launch');
		expect(response?.status()).toBe(200);
		await expect(page.locator('html')).toHaveAttribute('lang', 'en');
		await expect(page.getByTestId('translation-disclaimer')).toHaveCount(0);
		await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
		await expect(page.getByTestId('updates-detail-title')).toHaveText('Updates page goes live');
		await expect(
			page.getByTestId('updates-detail-body').getByRole('heading', { level: 2 }).first()
		).toHaveText('What changes');
		// Nur die deutschen Tag-Slugs tragen lang="de".
		await expect(page.locator('main#main [lang]:not(li)')).toHaveCount(0);
		await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
			'href',
			/\/en\/updates\/launch$/
		);
		const post = JSON.parse(
			(await page.getByTestId('updates-detail-jsonld').textContent()) ?? '{}'
		) as { inLanguage: string; headline: string };
		expect(post.inLanguage).toBe('en-US');
		expect(post.headline).toBe('Updates page goes live');
	});

	test('/en/updates/launch: interne Links liegen unter /en, Feed-Links bleiben', async ({
		page
	}) => {
		await page.goto('/en/updates/launch');
		await expect(page.getByTestId('updates-detail-title')).toBeVisible();
		const hrefs = await page.locator('main#main a[href]').evaluateAll((els) =>
			els
				.map((el) => new URL((el as HTMLAnchorElement).href))
				.filter((url) => url.origin === window.location.origin)
				.map((url) => url.pathname)
		);
		expect(hrefs.length).toBeGreaterThan(0);
		expect(hrefs.filter((h) => !h.startsWith('/en') && !FEED_PATHS.includes(h))).toEqual([]);
		expect(hrefs).toContain('/en/updates');
		expect(hrefs).toContain('/en/');
	});

	test('/updates/launch (DE): lang=de, hreflang=en vorhanden, Body deutsch', async ({ page }) => {
		await page.goto('/updates/launch');
		await expect(page.locator('html')).toHaveAttribute('lang', 'de');
		await expect(page.getByTestId('updates-detail-title')).toHaveText('Updates-Route geht live');
		await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute(
			'href',
			/\/en\/updates\/launch$/
		);
	});

	for (const path of ['/en/updates', '/en/updates/launch', '/en/updates/kiez-finder']) {
		test(`${path}: 0 axe-Violations`, async ({ page }) => {
			await page.goto(path);
			await expect(page.locator('main#main h1')).toBeVisible();
			const results = await new AxeBuilder({ page })
				.withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
				.analyze();
			expect(results.violations).toEqual([]);
		});
	}

	test('Feeds bleiben deutsch, ohne .en-Duplikate', async ({ request }) => {
		const rss = await (await request.get('/updates/rss.xml')).text();
		expect(rss.match(/<item>/g)).toHaveLength(ENTRY_COUNT);
		expect(rss).toContain('Updates-Route geht live');
		expect(rss).not.toContain('Updates page goes live');
		expect(rss).not.toMatch(/\/updates\/[^<"\s]+\.en[<"\s]/);

		const atom = await (await request.get('/updates/atom.xml')).text();
		expect(atom.match(/<entry>/g)).toHaveLength(ENTRY_COUNT);
		expect(atom).not.toMatch(/\/updates\/[^<"\s]+\.en[<"\s]/);

		const json = (await (await request.get('/updates/feed.json')).json()) as {
			items: { id: string; title: string }[];
		};
		expect(json.items).toHaveLength(ENTRY_COUNT);
		expect(json.items.filter((i) => /\.en\b/.test(i.id))).toEqual([]);
		expect(json.items.map((i) => i.title)).toContain('Updates-Route geht live');
	});
});
