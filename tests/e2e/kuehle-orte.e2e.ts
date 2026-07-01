import { expect, test } from '@playwright/test';

// Story 16.1: Landing-Gerüst + nahtloser Übergang in den Explorer via URL-State-Deep-Link.
test.describe('Kühle-Orte-Landing', () => {
	test('Route lädt, h1 sichtbar', async ({ page }) => {
		const res = await page.goto('/kuehle-orte');
		expect(res?.status()).toBe(200);
		await expect(page.getByRole('heading', { level: 1 })).toContainText('Kühle Orte in Berlin');
	});

	test('CTA führt in den Explorer mit aktivem kuehle-orte-Layer', async ({ page }) => {
		await page.goto('/kuehle-orte');
		await page.getByTestId('explorer-cta').click();
		await expect(page).toHaveURL(/\/explore\?layers=kuehle-orte/);
	});
});
