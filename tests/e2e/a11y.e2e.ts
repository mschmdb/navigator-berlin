import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.beforeEach(async ({ page }) => {
	await page.route('**/api/geocode**', (route) => route.fulfill({ json: { suggestions: [] } }));
	await page.route('**/_app/remote/**', (route) =>
		route.fulfill({ json: { type: 'result', result: [] } })
	);
});

test('Root (Karte) hat 0 axe-Violations', async ({ page }) => {
	await page.goto('/explore');
	await page.locator('[data-testid="map-skeleton"]').waitFor({ state: 'detached', timeout: 15000 });
	const results = await new AxeBuilder({ page })
		.withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
		.analyze();
	expect(results.violations).toEqual([]);
});

test('Wortmarke-Showcase (with-header) hat 0 axe-Violations', async ({ page }) => {
	await page.goto('/_dev/wortmarke');
	const results = await new AxeBuilder({ page })
		.withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
		.analyze();
	expect(results.violations).toEqual([]);
});

test('Map-Help-Region Full-Text vorhanden', async ({ page }) => {
	await page.goto('/explore');
	await page.locator('[data-testid="map-skeleton"]').waitFor({ state: 'detached', timeout: 15000 });
	const help = page.locator('#map-help');
	await expect(help).toBeAttached();
	const text = (await help.textContent()) ?? '';
	expect(text).toMatch(/Berlin-Karte/);
	expect(text).toMatch(/Pfeiltasten/);
	expect(text).toMatch(/Home/);
	expect(text).toMatch(/Tab/);
	expect(text).toMatch(/Enter/);
	expect(text).toMatch(/Escape/);
});

test('Map-Container hat aria-describedby auf Help-Region', async ({ page }) => {
	await page.goto('/explore');
	await page.locator('[data-testid="map-skeleton"]').waitFor({ state: 'detached', timeout: 15000 });
	const app = page.locator('[role="application"]');
	expect(await app.getAttribute('aria-describedby')).toBe('map-help');
});

test('Globale Live-Region existiert mit aria-live=polite (Story 1.9)', async ({ page }) => {
	await page.goto('/explore');
	await page.locator('[data-testid="map-skeleton"]').waitFor({ state: 'detached', timeout: 15000 });
	const polite = page.locator('#global-aria-live');
	await expect(polite).toBeAttached();
	expect(await polite.getAttribute('aria-live')).toBe('polite');
	const assertive = page.locator('#global-aria-live-assertive');
	await expect(assertive).toBeAttached();
	expect(await assertive.getAttribute('aria-live')).toBe('assertive');
	await expect(page.locator('#map-status')).toHaveCount(0);
});

test('Escape löscht Selection (kein Marker mehr)', async ({ page }) => {
	await page.goto('/?address=13.4,52.5&q=Test');
	await page.locator('[data-testid="map-skeleton"]').waitFor({ state: 'detached', timeout: 15000 });
	await page.locator('[role="application"]').focus();
	await page.keyboard.press('Escape');
	await page.waitForFunction(() => !new URL(window.location.href).searchParams.has('address'), null, {
		timeout: 5000
	});
	const url = new URL(page.url());
	expect(url.searchParams.has('address')).toBe(false);
});

test('SkipLink springt zu main', async ({ page }) => {
	await page.goto('/explore');
	await page.locator('[data-testid="map-skeleton"]').waitFor({ state: 'detached', timeout: 15000 });
	await page.keyboard.press('Tab');
	await page.keyboard.press('Enter');
	const hash = await page.evaluate(() => window.location.hash);
	expect(hash).toBe('#main');
});
