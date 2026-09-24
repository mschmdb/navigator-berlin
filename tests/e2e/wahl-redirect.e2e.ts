import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Story 16: /wahl → /berlin-wahlen. Deckt die echte hooks.server.ts-Sequenz
// (301 in der realen `handle`-Kette, nicht nur den Handler isoliert) und die
// migrierte Detailseite ab, die vorher weder E2E- noch A11y-Coverage hatte.
test.describe('Story 16: /wahl → /berlin-wahlen Redirects', () => {
	test('GET /wahl/2023-bvv?x=1 antwortet mit 301 auf /berlin-wahlen/2023-bvv?x=1', async ({
		request
	}) => {
		const response = await request.get('/wahl/2023-bvv?x=1', { maxRedirects: 0 });
		expect(response.status()).toBe(301);
		expect(response.headers()['location']).toBe('/berlin-wahlen/2023-bvv?x=1');
	});

	test('GET /wahl/foo (ungültiger Slug) antwortet mit 404, kein Redirect', async ({ request }) => {
		const response = await request.get('/wahl/foo', { maxRedirects: 0 });
		expect(response.status()).toBe(404);
	});

	test('GET /berlin-wahlen/2023-bvv rendert die Detailseite', async ({ page }) => {
		await page.goto('/berlin-wahlen/2023-bvv');
		await expect(page.getByTestId('wahl-detail-page')).toBeVisible();
		await expect(page.getByTestId('wahl-detail-title')).toBeVisible();
	});

	test('Wahl-Detailseite hat 0 axe-Violations', async ({ page }) => {
		await page.goto('/berlin-wahlen/2023-bvv');
		await expect(page.getByTestId('wahl-detail-page')).toBeVisible();
		const results = await new AxeBuilder({ page })
			.withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
			.analyze();
		expect(results.violations).toEqual([]);
	});
});
