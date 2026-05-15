import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const SUGGESTION = {
	id: 'way-100002',
	displayName: 'Wörther Straße 11, Pankow, Berlin',
	lat: 52.5345,
	lng: 13.4181,
	type: 'house',
	addresstype: 'house',
	bezirk: 'Pankow',
	postcode: '10405'
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
	await page
		.locator('[data-testid="map-skeleton"]')
		.waitFor({ state: 'detached', timeout: 15000 });
	const input = page.getByRole('combobox');
	await input.click();
	await input.fill('Wörther');
	await page.waitForTimeout(400);
	await page.getByRole('option').first().click();
	await expect(page.getByTestId('inspector-panel')).toBeVisible({ timeout: 5000 });
}

test('Bookmark via Inspector-Toolbar speichern → Reload → Bookmark in Dialog vorhanden', async ({
	page
}) => {
	await selectAddress(page);
	await page.getByTestId('inspector-bookmark-trigger').click();
	await expect(page.getByTestId('inspector-bookmark-confirmation')).toBeVisible();
	await page.reload();
	await page
		.locator('[data-testid="map-skeleton"]')
		.waitFor({ state: 'detached', timeout: 15000 });
	await page.getByTestId('header-bookmark-trigger').click();
	await expect(page.getByTestId('bookmark-list')).toBeVisible();
	await expect(page.getByTestId('bookmark-row')).toHaveCount(1);
});

test('Inspector-Bookmark bei bereits gespeicherter Adresse öffnet Dialog', async ({ page }) => {
	await selectAddress(page);
	await page.getByTestId('inspector-bookmark-trigger').click();
	await page.waitForTimeout(2000);
	await page.getByTestId('inspector-bookmark-trigger').click();
	await expect(page.getByTestId('bookmark-dialog')).toBeVisible();
});

test('Bookmark auswählen → Inspector + Adresse synced', async ({ page }) => {
	await selectAddress(page);
	await page.getByTestId('inspector-bookmark-trigger').click();
	await page.getByTestId('header-bookmark-trigger').click();
	await page.getByTestId('bookmark-select').click();
	await expect(page.getByTestId('bookmark-dialog')).not.toBeVisible();
	await expect(page.getByTestId('inspector-panel')).toBeVisible({ timeout: 5000 });
});

test('Bookmark löschen → Liste leer + LocalStorage geleert', async ({ page }) => {
	await selectAddress(page);
	await page.getByTestId('inspector-bookmark-trigger').click();
	await page.getByTestId('header-bookmark-trigger').click();
	await page.getByTestId('bookmark-delete').click();
	await page.getByTestId('bookmark-confirm-delete').click();
	await expect(page.getByTestId('bookmark-empty')).toBeVisible();
	const stored = await page.evaluate(() =>
		localStorage.getItem('navigator-berlin.bookmarks.v1')
	);
	expect(stored).not.toBeNull();
	const parsed = JSON.parse(stored!);
	expect(parsed.bookmarks).toEqual([]);
});

test('Limit-Test: 51. Bookmark wird abgelehnt', async ({ page }) => {
	await page.addInitScript(() => {
		const bookmarks = Array.from({ length: 50 }, (_, i) => ({
			id: `${i.toString(16).padStart(8, '0')}-1111-4111-8111-111111111111`,
			displayName: `Test-Adresse ${i}`,
			lat: 52.4 + i * 0.001,
			lng: 13.4,
			createdAt: new Date(2026, 4, (i % 28) + 1).toISOString()
		}));
		localStorage.setItem(
			'navigator-berlin.bookmarks.v1',
			JSON.stringify({ schemaVersion: 1, bookmarks })
		);
	});
	await selectAddress(page);
	await page.getByTestId('header-bookmark-trigger').click();
	await expect(page.getByTestId('bookmark-limit-reached')).toBeVisible();
	await expect(page.getByTestId('bookmark-save')).not.toBeVisible();
});

test('axe: Bookmark-Dialog hat keine kritischen Violations', async ({ page }) => {
	await selectAddress(page);
	await page.getByTestId('header-bookmark-trigger').click();
	await expect(page.getByTestId('bookmark-dialog')).toBeVisible();
	const results = await new AxeBuilder({ page })
		.include('[data-testid="bookmark-dialog"]')
		.withTags(['wcag2a', 'wcag2aa'])
		.analyze();
	expect(results.violations).toEqual([]);
});
