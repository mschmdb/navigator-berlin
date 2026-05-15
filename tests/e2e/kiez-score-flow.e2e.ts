import { expect, test } from '@playwright/test';

const SUGGESTION = {
	id: 'way-200001',
	displayName: 'Boxhagener Straße 12, 10245 Berlin',
	lat: 52.5126,
	lng: 13.4541,
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
	await page
		.locator('[data-testid="map-skeleton"]')
		.waitFor({ state: 'detached', timeout: 15000 });
	const input = page.getByRole('combobox');
	await input.click();
	await input.fill('Boxhagener');
	await page.getByRole('option', { name: /Boxhagener/ }).click();
}

test.describe('Kiez-Score Inspector-Flow', () => {
	test('Adresse-Select → Inspector zeigt Kiez-Score-Section', async ({ page }) => {
		await selectAddress(page);
		await expect(page.getByTestId('kiez-score-section')).toBeVisible({ timeout: 8000 });
		await expect(page.getByTestId('kiez-score-section-header')).toContainText('Kiez-Score');
		await expect(page.getByTestId('kiez-score-dim-ruhe-luft')).toBeVisible();
		await expect(page.getByTestId('kiez-score-dim-gruen')).toBeVisible();
		await expect(page.getByTestId('kiez-score-dim-mobilitaet')).toBeVisible();
		await expect(page.getByTestId('kiez-score-dim-soziale-lage')).toBeVisible();
	});

	test('Methodik-Link öffnet /methodik/kiez-score', async ({ page }) => {
		await selectAddress(page);
		await expect(page.getByTestId('kiez-score-section')).toBeVisible({ timeout: 8000 });
		const link = page.getByTestId('kiez-score-methodik-link');
		await expect(link).toHaveAttribute('href', '/methodik/kiez-score');
		await link.click();
		await expect(page.getByTestId('methodik-kiez-score-h1')).toContainText('Wo lebt es sich gut?');
	});

	test('Quellen-Toggle expandiert Source-Liste', async ({ page }) => {
		await selectAddress(page);
		await expect(page.getByTestId('kiez-score-section')).toBeVisible({ timeout: 8000 });
		const toggle = page.getByTestId('kiez-score-toggle-sources-ruhe-luft');
		await toggle.click();
		await expect(page.getByTestId('kiez-score-sources-ruhe-luft')).toBeVisible();
	});

	test('Soziale Lage ValueChip ist neutral (Stigma-Schutz)', async ({ page }) => {
		await selectAddress(page);
		await expect(page.getByTestId('kiez-score-section')).toBeVisible({ timeout: 8000 });
		const dim = page.getByTestId('kiez-score-dim-soziale-lage');
		const chip = dim.locator('[data-testid="value-chip"]').first();
		const severity = await chip.getAttribute('data-severity');
		// neutral oder fehlend (Daten unzureichend) — beides ist Stigma-Schutz-konform
		if (severity !== null) {
			expect(severity).toBe('neutral');
		}
	});
});
