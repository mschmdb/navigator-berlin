import { expect, test } from '@playwright/test';

// Issue #77: Kühle und Warme Orte erscheinen nur im Hitze- bzw. Kälte-Modus.
async function openPalette(page: import('@playwright/test').Page, path: string): Promise<void> {
	await page.goto(path);
	await page.getByTestId('header-layer-trigger').click();
	await expect(page.getByTestId('palette-search')).toBeVisible({ timeout: 15000 });
}

test.describe('Orte-Layer nur im passenden Modus (#77)', () => {
	test('Default-Palette: weder Kühle noch Warme Orte, auch nicht per Suche', async ({ page }) => {
		await openPalette(page, '/explore');
		const palette = page.getByTestId('layer-palette');
		await page.getByTestId('palette-search').fill('kita');
		await expect(palette.getByTestId('palette-toggle-kitas-2024')).toBeVisible();
		await expect(palette.getByTestId('palette-toggle-kuehle-orte')).toHaveCount(0);
		await expect(palette.getByTestId('palette-toggle-waerme-orte')).toHaveCount(0);
		for (const term of ['kühl', 'warm']) {
			await page.getByTestId('palette-search').fill(term);
			await expect(palette.getByTestId('palette-toggle-kuehle-orte')).toHaveCount(0);
			await expect(palette.getByTestId('palette-toggle-waerme-orte')).toHaveCount(0);
		}
	});

	test('Hitze-Modus: Kühle Orte ja, Warme Orte nein', async ({ page }) => {
		await openPalette(page, '/explore?mode=hitze');
		await page.getByTestId('palette-search').fill('orte');
		const palette = page.getByTestId('layer-palette');
		await expect(palette.getByTestId('palette-toggle-kuehle-orte')).toBeVisible();
		await expect(palette.getByTestId('palette-toggle-waerme-orte')).toHaveCount(0);
	});

	test('Kälte-Modus: Warme Orte ja, Kühle Orte nein', async ({ page }) => {
		await openPalette(page, '/explore?mode=kaelte');
		await page.getByTestId('palette-search').fill('orte');
		const palette = page.getByTestId('layer-palette');
		await expect(palette.getByTestId('palette-toggle-waerme-orte')).toBeVisible();
		await expect(palette.getByTestId('palette-toggle-kuehle-orte')).toHaveCount(0);
	});

	test('Alter Link ohne mode zieht den Hitze-Modus nach und behält andere Layer', async ({
		page
	}) => {
		await page.goto('/explore?layers=kuehle-orte,laerm-den');
		await expect(page).toHaveURL(/mode=hitze/, { timeout: 15000 });
		await expect(page).toHaveURL(/layers=kuehle-orte(%2C|,)laerm-den/);
		await expect(page.getByTestId('legend-icon-kuehle-orte')).toBeAttached();
	});

	test('Falscher Modus: Warme Orte fällt weg, Modus bleibt', async ({ page }) => {
		await page.goto('/explore?layers=waerme-orte&mode=hitze');
		await expect(page).not.toHaveURL(/waerme-orte/, { timeout: 15000 });
		await expect(page).toHaveURL(/mode=hitze/);
	});

	test('Alter Link zieht den Kälte-Modus nach, Legende zeigt Warme Orte', async ({ page }) => {
		await page.goto('/explore?layers=waerme-orte');
		await expect(page).toHaveURL(/mode=kaelte/, { timeout: 15000 });
		await expect(page).toHaveURL(/layers=waerme-orte/);
		await expect(page.getByTestId('legend-icon-waerme-orte')).toBeAttached();
	});

	for (const [mode, slug] of [
		['hitze', 'kuehle-orte'],
		['kaelte', 'waerme-orte']
	] as const) {
		test(`Voller Navigator (${mode}) schaltet ${slug} ab`, async ({ page }) => {
			await page.goto(`/explore?layers=${slug}&mode=${mode}&address=13.4544,52.5111&q=Boxhagener`);
			await expect(page.getByTestId(`legend-icon-${slug}`)).toBeAttached({ timeout: 15000 });
			await page.getByTestId(`${mode}-full-navigator`).getByRole('link').click();
			await expect(page.getByTestId(`legend-icon-${slug}`)).toHaveCount(0);
			await expect(page).not.toHaveURL(new RegExp(slug));
		});
	}
});
