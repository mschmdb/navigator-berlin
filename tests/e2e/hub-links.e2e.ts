import { expect, test } from '@playwright/test';

test.describe('Detailseiten verlinken die Übersichten (S8)', () => {
	test('Kiez: Link führt in den sichtbaren Bezirksabschnitt auf /kieze', async ({ page }) => {
		await page.goto('/kiez/reuterstrasse');
		const link = page.getByTestId('overview-link-kieze');
		await expect(link).toHaveText('Alle Kieze in Neukölln');
		await expect(link).toHaveAttribute('href', '/kieze#bezirk-neukoelln');
		await link.click();
		await expect(page).toHaveURL(/\/kieze#bezirk-neukoelln$/);
		const target = page.locator('[id="bezirk-neukoelln"]');
		await expect(target).toHaveCount(1);
		await expect(target).toBeInViewport();
		await expect(page.getByRole('heading', { level: 2, name: 'Neukölln' })).toBeVisible();
	});

	test('Kiez EN: Klick landet auf /en/kieze im Bezirksabschnitt', async ({ page }) => {
		await page.goto('/en/kiez/reuterstrasse');
		const link = page.getByTestId('overview-link-kieze');
		await expect(link).toHaveText('All Kieze in Neukölln');
		await expect(link).toHaveAttribute('href', '/en/kieze#bezirk-neukoelln');
		await link.click();
		await expect(page).toHaveURL(/\/en\/kieze#bezirk-neukoelln$/);
		await expect(page.locator('[id="bezirk-neukoelln"]')).toBeInViewport();
	});

	test('Bezirk: Links auf Bezirksabschnitt und /bezirke', async ({ page }) => {
		await page.goto('/bezirk/pankow');
		const kieze = page.getByTestId('overview-link-kieze');
		await expect(kieze).toHaveAttribute('href', '/kieze#bezirk-pankow');
		await kieze.click();
		await expect(page).toHaveURL(/\/kieze#bezirk-pankow$/);
		await expect(page.locator('[id="bezirk-pankow"]')).toBeInViewport();

		await page.goto('/bezirk/pankow');
		await page.getByTestId('overview-link-bezirke').click();
		await expect(page).toHaveURL(/\/bezirke$/);
		await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
	});

	test('Layer: Link führt auf /daten', async ({ page }) => {
		await page.goto('/layer/laerm-2023');
		await page.getByTestId('layer-detail-overview-link').click();
		await expect(page).toHaveURL(/\/daten$/);
		await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
	});

	test('EN: Bezirk- und Layer-Links tragen /en und englischen Text', async ({ page }) => {
		await page.goto('/en/bezirk/pankow');
		const bezirke = page.getByTestId('overview-link-bezirke');
		await expect(bezirke).toHaveAttribute('href', '/en/bezirke');
		await expect(bezirke).toHaveText('All Bezirke');
		await expect(page.getByTestId('overview-link-kieze')).toHaveAttribute(
			'href',
			/^\/en\/kieze#bezirk-[a-z0-9-]+$/
		);

		await page.goto('/en/layer/laerm-2023');
		const layer = page.getByTestId('layer-detail-overview-link');
		await expect(layer).toHaveAttribute('href', '/en/daten');
		await expect(layer).toHaveText('All data layers');
	});
});
