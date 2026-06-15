import { expect, test } from '@playwright/test';

const BERLIN_SUGGESTION = {
	id: 'way-300001',
	displayName: 'Karl-Marx-Allee 1, 10178 Berlin',
	lat: 52.521,
	lng: 13.413,
	type: 'house',
	addresstype: 'house',
	bezirk: 'Mitte',
	postcode: '10178'
};

const BRANDENBURG_SUGGESTION = {
	id: 'way-300002',
	displayName: 'Friedrich-Engels-Straße 1, 14473 Potsdam',
	lat: 52.4,
	lng: 13.06,
	type: 'house',
	addresstype: 'house',
	bezirk: 'Potsdam',
	postcode: '14473'
};

test.beforeEach(async ({ page }) => {
	await page.route('**/api/geocode**', (route) => {
		const url = new URL(route.request().url());
		const q = url.searchParams.get('q') ?? '';
		const list = q.toLowerCase().includes('potsdam')
			? [BRANDENBURG_SUGGESTION]
			: [BERLIN_SUGGESTION];
		return route.fulfill({ json: { suggestions: list } });
	});
	await page.route('**/_app/remote/**', (route) => {
		const url = new URL(route.request().url());
		const q = url.searchParams.get('q') ?? '';
		const list = q.toLowerCase().includes('potsdam')
			? [BRANDENBURG_SUGGESTION]
			: [BERLIN_SUGGESTION];
		return route.fulfill({ json: { type: 'result', result: list } });
	});
});

async function selectAddress(
	page: import('@playwright/test').Page,
	query: string,
	matcher: RegExp
): Promise<void> {
	await page.goto('/explore');
	await page.locator('[data-testid="map-skeleton"]').waitFor({ state: 'detached', timeout: 15000 });
	const input = page.getByRole('combobox');
	await input.click();
	await input.fill(query);
	await page.getByRole('option', { name: matcher }).click();
}

test.describe('Wahl-Section Inspector-Flow', () => {
	test('Berlin-Adresse → wahl-section sichtbar + Top-5-Bars', async ({ page }) => {
		await selectAddress(page, 'Karl-Marx', /Karl-Marx/);
		await expect(page.getByTestId('wahl-section')).toBeVisible({ timeout: 10000 });
		await expect(page.getByTestId('wahl-section-header')).toContainText('Wahlverhalten');
		await expect(page.getByTestId('wahl-stacked-bar')).toBeVisible();
		await expect(page.getByTestId('wahl-legend')).toBeVisible();
	});

	test('Wahljahr-Switch wechselt Bundle', async ({ page }) => {
		await selectAddress(page, 'Karl-Marx', /Karl-Marx/);
		await expect(page.getByTestId('wahl-section')).toBeVisible({ timeout: 10000 });
		const switch2017 = page.getByTestId('wahl-jahr-2017');
		await expect(switch2017).toBeVisible();
		await switch2017.click();
		await expect(switch2017).toHaveAttribute('aria-checked', 'true');
	});

	test('Wahltyp-Switch von BTW zu AGH', async ({ page }) => {
		await selectAddress(page, 'Karl-Marx', /Karl-Marx/);
		await expect(page.getByTestId('wahl-section')).toBeVisible({ timeout: 10000 });
		const aghTab = page.getByTestId('wahl-typ-tab-agh');
		await aghTab.click();
		await expect(aghTab).toHaveAttribute('aria-selected', 'true');
		await expect(page.getByTestId('wahl-stacked-bar')).toBeVisible();
	});

	test('Brandenburg-Adresse → wahl-section NICHT sichtbar', async ({ page }) => {
		await selectAddress(page, 'Potsdam', /Potsdam/);
		await page.waitForTimeout(3000);
		await expect(page.getByTestId('wahl-section')).not.toBeVisible();
	});

	test('Ebene-Switch wechselt zwischen Stimmbezirk/Kiez/Bezirk/Berlin', async ({ page }) => {
		await selectAddress(page, 'Karl-Marx', /Karl-Marx/);
		await expect(page.getByTestId('wahl-section')).toBeVisible({ timeout: 10000 });
		const berlinPill = page.getByTestId('wahl-level-berlin');
		await berlinPill.click();
		await expect(berlinPill).toHaveAttribute('aria-checked', 'true');
		await expect(page.getByTestId('wahl-legend')).toBeVisible();
	});
});
