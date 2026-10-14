import { expect, test, type Page } from '@playwright/test';

const KIEZ = 'reuterstrasse';
const SCREENSHOT_DIR = 'test-results/key-figures';

async function mapReady(page: Page): Promise<void> {
	await page.locator('[data-testid="map-skeleton"]').waitFor({ state: 'detached', timeout: 30000 });
}

test.describe('L4: Kennzahl-Kacheln', () => {
	test('Kiez: sechs Kacheln mit Wert, Berlin-Wert und Karten-Link', async ({ page }) => {
		await page.goto(`/kiez/${KIEZ}`);
		const tiles = page.getByTestId('key-figure-tile');
		await expect(tiles).toHaveCount(6);
		for (const tile of await tiles.all()) {
			await expect(tile).toContainText(/Berlin: /);
			await expect(tile).toContainText(/\d|keine Angabe/);
		}
		await expect(page.getByTestId('key-figure-link').first()).toHaveAttribute(
			'href',
			`/explore?kiez=${KIEZ}&layers=zensus-bestandsmiete-2022`
		);
		await page.screenshot({ path: `${SCREENSHOT_DIR}/kiez-desktop.png`, fullPage: true });
	});

	test('Kiez 375 px: zwei Spalten, kein horizontaler Überlauf', async ({ page }) => {
		await page.setViewportSize({ width: 375, height: 667 });
		await page.goto(`/kiez/${KIEZ}`);
		const list = page.getByTestId('key-figure-list');
		await expect(list).toBeVisible();
		const columns = await list.evaluate(
			(el) => getComputedStyle(el).gridTemplateColumns.split(' ').length
		);
		expect(columns).toBe(2);
		const overflow = await page.evaluate(
			() => document.documentElement.scrollWidth - document.documentElement.clientWidth
		);
		expect(overflow).toBeLessThanOrEqual(0);
		await list.screenshot({ path: `${SCREENSHOT_DIR}/kiez-mobile-375.png` });
	});

	test('Desktop 1280 px: drei Spalten', async ({ page }) => {
		await page.setViewportSize({ width: 1280, height: 800 });
		await page.goto(`/kiez/${KIEZ}`);
		const columns = await page
			.getByTestId('key-figure-list')
			.evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(' ').length);
		expect(columns).toBe(3);
	});

	test('Kacheln stehen zwischen Hero und Details', async ({ page }) => {
		await page.goto(`/kiez/${KIEZ}`);
		const order = await page.evaluate(() => {
			const top = (id: string): number =>
				document.querySelector(`[data-testid="${id}"]`)?.getBoundingClientRect().top ?? -1;
			return [top('kiez-hero'), top('key-figures'), top('kiez-details')];
		});
		expect(order.every((y) => y >= 0)).toBe(true);
		expect(order[0]).toBeLessThan(order[1]!);
		expect(order[1]).toBeLessThan(order[2]!);
	});

	test('Dublette heerstrasse-spandau: Kacheln mit Werten', async ({ page }) => {
		await page.goto('/kiez/heerstrasse-spandau');
		await expect(page.getByTestId('key-figure-tile')).toHaveCount(6);
		await expect(
			page.locator('[data-figure="hitze"]').getByTestId('key-figure-value')
		).toContainText(/\d+[,.]?\d* °C/);
	});

	test('Werte stehen im Wert-Element, nicht nur in der Berlin-Zeile', async ({ page }) => {
		for (const path of [`/kiez/${KIEZ}`, '/bezirk/pankow']) {
			await page.goto(path);
			const values = page.getByTestId('key-figure-value');
			await expect(values).toHaveCount(6);
			for (const value of await values.all()) {
				await expect(value).not.toContainText('keine Angabe');
				await expect(value).toContainText(/\d|überwiegend/);
			}
		}
	});

	test('Bezirk: Reihenfolge Hero, Kiez-Liste, Kacheln, Details', async ({ page }) => {
		await page.goto('/bezirk/pankow');
		const order = await page.evaluate(() => {
			const top = (id: string): number =>
				document.querySelector(`[data-testid="${id}"]`)?.getBoundingClientRect().top ?? -1;
			return [
				top('bezirk-hero'),
				top('bezirk-kieze-list'),
				top('key-figures'),
				top('bezirk-details')
			];
		});
		expect(order.every((y) => y >= 0)).toBe(true);
		expect([...order].sort((a, b) => a - b)).toEqual(order);
	});

	test('Bezirk: sechs Kacheln, Links mit ?bezirk=', async ({ page }) => {
		await page.goto('/bezirk/pankow');
		await expect(page.getByTestId('key-figure-tile')).toHaveCount(6);
		await expect(page.getByTestId('key-figure-link').first()).toHaveAttribute(
			'href',
			'/explore?bezirk=pankow&layers=zensus-bestandsmiete-2022'
		);
		await page.screenshot({ path: `${SCREENSHOT_DIR}/bezirk-desktop.png`, fullPage: true });
	});

	test('EN: englische Texte, Dezimalpunkt, /en-Links', async ({ page }) => {
		await page.goto(`/en/kiez/${KIEZ}`);
		await expect(
			page.getByRole('heading', { name: 'Key figures compared with Berlin' })
		).toBeVisible();
		await expect(page.locator('[data-figure="bestandsmiete"]')).toContainText(/\d\.\d{2} €\/m²/);
		await expect(page.getByTestId('key-figure-link').first()).toHaveAttribute(
			'href',
			`/en/explore?kiez=${KIEZ}&layers=zensus-bestandsmiete-2022`
		);
	});

	test('Altbau-Link öffnet /explore mit Ortskarte und aktivem Layer', async ({ page }) => {
		await page.goto(`/kiez/${KIEZ}`);
		await page.locator('[data-figure="altbau"] [data-testid="key-figure-link"]').click();
		await expect(page).toHaveURL(new RegExp(`/explore\\?kiez=${KIEZ}`));
		await mapReady(page);
		await expect(page.getByTestId('region-focus-card')).toBeVisible({ timeout: 15000 });
		expect(new URL(page.url()).searchParams.get('layers')).toBe('zensus-altbau-anteil-2022');
		await expect(page.getByTestId('map-legend')).toContainText('Altbau', { timeout: 15000 });
	});
});
