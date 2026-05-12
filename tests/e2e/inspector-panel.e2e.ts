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
	await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
});

async function selectAddress(page: import('@playwright/test').Page) {
	await page.goto('/');
	await page.locator('[data-testid="map-skeleton"]').waitFor({ state: 'detached', timeout: 15000 });
	const input = page.getByRole('combobox');
	await input.click();
	await input.fill('Boxhagener');
	await page.waitForTimeout(400);
	const option = page.getByRole('option').first();
	await option.click();
}

test('Adress-Selection öffnet Inspektor mit allen 5 Sektionen', async ({ page }) => {
	await selectAddress(page);
	await expect(page.getByTestId('inspector-panel')).toBeVisible({ timeout: 5000 });
	for (const key of ['boundaries', 'wohn', 'umwelt', 'memorial', 'klima']) {
		await expect(page.getByTestId(`section-${key}`)).toBeVisible();
	}
});

test('Inspektor-Header zeigt selektierte Adresse', async ({ page }) => {
	await selectAddress(page);
	await expect(page.getByTestId('inspector-address')).toContainText('Boxhagener Straße');
});

test('Close-Button schließt Inspektor', async ({ page }) => {
	await selectAddress(page);
	await expect(page.getByTestId('inspector-panel')).toBeVisible();
	await page.getByTestId('inspector-close').click();
	await expect(page.getByTestId('inspector-panel')).toHaveCount(0);
});

test('Permalink-Button kopiert URL in Clipboard', async ({ page }) => {
	await selectAddress(page);
	await page.getByTestId('permalink-button').click();
	const status = page.getByTestId('permalink-status');
	await expect(status).toContainText('URL kopiert');
	const clip = await page.evaluate(() => navigator.clipboard.readText());
	expect(clip).toContain('http');
});

test('Re-Selection: Inspektor-Mount-ID bleibt stabil (kein Re-Mount)', async ({ page }) => {
	await selectAddress(page);
	const before = await page.getByTestId('inspector-panel').getAttribute('data-mount-id');
	const input = page.getByRole('combobox');
	await input.click();
	await input.fill('Pariser');
	await page.waitForTimeout(400);
	await page.getByRole('option').first().click();
	const after = await page.getByTestId('inspector-panel').getAttribute('data-mount-id');
	expect(after).toBe(before);
});

test('Globale ARIA-Live-Region existiert im Layout', async ({ page }) => {
	await page.goto('/');
	await expect(page.locator('#global-aria-live')).toHaveCount(1);
	await expect(page.locator('#global-aria-live-assertive')).toHaveCount(1);
	await expect(page.locator('#map-status')).toHaveCount(0);
});

test.describe('Mobile-Viewport (375x812)', () => {
	test.use({ viewport: { width: 375, height: 812 } });
	test('Bottom-Sheet rendert bei Adress-Selektion', async ({ page }) => {
		await selectAddress(page);
		await expect(page.getByTestId('bottom-sheet')).toBeVisible({ timeout: 5000 });
	});
	test('Sheet-Expand cycled Snap 40 → 70', async ({ page }) => {
		await selectAddress(page);
		const sheet = page.getByTestId('bottom-sheet');
		await expect(sheet).toHaveAttribute('data-snap-vh', '40');
		await page.getByTestId('sheet-expand').click();
		await expect(sheet).toHaveAttribute('data-snap-vh', '70');
	});
	test('Escape schließt Sheet', async ({ page }) => {
		await selectAddress(page);
		const sheet = page.getByTestId('bottom-sheet');
		await sheet.focus();
		await page.keyboard.press('Escape');
		await expect(sheet).toHaveCount(0);
	});
});
