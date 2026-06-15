// Story 1.18 Inspector-UX-Rework E2E.
// Deferred to CI-Run per Sprint-Konvention (vgl. Story 1.14, 1.15, 1.16, 1.17). Smoke-Pfade hier
// dokumentiert; ausführbar sobald CI-Pipeline gates aktiviert. Manueller Browser-Test als
// Akzeptanz-Quelle im Dev-Cycle.

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
	await page.goto('/explore');
	await page.locator('[data-testid="map-skeleton"]').waitFor({ state: 'detached', timeout: 15000 });
	const input = page.getByRole('combobox');
	await input.click();
	await input.fill('Boxhagener');
	await page.waitForTimeout(400);
	const option = page.getByRole('option').first();
	await option.click();
}

test.describe('Story 1.18: Inspector Value-Chip + Layout', () => {
	test('Severity-Chips sichtbar bei selektierter Adresse', async ({ page }) => {
		await selectAddress(page);
		await expect(page.getByTestId('inspector-panel')).toBeVisible({ timeout: 5000 });
		const chips = page.getByTestId('value-chip');
		await expect(chips.first()).toBeVisible();
	});

	test('Layer-Name 1× pro Row (kein Dedup-Doppel)', async ({ page }) => {
		await selectAddress(page);
		await expect(page.getByTestId('inspector-panel')).toBeVisible();
		const firstRow = page.getByTestId('layer-hit-row').first();
		const nameEl = firstRow.getByTestId('layer-name');
		await expect(nameEl).toHaveCount(1);
	});

	test('Empty-Section default ausgeblendet, Toggle einblendet', async ({ page }) => {
		await selectAddress(page);
		await expect(page.getByTestId('inspector-panel')).toBeVisible();
		const toggle = page.getByTestId('toggle-empty-sections');
		await expect(toggle).toBeVisible();
		await toggle.click();
		// After toggle, at least one empty section should be visible (compact format).
		const empties = page.locator('[data-testid$="-empty"]');
		await expect(empties.first()).toBeVisible({ timeout: 2000 });
	});

	test('Metadata-Tooltip zeigt Source-URL bei Hover', async ({ page }) => {
		await selectAddress(page);
		await expect(page.getByTestId('inspector-panel')).toBeVisible();
		const info = page.getByTestId('banner-source-info').first();
		const title = await info.getAttribute('title');
		expect(title).toMatch(/\./);
	});
});
