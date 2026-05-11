import { expect, test } from '@playwright/test';

// Mock geocode-Remote-Function (Header AddressSearch will trigger es)
test.beforeEach(async ({ page }) => {
	await page.route('**/api/geocode**', (route) => route.fulfill({ json: { suggestions: [] } }));
	await page.route('**/_app/remote/**', (route) =>
		route.fulfill({ json: { type: 'result', result: [] } })
	);
});

test('/ rendert Karten-Container mit role=application', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByRole('application')).toBeVisible();
});

test('/ hat map-help sr-only Steuerungs-Anleitung', async ({ page }) => {
	await page.goto('/');
	const help = page.locator('#map-help');
	await expect(help).toHaveClass(/sr-only/);
	await expect(help).toHaveText(/Pfeiltasten/);
});

test('/ hat aria-live map-status region', async ({ page }) => {
	await page.goto('/');
	const status = page.getByTestId('map-status');
	await expect(status).toHaveAttribute('aria-live', 'polite');
});

test('/ laedt map-style.json (Network)', async ({ page }) => {
	const styleRequests: string[] = [];
	page.on('response', (res) => {
		if (res.url().includes('map-style.json')) styleRequests.push(res.url());
	});
	await page.goto('/');
	await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => undefined);
	expect(styleRequests.length).toBeGreaterThanOrEqual(1);
});
