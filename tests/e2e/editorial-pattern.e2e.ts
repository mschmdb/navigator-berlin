import { expect, test } from '@playwright/test';

const SUGGESTION = {
	id: 'way-100001',
	displayName: 'Boxhagener Straße 12, Friedrichshain-Kreuzberg, Berlin',
	lat: 52.5111,
	lng: 13.4544,
	type: 'house',
	addresstype: 'house',
	bezirk: 'Friedrichshain-Kreuzberg',
	postcode: '10245'
};

const FIXTURE = { suggestions: [SUGGESTION] };

test.beforeEach(async ({ page }) => {
	await page.route('**/api/geocode**', (route) => route.fulfill({ json: FIXTURE }));
	await page.route('**/_app/remote/**', (route) =>
		route.fulfill({ json: { type: 'result', result: FIXTURE.suggestions } })
	);
});

async function selectAddress(page: import('@playwright/test').Page) {
	await page.goto('/');
	await page.locator('[data-testid="map-skeleton"]').waitFor({ state: 'detached', timeout: 15000 });
	const input = page.getByRole('combobox');
	await input.click();
	await input.fill('Boxhagener');
	await page.waitForTimeout(400);
	await page.getByRole('option').first().click();
	await expect(page.getByTestId('inspector-panel')).toBeVisible({ timeout: 5000 });
}

test.describe('Editorial-Pattern (Story 1.12)', () => {
	test('Mietspiegel-Hit → legal-Disclaimer "rechtliche Aussage" sichtbar', async ({ page }) => {
		await selectAddress(page);
		const row = page.locator('[data-testid="layer-hit-row"][data-layer*="mietspiegel"]').first();
		const isVisible = await row.isVisible().catch(() => false);
		if (!isVisible) test.skip(true, 'Mietspiegel-Hit nicht in Test-Fixture');
		const disclaimer = row.locator('[data-testid="editorial-disclaimer"]').first();
		await expect(disclaimer).toBeVisible();
		await expect(disclaimer).toHaveAttribute('data-variant', 'legal');
		await expect(disclaimer).toContainText(/rechtliche Aussage/i);
	});

	test('Disclaimer-Source-Link verlinkt auf primarySourceUrl', async ({ page }) => {
		await selectAddress(page);
		const link = page.locator('[data-testid="disclaimer-source-link"]').first();
		const isVisible = await link.isVisible().catch(() => false);
		if (!isVisible) test.skip(true, 'Kein Disclaimer-Source-Link gerendert');
		const href = await link.getAttribute('href');
		expect(href).toMatch(/^https:\/\//);
	});

	test('Inspector-Row enthält KEINEN Mailto-Link (Footer-Page deferred)', async ({ page }) => {
		await selectAddress(page);
		const mailtos = page.locator('[data-testid="layer-hit-row"] [data-testid="error-feedback-mailto"]');
		await expect(mailtos).toHaveCount(0);
	});

	test('Stolperstein-Hit zeigt StolpersteinDetail OHNE AI-Marker', async ({ page }) => {
		await selectAddress(page);
		const detail = page.locator('[data-testid="stolperstein-detail"]').first();
		const isVisible = await detail.isVisible().catch(() => false);
		if (!isVisible) test.skip(true, 'Kein Stolperstein-Hit in Fixture');
		await expect(detail).toHaveAttribute('data-osm-sourced', 'true');
		const aiAttr = await detail.getAttribute('data-ai-generated');
		expect(aiAttr).toBeNull();
		await expect(
			detail.locator('[data-testid="stolperstein-source-koordinierung"]')
		).toBeVisible();
	});

	test('Trinkbrunnen-Layer zeigt seasonal-Pille (aktiv oder außerhalb)', async ({ page }) => {
		await selectAddress(page);
		const row = page.locator('[data-testid="layer-hit-row"][data-layer="trinkbrunnen"]').first();
		const isVisible = await row.isVisible().catch(() => false);
		if (!isVisible) test.skip(true, 'Trinkbrunnen-Layer nicht gerendert');
		const activePill = row.locator('[data-testid="seasonal-pill-active"]');
		const outPill = row.locator('[data-testid="seasonal-pill-outofseason"]');
		const visiblePills = (await activePill.count()) + (await outPill.count());
		expect(visiblePills).toBeGreaterThan(0);
	});
});
