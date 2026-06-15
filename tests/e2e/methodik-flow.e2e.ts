import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Story 1.29 Atlas-Methodik-Pattern', () => {
	test('/methodik rendert ohne Fehler mit allen 10 Pflicht-Sections', async ({ page }) => {
		const res = await page.goto('/methodik');
		expect(res?.status()).toBeLessThan(400);
		await expect(page.getByTestId('methodik-page-title')).toHaveText('Methodik');
		for (const id of [
			'mission',
			'datenarchitektur',
			'aggregations-ebenen',
			'cross-layer',
			'coverage-strategie',
			'omissions',
			'editorial',
			'daten-stand',
			'lizenzen',
			'feedback'
		]) {
			await expect(page.locator(`section#${id}`)).toBeVisible();
		}
	});

	test('Daten-Tabelle zeigt mindestens 30 Layer-Rows', async ({ page }) => {
		await page.goto('/methodik');
		const rows = page.locator('[data-testid="methodik-daten-table"] tbody tr');
		expect(await rows.count()).toBeGreaterThanOrEqual(30);
	});

	test('Daten-Tabelle: Layer-Row-Link öffnet Layer-Detail-Page', async ({ page }) => {
		await page.goto('/methodik');
		const link = page.locator('[data-testid="methodik-daten-table"] a[href="/layer/laerm-2023"]');
		await expect(link).toBeVisible();
		await link.click();
		await expect(page.getByTestId('layer-detail-name')).toHaveText(/Lärm/);
	});

	test('Layer-Detail-Page enthält 4 Pflicht-Sections + Methodik-Atlas-Link', async ({ page }) => {
		await page.goto('/layer/laerm-2023');
		await expect(page.getByTestId('layer-detail-methodology')).toBeVisible();
		await expect(page.getByTestId('layer-detail-coverage-gaps')).toBeVisible();
		await expect(page.getByTestId('layer-detail-omissions')).toBeVisible();
		await expect(page.getByTestId('layer-detail-related')).toBeVisible();
		const banner = page.getByTestId('layer-detail-methodik-link');
		await expect(banner).toBeVisible();
		await expect(banner.locator('a[href^="/methodik"]')).toBeVisible();
	});

	test('Methodik-Page hat 0 axe-Violations', async ({ page }) => {
		await page.goto('/methodik');
		await expect(page.getByTestId('methodik-page-title')).toBeVisible();
		const results = await new AxeBuilder({ page })
			.withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
			.analyze();
		expect(results.violations).toEqual([]);
	});
});
