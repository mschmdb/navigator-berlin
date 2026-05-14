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

const TEMPELHOF = {
	id: 'way-200002',
	displayName: 'Tempelhofer Damm 100, Tempelhof, Berlin',
	lat: 52.4675,
	lng: 13.4019,
	type: 'house',
	addresstype: 'house',
	bezirk: 'Tempelhof-Schöneberg',
	postcode: '12101'
};

test.beforeEach(async ({ page }) => {
	await page.route('**/api/geocode**', (route, request) => {
		const url = new URL(request.url());
		const q = (url.searchParams.get('q') ?? '').toLowerCase();
		const result = q.includes('tempel') ? TEMPELHOF : STEGLITZ;
		return route.fulfill({ json: { suggestions: [result] } });
	});
	await page.route('**/_app/remote/**', (route, request) => {
		const body = request.postData() ?? '';
		const wantTempelhof = body.toLowerCase().includes('tempel');
		const result = wantTempelhof ? TEMPELHOF : STEGLITZ;
		return route.fulfill({ json: { type: 'result', result: [result] } });
	});
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
}

test('Steglitz-Auswahl bindet nächste Station Dahlem und zeigt Long-View', async ({ page }) => {
	await selectAddress(page, 'Schloßstraße');
	const hint = page.getByTestId('klima-station-hint');
	await expect(hint).toContainText('Berlin-Dahlem', { timeout: 15000 });
	await expect(page.getByTestId('klima-long-view-slot')).toBeVisible({ timeout: 15000 });
});

test('3 Sparklines werden gerendert', async ({ page }) => {
	await selectAddress(page, 'Schloßstraße');
	const grid = page.getByTestId('klima-sparkline-grid');
	await expect(grid).toBeVisible({ timeout: 15000 });
	await expect(grid.locator('[data-testid="climate-sparkline"]')).toHaveCount(3);
});

test('Tempelhof-Adresse zeigt KEIN Long-View (Conditional Dahlem-only)', async ({ page }) => {
	await selectAddress(page, 'Tempelhof');
	await expect(page.getByTestId('klima-station-hint')).toContainText('Tempelhof', {
		timeout: 15000
	});
	await expect(page.getByTestId('klima-long-view-slot')).toHaveCount(0);
});

test('Toggle "Als Tabelle ansehen" rendert sortierbare Tabelle mit Jahr+Wert', async ({ page }) => {
	await selectAddress(page, 'Schloßstraße');
	const firstSparkline = page.getByTestId('climate-sparkline').first();
	const toggle = firstSparkline.getByTestId('table-toggle');
	await toggle.click();
	const tbl = firstSparkline.locator('table');
	await expect(tbl).toBeVisible();
	const headers = tbl.locator('th');
	await expect(headers).toHaveCount(2);
	await expect(headers.first()).toContainText('Jahr');
});

test('Sortier-Klick cycled aria-sort none → ascending → descending', async ({ page }) => {
	await selectAddress(page, 'Schloßstraße');
	const firstSparkline = page.getByTestId('climate-sparkline').first();
	await firstSparkline.getByTestId('table-toggle').click();
	const header = firstSparkline.locator('th[data-key="year"]');
	await expect(header).toHaveAttribute('aria-sort', 'none');
	await firstSparkline.getByTestId('sort-year').click();
	await expect(header).toHaveAttribute('aria-sort', 'ascending');
	await firstSparkline.getByTestId('sort-year').click();
	await expect(header).toHaveAttribute('aria-sort', 'descending');
});

test('axe-core: 0 Violations für Klima-Sektion + Charts', async ({ page }) => {
	await selectAddress(page, 'Schloßstraße');
	await expect(page.getByTestId('klima-sparkline-grid')).toBeVisible({ timeout: 15000 });
	const results = await new AxeBuilder({ page })
		.include('[data-testid="klima-section"]')
		.disableRules(['region'])
		.analyze();
	expect(results.violations).toEqual([]);
});

test.describe('Reduced-Motion: keine SVG-Transitions', () => {
	test.use({ colorScheme: 'light' });
	test('Charts rendern ohne CSS-Transition unter prefers-reduced-motion', async ({ browser }) => {
		const ctx = await browser.newContext({ reducedMotion: 'reduce' });
		const page = await ctx.newPage();
		await page.route('**/api/geocode**', (route) =>
			route.fulfill({ json: { suggestions: [STEGLITZ] } })
		);
		await page.route('**/_app/remote/**', (route) =>
			route.fulfill({ json: { type: 'result', result: [STEGLITZ] } })
		);
		await selectAddress(page, 'Schloßstraße');
		const sparkline = page.getByTestId('climate-sparkline').first();
		await expect(sparkline).toBeVisible({ timeout: 15000 });
		const transition = await sparkline.evaluate((el) => {
			const path = el.querySelector('.lc-root-container svg path') as SVGElement | null;
			if (!path) return null;
			return getComputedStyle(path).transitionDuration;
		});
		expect(transition === null || transition === '0s' || transition === '').toBe(true);
		await ctx.close();
	});
});
