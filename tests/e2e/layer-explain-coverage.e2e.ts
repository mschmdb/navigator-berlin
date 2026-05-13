import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function waitForMap(page: import('@playwright/test').Page) {
	await page
		.locator('[data-testid="map-skeleton"]')
		.waitFor({ state: 'detached', timeout: 15000 });
}

test.describe('Story 1.16 Layer-Explain-Coverage + Multi-Surface', () => {
	test('Layer-Palette: Subline mit short-Explain unter Layer-Name (Lärm)', async ({ page }) => {
		await page.goto('/');
		await waitForMap(page);
		await page.keyboard.press('/');
		await expect(page.getByTestId('layer-palette')).toBeVisible();
		const subline = page.getByTestId('palette-subline-laerm-2023');
		await expect(subline).toBeVisible();
		await expect(subline).toContainText(/Lärmbelastung|Stadtteil/);
	});

	test('Map-Legend: Click expandiert Panel mit long-Explain + Source', async ({ page }) => {
		await page.goto('/?layers=wohnlagen-2024');
		await waitForMap(page);
		const summary = page.getByTestId('legend-summary-wohnlagen-2024');
		await expect(summary).toBeVisible();
		await summary.click();
		await expect(page.getByTestId('legend-expand-wohnlagen-2024')).toBeVisible();
		await expect(page.getByTestId('legend-source-link-wohnlagen-2024')).toHaveAttribute(
			'href',
			/gdi\.berlin\.de|wohnlagen/
		);
		await expect(page.getByTestId('legend-more-link-wohnlagen-2024')).toHaveAttribute(
			'href',
			/\/de\/layer\/wohnlagen-2024/
		);
	});

	test('Detail-Page /de/layer/wohnlagen-2024 rendert alle Sektionen', async ({ page }) => {
		await page.goto('/de/layer/wohnlagen-2024');
		await expect(page.getByTestId('layer-detail-page')).toBeVisible();
		await expect(page.getByTestId('layer-detail-name')).toHaveText(/Mietspiegel-Wohnlage/);
		await expect(page.getByTestId('layer-detail-lead')).toBeVisible();
		await expect(page.getByTestId('layer-detail-source-card')).toBeVisible();
		await expect(page.getByTestId('layer-detail-source-link')).toHaveAttribute(
			'href',
			/^https:\/\//
		);
		await expect(page.getByTestId('layer-detail-license')).toContainText(/dl-de/);
		await expect(page.getByTestId('layer-detail-inspector-link')).toHaveAttribute(
			'href',
			/\?layers=wohnlagen-2024/
		);
	});

	test('Detail-Page für unbekannten Slug → 404', async ({ page }) => {
		const res = await page.goto('/de/layer/does-not-exist-xyz', { waitUntil: 'domcontentloaded' });
		expect(res?.status()).toBe(404);
	});

	test('Detail-Page hat 0 axe-Violations', async ({ page }) => {
		await page.goto('/de/layer/laerm-2023');
		await expect(page.getByTestId('layer-detail-page')).toBeVisible();
		const results = await new AxeBuilder({ page })
			.withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
			.analyze();
		expect(results.violations).toEqual([]);
	});

	test('Legend Expand-Panel hat 0 axe-Violations', async ({ page }) => {
		await page.goto('/?layers=laerm-2023');
		await waitForMap(page);
		await page.getByTestId('legend-summary-laerm-2023').click();
		await expect(page.getByTestId('legend-expand-laerm-2023')).toBeVisible();
		const results = await new AxeBuilder({ page })
			.include('[data-testid="map-legend"]')
			.withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
			.analyze();
		expect(results.violations).toEqual([]);
	});
});
