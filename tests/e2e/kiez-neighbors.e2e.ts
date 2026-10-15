import { expect, test } from '@playwright/test';

const KIEZ = 'reuterstrasse';

test.describe('L6: Nachbar- und ähnliche Kieze', () => {
	test('Reuterstraße: mindestens 3 angrenzende Kieze mit Links und Bezirk', async ({ page }) => {
		await page.goto(`/kiez/${KIEZ}`);
		const section = page.getByTestId('kiez-siblings-list');
		await expect(section.getByRole('heading', { level: 2 })).toHaveText('Angrenzende Kieze');
		const links = section.getByTestId('kiez-sibling-link');
		expect(await links.count()).toBeGreaterThanOrEqual(3);
		await expect(links.first()).toHaveAttribute('href', /^\/kiez\/[a-z0-9-]+$/);
		await expect(section.locator('li').first()).toContainText(/\p{L}/u);
	});

	test('Reuterstraße: Nachbarn nennen den Score, auch aus Friedrichshain-Kreuzberg', async ({
		page
	}) => {
		await page.goto(`/kiez/${KIEZ}`);
		const section = page.getByTestId('kiez-siblings-list');
		const luisenstadt = section.locator('a[href="/kiez/suedliche-luisenstadt"]');
		await expect(luisenstadt).toHaveCount(1);
		await expect(luisenstadt).toHaveAttribute('aria-label', /Friedrichshain-Kreuzberg/);
		for (const link of await section.getByTestId('kiez-sibling-link').all()) {
			await expect(link).toHaveAttribute('aria-label', /Kiez-Score \d+ von 100$/);
		}
		await expect(section.locator('li').first()).toContainText(/Kiez-Score \d+/);
	});

	test('Reuterstraße: 3 ähnliche Kieze mit Score, keiner davon ein Nachbar', async ({ page }) => {
		await page.goto(`/kiez/${KIEZ}`);
		const similar = page.getByTestId('kiez-similar-list');
		await expect(similar.getByRole('heading', { level: 2 })).toHaveText('Ähnliche Kieze');
		const links = similar.getByTestId('kiez-similar-link');
		await expect(links).toHaveCount(3);
		const adjacent = await page
			.getByTestId('kiez-sibling-link')
			.evaluateAll((els) => els.map((el) => el.getAttribute('href')));
		for (const link of await links.all()) {
			await expect(link).toHaveAttribute('aria-label', /Kiez-Score \d+ von 100$/);
			expect(adjacent).not.toContain(await link.getAttribute('href'));
		}
	});

	test('Klick auf einen Nachbarn öffnet dessen Kiez-Seite', async ({ page }) => {
		await page.goto(`/kiez/${KIEZ}`);
		await page.getByTestId('kiez-sibling-link').first().click();
		await expect(page).toHaveURL(/\/kiez\/(?!reuterstrasse$)[a-z0-9-]+$/);
		await expect(page.locator('h1')).toBeVisible();
	});

	test('EN: englische Überschrift, /en-Links', async ({ page }) => {
		await page.goto(`/en/kiez/${KIEZ}`);
		const section = page.getByTestId('kiez-siblings-list');
		await expect(section.getByRole('heading', { level: 2 })).toHaveText('Neighbouring Kieze');
		await expect(section.getByTestId('kiez-sibling-link').first()).toHaveAttribute(
			'href',
			/^\/en\/kiez\//
		);
	});
});
