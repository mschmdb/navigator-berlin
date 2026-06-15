import { expect, test } from '@playwright/test';

async function waitForMap(page: import('@playwright/test').Page) {
	await page.locator('[data-testid="map-skeleton"]').waitFor({ state: 'detached', timeout: 15000 });
}

test.describe('Layer-Toggle-Palette', () => {
	test('/-Shortcut öffnet Palette + Esc schließt', async ({ page }) => {
		await page.goto('/explore');
		await waitForMap(page);
		await page.keyboard.press('/');
		await expect(page.getByTestId('layer-palette')).toBeVisible();
		await page.keyboard.press('Escape');
		await expect(page.getByTestId('layer-palette')).not.toBeVisible();
	});

	test('Header-Layer-Trigger öffnet Palette', async ({ page }) => {
		await page.goto('/explore');
		await waitForMap(page);
		await page.getByTestId('header-layer-trigger').click();
		await expect(page.getByTestId('layer-palette')).toBeVisible();
	});

	test('Suche filtert Toggle-Liste', async ({ page }) => {
		await page.goto('/explore');
		await waitForMap(page);
		await page.keyboard.press('/');
		await page.getByTestId('palette-search').fill('mietspiegel');
		await expect(page.getByTestId('palette-toggle-mietspiegel-wohnlage')).toBeVisible();
		await expect(page.getByTestId('palette-toggle-bezirke')).not.toBeVisible();
	});

	test('Toggle aktiviert Layer + schreibt URL-Param', async ({ page }) => {
		await page.goto('/explore');
		await waitForMap(page);
		await page.keyboard.press('/');
		await page.getByTestId('palette-toggle-bezirke').click();
		await page.waitForFunction(
			() => new URL(window.location.href).searchParams.get('layers') !== null
		);
		const url = new URL(page.url());
		expect(url.searchParams.get('layers')).toContain('bezirke');
		await expect(page.getByTestId('header-layer-badge')).toHaveText('1');
	});

	test('"Alle deaktivieren" leert Active-Slugs', async ({ page }) => {
		await page.goto('/?layers=bezirke,plz');
		await waitForMap(page);
		await page.keyboard.press('/');
		await expect(page.getByTestId('palette-active-count')).toHaveText('2');
		await page.getByTestId('palette-clear').click();
		await expect(page.getByTestId('palette-active-count')).toHaveText('0');
	});

	test('Page-Load mit ?layers=... initialisiert Active-Slugs', async ({ page }) => {
		await page.goto('/?layers=stolpersteine');
		await waitForMap(page);
		await expect(page.getByTestId('header-layer-badge')).toHaveText('1');
	});

	test('Mobile-Viewport rendert Bottom-Sheet-Variante', async ({ page }) => {
		await page.setViewportSize({ width: 375, height: 812 });
		await page.goto('/explore');
		await waitForMap(page);
		await page.getByTestId('header-layer-trigger').click();
		const palette = page.getByTestId('layer-palette');
		await expect(palette).toBeVisible();
		await expect(palette).toHaveAttribute('data-variant', 'sheet');
	});
});
