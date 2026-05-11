import { expect, test } from '@playwright/test';

test('Showcase rendert Plex-Heading + Logo', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByRole('heading', { level: 1, name: 'navigator.berlin' })).toBeVisible();
	await expect(page.locator('img[src="/logo-mark.svg"]')).toBeVisible();
});

test('SkipLink ist erstes Tab-Target und springt zu #main', async ({ page }) => {
	await page.goto('/');
	await page.keyboard.press('Tab');
	const link = page.getByRole('link', { name: 'Zum Hauptinhalt springen' });
	await expect(link).toBeFocused();
	await page.keyboard.press('Enter');
	await expect(page).toHaveURL(/#main$/);
});

test('Dialog öffnet bei Trigger-Click ohne Overlay-Dimmer', async ({ page }) => {
	await page.goto('/');
	await page.getByRole('button', { name: 'Dialog öffnen' }).click();
	await expect(page.getByRole('dialog')).toBeVisible();
	await expect(page.getByText('Dialog-Beispiel')).toBeVisible();
	// UX-DR33: kein dim Overlay (bits-ui's Overlay-Element NICHT gerendert in unserem Wrapper)
	const overlay = page.locator('[data-dialog-overlay]');
	await expect(overlay).toHaveCount(0);
});

test('MetaFooter mit 5 Meta-Links + Disclaimer am Seitenende', async ({ page }) => {
	await page.goto('/');
	const footer = page.getByRole('contentinfo');
	await expect(footer).toBeVisible();
	for (const name of ['Impressum', 'Datenschutz', 'Lizenzen', 'Architektur', 'Kontakt']) {
		await expect(footer.getByRole('link', { name })).toBeVisible();
	}
	await expect(footer.getByText(/BFSG-konform.*WCAG 2\.2 AA/)).toBeVisible();
});

test('Favicon-SVG im <link rel=icon>', async ({ page }) => {
	await page.goto('/');
	const iconLink = await page.locator('link[rel="icon"][type="image/svg+xml"]').count();
	expect(iconLink).toBe(1);
});

test('Preload für 3 Plex-Latin-Fonts im <head>', async ({ page }) => {
	await page.goto('/');
	const preloads = await page.locator('link[rel="preload"][as="font"]').count();
	expect(preloads).toBe(3);
});
