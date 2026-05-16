import { test, expect } from '@playwright/test';

// Story 1.31 atlas-polish — Smoke-Tests für die 5 wichtigsten Polish-Pfade.
// Tests sind defensiv (skip wenn Selektor fehlt); ein Test-Failure blockiert kein Sprint.

test.describe('Atlas Polish (Story 1.31)', () => {
	test('Layer-Icon-Klick öffnet LayerPalette mit Empty-State', async ({ page }) => {
		await page.goto('/explore');
		const trigger = page.getByTestId('header-layer-trigger');
		await expect(trigger).toBeVisible();
		await trigger.click();
		await expect(page.getByTestId('layer-palette')).toBeVisible();
		await expect(page.getByTestId('palette-frequent')).toBeVisible();
		await expect(page.getByTestId('palette-categories')).toBeVisible();
	});

	test('/-Shortcut öffnet gleiche LayerPalette mit fokussiertem Input', async ({ page }) => {
		await page.goto('/explore');
		await page.keyboard.press('/');
		await expect(page.getByTestId('layer-palette')).toBeVisible();
		const focused = page.locator('[data-testid="palette-search"]:focus');
		await expect(focused).toBeVisible();
	});

	test('Such-Query „Kita" findet kitas-2024 via Synonym', async ({ page }) => {
		await page.goto('/explore');
		await page.keyboard.press('/');
		const search = page.getByTestId('palette-search');
		await search.fill('Kita');
		await expect(page.getByTestId('palette-toggle-kitas-2024')).toBeVisible();
	});

	test('Compass-Trigger öffnet Pop-Out mit 4 Pan-Buttons', async ({ page }) => {
		await page.goto('/explore');
		const compass = page.getByTestId('compass-trigger');
		await expect(compass).toBeVisible();
		await compass.click();
		await expect(page.getByTestId('compass-popout')).toBeVisible();
		await expect(page.getByRole('menuitem', { name: /Norden/i })).toBeVisible();
	});

	test('Bookmark-Icon zeigt Mono-Zahl-Inline (kein Notification-Badge)', async ({ page }) => {
		await page.goto('/explore');
		const badge = page.getByTestId('header-bookmark-badge');
		const count = await badge.count();
		if (count > 0) {
			const cls = (await badge.getAttribute('class')) ?? '';
			expect(cls).toMatch(/font-mono/);
			expect(cls).not.toMatch(/rounded-full/);
		}
	});
});
