import { expect, test } from '@playwright/test';

const BEZIRK_URL = '/bezirk/treptow-koepenick';
/** Vorher 206 KB HTML, Ziel mindestens 60 KB weniger. */
const MAX_HTML_BYTES = 146 * 1024;

test.describe('Pixel-Logo Gewicht', () => {
	test('Bezirksseite liefert höchstens 146 KB HTML', async ({ request }) => {
		const response = await request.get(BEZIRK_URL);
		expect(response.ok()).toBe(true);
		const body = await response.body();
		expect(body.length).toBeLessThanOrEqual(MAX_HTML_BYTES);
	});

	test('Header-Logo ist sichtbar und trägt 296 Zellen', async ({ page }) => {
		await page.goto(BEZIRK_URL);
		const logo = page.locator('header').getByTestId('pixel-logo').first();
		await expect(logo).toBeVisible();
		await expect(logo.locator('use')).toHaveCount(296);
	});

	test('Footer-Logo lädt als Bild und der Link heißt navigator.berlin', async ({ page }) => {
		await page.goto(BEZIRK_URL);
		const link = page.getByTestId('meta-footer').getByRole('link', {
			name: 'navigator.berlin',
			exact: true
		});
		const img = link.locator('img');
		await img.scrollIntoViewIfNeeded();
		await expect(img).toBeVisible();
		await expect
			.poll(() => img.evaluate((el) => (el as HTMLImageElement).naturalWidth))
			.toBeGreaterThan(0);
	});
});
