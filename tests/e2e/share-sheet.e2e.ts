import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

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
	await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
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

test('Share-Trigger öffnet Sheet mit Dialog-Rolle', async ({ page }) => {
	await selectAddress(page);
	await page.getByTestId('share-sheet-trigger').click();
	const sheet = page.getByTestId('share-sheet');
	await expect(sheet).toBeVisible();
	await expect(sheet).toHaveAttribute('role', 'dialog');
	await expect(sheet).toHaveAttribute('aria-modal', 'true');
});

test('Permalink-Option kopiert URL und zeigt Inline-Feedback', async ({ page }) => {
	await selectAddress(page);
	await page.getByTestId('share-sheet-trigger').click();
	const option = page.getByTestId('share-option-permalink');
	await option.click();
	await expect(option).toContainText(/kopiert/i);
	const clip = await page.evaluate(() => navigator.clipboard.readText());
	expect(clip).toContain('http');
});

test('Sheet bleibt offen nach Permalink-Copy (kein Auto-Close)', async ({ page }) => {
	await selectAddress(page);
	await page.getByTestId('share-sheet-trigger').click();
	await page.getByTestId('share-option-permalink').click();
	await expect(page.getByTestId('share-sheet')).toBeVisible();
});

test('KI-Kopieren schreibt Markdown ins Clipboard', async ({ page }) => {
	await selectAddress(page);
	await page.getByTestId('share-sheet-trigger').click();
	await page.getByTestId('share-option-llm').click();
	const clip = await page.evaluate(() => navigator.clipboard.readText());
	expect(clip).toContain('# Boxhagener Straße');
	expect(clip).toMatch(/Quellen-Links bleiben verbindlich/);
});

test('Esc schließt Sheet', async ({ page }) => {
	await selectAddress(page);
	await page.getByTestId('share-sheet-trigger').click();
	await expect(page.getByTestId('share-sheet')).toBeVisible();
	await page.keyboard.press('Escape');
	await expect(page.getByTestId('share-sheet')).toHaveCount(0);
});

test('Click-Outside schließt Sheet', async ({ page }) => {
	await selectAddress(page);
	await page.getByTestId('share-sheet-trigger').click();
	await expect(page.getByTestId('share-sheet')).toBeVisible();
	await page.mouse.click(50, 50);
	await expect(page.getByTestId('share-sheet')).toHaveCount(0);
});

test('OG-Preview-Image lädt /api/og/share-Endpoint', async ({ page }) => {
	await selectAddress(page);
	await page.getByTestId('share-sheet-trigger').click();
	const img = page.getByTestId('share-og-preview');
	await expect(img).toBeVisible();
	const src = await img.getAttribute('src');
	expect(src).toContain('/api/og/share?');
	expect(src).toContain('address=');
	expect(src).toContain('lat=');
});

test('Token-Approximation im KI-Button sichtbar', async ({ page }) => {
	await selectAddress(page);
	await page.getByTestId('share-sheet-trigger').click();
	const tokens = page.getByTestId('share-option-llm-tokens');
	await expect(tokens).toContainText(/≈/);
	await expect(tokens).toContainText(/Tokens/);
});

test('Share-Sheet hat 0 axe-Violations', async ({ page }) => {
	await selectAddress(page);
	await page.getByTestId('share-sheet-trigger').click();
	await expect(page.getByTestId('share-sheet')).toBeVisible();
	const results = await new AxeBuilder({ page })
		.include('[data-testid="share-sheet"]')
		.withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
		.analyze();
	expect(results.violations).toEqual([]);
});
