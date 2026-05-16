import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const SUGGESTION_A = {
	id: 'way-100002',
	displayName: 'Wörther Straße 11, Pankow, Berlin',
	lat: 52.5345,
	lng: 13.4181,
	type: 'house',
	addresstype: 'house',
	bezirk: 'Pankow',
	postcode: '10405'
};

const SUGGESTION_B = {
	id: 'way-200003',
	displayName: 'Sonnenallee 100, Neukölln, Berlin',
	lat: 52.4799,
	lng: 13.444,
	type: 'house',
	addresstype: 'house',
	bezirk: 'Neukölln',
	postcode: '12045'
};

const FIXTURE_A = { suggestions: [SUGGESTION_A] };
const FIXTURE_B = { suggestions: [SUGGESTION_B] };

test.beforeEach(async ({ page }) => {
	let firstCall = true;
	await page.route('**/api/geocode**', (route) => {
		const fixture = firstCall ? FIXTURE_A : FIXTURE_B;
		firstCall = false;
		void route.fulfill({ json: fixture });
	});
	await page.route('**/_app/remote/**', (route) => {
		const url = route.request().url();
		const fixture = url.includes('Sonnenallee') ? FIXTURE_B : FIXTURE_A;
		void route.fulfill({ json: { type: 'result', result: fixture.suggestions } });
	});
});

async function pickAddressA(page: import('@playwright/test').Page) {
	await page.goto('/explore');
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

test('Compare-Trigger → Compare-Panel ersetzt Inspector', async ({ page }) => {
	await pickAddressA(page);
	await page.getByTestId('compare-trigger').click();
	await expect(page.getByTestId('compare-panel')).toBeVisible();
	await expect(page.getByTestId('compare-b-picker')).toBeVisible();
});

test('Compare-Exit verlässt Modus und zeigt Inspector wieder', async ({ page }) => {
	await pickAddressA(page);
	await page.getByTestId('compare-trigger').click();
	await page.getByTestId('compare-exit').click();
	await expect(page.getByTestId('compare-panel')).not.toBeVisible();
	await expect(page.getByTestId('inspector-panel')).toBeVisible();
});

test('Bookmark-Pick-Modus für Adresse B', async ({ page }) => {
	await page.addInitScript(() => {
		localStorage.setItem(
			'navigator-berlin.bookmarks.v1',
			JSON.stringify({
				schemaVersion: 1,
				bookmarks: [
					{
						id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
						displayName: 'Sonnenallee 100, Neukölln, Berlin',
						lat: 52.4799,
						lng: 13.444,
						bezirk: 'Neukölln',
						postcode: '12045',
						createdAt: '2026-05-01T00:00:00.000Z'
					}
				]
			})
		);
	});
	await pickAddressA(page);
	await page.getByTestId('compare-trigger').click();
	await page.getByTestId('compare-pick-bookmarks').click();
	await expect(page.getByTestId('bookmark-dialog')).toBeVisible();
	await page.getByTestId('bookmark-select').click();
	await expect(page.getByTestId('compare-address-b')).toContainText('Sonnenallee');
});

test('axe: Compare-Panel hat keine kritischen Violations', async ({ page }) => {
	await pickAddressA(page);
	await page.getByTestId('compare-trigger').click();
	await expect(page.getByTestId('compare-panel')).toBeVisible();
	const results = await new AxeBuilder({ page })
		.include('[data-testid="compare-panel"]')
		.withTags(['wcag2a', 'wcag2aa'])
		.analyze();
	expect(results.violations).toEqual([]);
});
