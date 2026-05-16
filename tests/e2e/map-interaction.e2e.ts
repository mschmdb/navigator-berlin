import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
	await page.route('**/api/geocode**', (route) =>
		route.fulfill({ json: { suggestions: [] } })
	);
	await page.route('**/_app/remote/**', (route) =>
		route.fulfill({ json: { type: 'result', result: [] } })
	);
});

test('Map-Controls sind rendered + a11y', async ({ page }) => {
	await page.goto('/explore');
	const group = page.getByRole('group', { name: /Karten-Steuerung/i });
	await expect(group).toBeVisible();
	await expect(group.getByRole('button', { name: /Hineinzoomen/i })).toBeVisible();
	await expect(group.getByRole('button', { name: /Herauszoomen/i })).toBeVisible();
	await expect(group.getByRole('button', { name: /Norden/i })).toBeVisible();
});

test('Zoom-Button updates URL nach Debounce', async ({ page }) => {
	await page.goto('/explore');
	await page.locator('[data-testid="map-skeleton"]').waitFor({ state: 'detached', timeout: 15000 });
	// Map fully initialised (moveend fires after first paint settle)
	await page.waitForTimeout(800);
	await page.getByRole('button', { name: /Hineinzoomen/i }).click();
	await page.waitForFunction(() => new URL(window.location.href).searchParams.has('zoom'), null, {
		timeout: 5000
	});
	const url = new URL(page.url());
	expect(url.searchParams.get('zoom')).toBeTruthy();
});

test('Deeplink ?bbox lädt Viewport direkt (kein Flicker)', async ({ page }) => {
	await page.goto('/?bbox=13.4,52.5,13.5,52.55&zoom=14');
	await page.locator('[data-testid="map-skeleton"]').waitFor({ state: 'detached', timeout: 15000 });
	// URL bleibt
	const url = new URL(page.url());
	expect(url.searchParams.get('bbox')).toBeTruthy();
});

test('Tab → Karten-Container fokussierbar', async ({ page }) => {
	await page.goto('/explore');
	await page.locator('[role="application"]').focus();
	await expect(page.locator('[role="application"]')).toBeFocused();
});
