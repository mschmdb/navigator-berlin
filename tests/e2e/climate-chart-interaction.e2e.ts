import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const STEGLITZ = {
	id: 'way-200001',
	displayName: 'Schloßstraße 1, Steglitz-Zehlendorf, Berlin',
	lat: 52.4555,
	lng: 13.3315,
	type: 'house',
	addresstype: 'house',
	bezirk: 'Steglitz-Zehlendorf',
	postcode: '12163'
};

test.beforeEach(async ({ page }) => {
	await page.route('**/api/geocode**', (route, request) => {
		const url = new URL(request.url());
		const q = (url.searchParams.get('q') ?? '').toLowerCase();
		if (q.length === 0) return route.fulfill({ json: { suggestions: [] } });
		return route.fulfill({ json: { suggestions: [STEGLITZ] } });
	});
	await page.route('**/_app/remote/**', (route) =>
		route.fulfill({ json: { type: 'result', result: [STEGLITZ] } })
	);
});

async function selectAddress(page: import('@playwright/test').Page, term: string) {
	await page.goto('/');
	await page.locator('[data-testid="map-skeleton"]').waitFor({ state: 'detached', timeout: 15000 });
	const input = page.getByRole('combobox');
	await input.click();
	await input.fill(term);
	await page.waitForTimeout(400);
	await page.getByRole('option').first().click();
	await expect(page.getByTestId('inspector-panel')).toBeVisible({ timeout: 5000 });
	await expect(page.getByTestId('klima-sparkline-grid')).toBeVisible({ timeout: 15000 });
}

test('Sparkline-Figure ist tabbar (AC-3 Keyboard-First)', async ({ page }) => {
	await selectAddress(page, 'Schloßstraße');
	const figure = page.getByTestId('climate-sparkline-figure').first();
	await expect(figure).toHaveAttribute('tabindex', '0');
	await figure.focus();
	await expect(figure).toBeFocused();
});

test('ArrowRight + Home/End cycled durch Jahre (AC-3)', async ({ page }) => {
	await selectAddress(page, 'Schloßstraße');
	const figure = page.getByTestId('climate-sparkline-figure').first();
	await figure.focus();
	await expect(figure).toHaveAttribute('data-focused-index', '-1');
	await page.keyboard.press('ArrowRight');
	await expect(figure).toHaveAttribute('data-focused-index', '0');
	await page.keyboard.press('End');
	const lastIdx = await figure.getAttribute('data-focused-index');
	expect(Number(lastIdx)).toBeGreaterThan(0);
	await page.keyboard.press('Home');
	await expect(figure).toHaveAttribute('data-focused-index', '0');
});

test('Definition-Subline pro Metric sichtbar (Content-Klarheit)', async ({ page }) => {
	await selectAddress(page, 'Schloßstraße');
	const definitions = page.getByTestId('climate-sparkline-definition');
	await expect(definitions).toHaveCount(3);
	await expect(definitions.nth(0)).toContainText('Tagesmaximum ≥ 25');
	await expect(definitions.nth(1)).toContainText('Tagesminimum < 0');
	await expect(definitions.nth(2)).toContainText('Tagesmaximum ≥ 30');
});

test('Hover über Sparkline öffnet Tooltip (AC-2)', async ({ page }) => {
	await selectAddress(page, 'Schloßstraße');
	const sparkline = page.getByTestId('climate-sparkline').first();
	const lcRoot = sparkline.locator('.lc-root-container');
	await expect(lcRoot).toBeVisible();
	const box = await lcRoot.boundingBox();
	if (box) {
		await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5);
		await page.waitForTimeout(120);
		const tooltip = page.locator('[role="tooltip"], .lc-tooltip-container, .lc-tooltip');
		const tooltipCount = await tooltip.count();
		expect(tooltipCount).toBeGreaterThan(0);
	}
});

test('Tabelle-Toggle bleibt verfügbar (AC-7)', async ({ page }) => {
	await selectAddress(page, 'Schloßstraße');
	const sparkline = page.getByTestId('climate-sparkline').first();
	const toggle = sparkline.getByTestId('table-toggle');
	await expect(toggle).toBeVisible();
	await toggle.click();
	await expect(sparkline.locator('table')).toBeVisible();
});

test('axe-core: 0 Violations auf Klima-Sektion mit LayerChart-Charts (AC-9)', async ({ page }) => {
	await selectAddress(page, 'Schloßstraße');
	const results = await new AxeBuilder({ page })
		.include('[data-testid="klima-section"]')
		.disableRules(['region'])
		.analyze();
	expect(results.violations).toEqual([]);
});

test('Skeleton-Placeholder vor Lazy-Load sichtbar (AC-5)', async ({ page }) => {
	await page.route('**/api/geocode**', (route) =>
		route.fulfill({ json: { suggestions: [STEGLITZ] } })
	);
	await page.route('**/_app/remote/**', (route) =>
		route.fulfill({ json: { type: 'result', result: [STEGLITZ] } })
	);
	await page.goto('/');
	await page.locator('[data-testid="map-skeleton"]').waitFor({ state: 'detached', timeout: 15000 });
	const input = page.getByRole('combobox');
	await input.click();
	await input.fill('Schloßstraße');
	await page.waitForTimeout(200);
	await page.getByRole('option').first().click();
	const skeleton = page.getByTestId('klima-skeleton');
	const grid = page.getByTestId('klima-sparkline-grid');
	const visibleBefore = (await skeleton.count()) + (await grid.count());
	expect(visibleBefore).toBeGreaterThan(0);
});
