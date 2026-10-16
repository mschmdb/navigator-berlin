import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Issues #58, #59: Kälte-Grundgerüst mit Notfall-Block. Seite ist bis zum Launch (#63) noindex.
test.describe('Kälte-Navigator', () => {
	test('DE: 200, h1, Notfall-Block und tel-Links', async ({ page }) => {
		const res = await page.goto('/kaelte');
		expect(res?.status()).toBe(200);
		await expect(page.getByRole('heading', { level: 1 })).toContainText('Kälte-Navigator Berlin');
		await expect(page.getByTestId('kaelte-notfall')).toBeVisible();
		await expect(page.getByTestId('kaelte-112-link')).toHaveAttribute('href', 'tel:112');
		const telLinks = page.locator('[data-testid="kaelte-notfall"] a[href^="tel:"]');
		await expect(telLinks).toHaveCount(5);
		for (const link of await telLinks.all()) {
			const text = ((await link.textContent()) ?? '').trim();
			expect(text).toMatch(/\d/);
		}
	});

	test('EN: 200 und englische Überschrift', async ({ page }) => {
		const res = await page.goto('/en/kaelte');
		expect(res?.status()).toBe(200);
		await expect(page.getByRole('heading', { level: 1 })).toContainText('Cold Navigator Berlin');
		await expect(page.getByRole('heading', { name: 'See someone out in the cold?' })).toBeVisible();
	});

	test('Canonical auf navigator.berlin-Struktur, noindex, hreflang', async ({ page }) => {
		await page.goto('/kaelte');
		await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/kaelte$/);
		await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
		await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute(
			'href',
			/\/en\/kaelte$/
		);
	});

	// 16.11.2026 21:30 Berliner Zeit (MEZ): Kältehilfetelefon, Wärmebus und Kältebus im Dienst.
	const ABEND_NOVEMBER = new Date('2026-11-16T20:30:00Z');
	const JUNI = new Date('2026-06-10T18:00:00Z');

	test('AC 1: 112 und erster erreichbarer Dienst liegen ohne Scrollen im Viewport', async ({
		page
	}) => {
		await page.clock.setFixedTime(ABEND_NOVEMBER);
		await page.setViewportSize({ width: 390, height: 844 });
		await page.goto('/kaelte');
		await expect(page.getByTestId('kaelte-112-link')).toBeInViewport();
		const firstOpen = page
			.locator('[data-testid^="kaelte-dienst-"]')
			.filter({ hasText: 'Jetzt erreichbar' })
			.first();
		await expect(firstOpen.locator('a[href^="tel:"]')).toBeInViewport();
	});

	for (const [label, time] of [
		['November abends', ABEND_NOVEMBER],
		['Juni', JUNI]
	] as const) {
		test(`keine Axe-Verstöße (WCAG 2.2 AA), ${label}`, async ({ page }) => {
			await page.clock.setFixedTime(time);
			await page.goto('/kaelte');
			const results = await new AxeBuilder({ page })
				.withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
				.analyze();
			expect(results.violations).toEqual([]);
		});
	}

	test('Sitemaps und llms.txt führen /kaelte noch nicht', async ({ request }) => {
		for (const path of ['/sitemap.xml', '/sitemap-de.xml', '/sitemap-en.xml']) {
			const sitemap = await request.get(path);
			expect(await sitemap.text(), path).not.toContain('/kaelte');
		}
		const llms = await request.get('/llms.txt');
		expect(await llms.text()).not.toContain('/kaelte');
	});
});
