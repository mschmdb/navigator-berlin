import { expect, test, type Page } from '@playwright/test';

const KIEZ = 'prenzlauer-berg-suedwest';
// Gesamt-Quartil 4 im DB-gestützten Build: Rang-Wortlaut „unteres Viertel“.
const KIEZ_BOTTOM_QUARTILE = 'tempelhof-suedost';
const SCREENSHOT_DIR = 'test-results/kiez-landing';
// Gesamt-HTML bleibt wegen des doppelt inline ausgelieferten Logos über 100 KB (deferred-work.md).
const MAX_OUTLINE_BYTES = 8 * 1024;

async function mapReady(page: Page): Promise<void> {
	await page.locator('[data-testid="map-skeleton"]').waitFor({ state: 'detached', timeout: 30000 });
}

test.describe('L2: Kiez-Hero', () => {
	test('375 px: h1, Einwohnerzahl, Umriss und Karten-Button im ersten Bildschirm', async ({
		page
	}) => {
		await page.setViewportSize({ width: 375, height: 667 });
		await page.goto(`/kiez/${KIEZ}`);
		await expect(page.locator('h1')).toBeInViewport();
		await expect(page.getByTestId('kiez-facts')).toContainText(/\d/);
		await expect(page.getByTestId('kiez-facts')).toBeInViewport();
		await expect(page.getByTestId('kiez-hero-score')).toBeInViewport({ ratio: 1 });
		await expect(page.getByTestId('kiez-location-map')).toBeInViewport();
		await expect(page.getByTestId('kiez-map-button')).toBeInViewport({ ratio: 1 });
		await page.screenshot({ path: `${SCREENSHOT_DIR}/mobile-375.png` });
	});

	test('Desktop 1280x800: Score und Button im ersten Bildschirm, Reihenfolge Hero, Details', async ({
		page
	}) => {
		await page.setViewportSize({ width: 1280, height: 800 });
		await page.goto(`/kiez/${KIEZ}`);
		await expect(page.getByTestId('kiez-hero-score')).toBeInViewport({ ratio: 1 });
		await expect(page.getByTestId('kiez-map-button')).toBeInViewport({ ratio: 1 });
		const order = await page.evaluate(() => {
			const top = (id: string): number =>
				document.querySelector(`[data-testid="${id}"]`)?.getBoundingClientRect().top ?? -1;
			return [top('kiez-hero'), top('kiez-details')];
		});
		expect(order.every((y) => y >= 0)).toBe(true);
		expect(order[0]).toBeLessThan(order[1]);
		await page.screenshot({ path: `${SCREENSHOT_DIR}/desktop-1280.png` });
	});

	test('Kartenrahmen: Titel Lage im Bezirk, Button im Rahmen, Stärke in der Textgruppe', async ({
		page
	}) => {
		await page.setViewportSize({ width: 1280, height: 900 });
		await page.goto(`/kiez/${KIEZ}`);
		const card = page.getByTestId('hero-map-card');
		await expect(card).toContainText('Lage im Bezirk Pankow');
		await expect(card.getByTestId('kiez-map-button')).toBeVisible();
		await expect(page.getByTestId('kiez-hero-strength')).toHaveCount(1);
		await expect(card.getByTestId('kiez-hero-strength')).toHaveCount(0);
		await expect(page.getByTestId('kiez-hero-score')).toContainText(/\d+ von 100/);
		await expect(card.getByTestId('kiez-outline-explain')).toContainText('Dunkel:');

		const geometry = await page.evaluate((heroId) => {
			const rect = (el: Element | null) => el?.getBoundingClientRect();
			const eyebrow = rect(document.querySelector(`[data-testid="${heroId}"] p`));
			const h1 = rect(document.querySelector(`[data-testid="${heroId}"] h1`));
			const card = rect(document.querySelector('[data-testid="hero-map-card"]'));
			const crumb = [...document.querySelectorAll('a')].find(
				(a) => a.textContent?.trim() === 'Berlin'
			);
			const crumbLeft = rect(crumb ?? null)?.left ?? -1;
			return {
				crumbLeft,
				eyebrowLeft: eyebrow?.left ?? -1,
				h1Left: h1?.left ?? -1,
				h1Right: h1?.right ?? -1,
				eyebrowTop: eyebrow?.top ?? -1,
				cardLeft: card?.left ?? -1,
				cardTop: card?.top ?? -1
			};
		}, 'kiez-hero');
		expect(Math.abs(geometry.eyebrowLeft - geometry.crumbLeft)).toBeLessThanOrEqual(1);
		expect(Math.abs(geometry.h1Left - geometry.crumbLeft)).toBeLessThanOrEqual(1);
		expect(geometry.cardLeft).toBeGreaterThanOrEqual(geometry.h1Right - 1);
		expect(Math.abs(geometry.cardTop - geometry.eyebrowTop)).toBeLessThanOrEqual(8);
	});

	test('Eyebrow verlinkt auf die Bezirksseite, Lage-Grafik hebt den Kiez hervor', async ({
		page
	}) => {
		await page.goto(`/kiez/${KIEZ}`);
		await expect(page.getByTestId('kiez-hero-bezirk-link')).toHaveAttribute(
			'href',
			'/bezirk/pankow'
		);
		const svg = page.getByTestId('kiez-location-map');
		await expect(svg).toHaveAttribute('role', 'img');
		await expect(svg).toHaveAttribute('aria-label', /^Lage von .+ im Bezirk Pankow$/);
		await expect(page.getByTestId('kiez-location-current')).toHaveCount(1);
	});

	test('Details-Teil rendert Vergleichstabelle und Score-Block ohne zweite Composite-Zahl', async ({
		page
	}) => {
		await page.goto(`/kiez/${KIEZ}`);
		await expect(page.getByTestId('kiez-details')).toBeVisible();
		await expect(page.getByTestId('score-comparison')).toHaveCount(1);
		await expect(page.getByTestId('kiez-score')).toHaveCount(1);
	});

	for (const [prefix, label] of [
		['', 'DE'],
		['/en', 'EN']
	] as const) {
		test(`375 px, unteres Viertel (${label}): Score, Rang-Wortlaut und Button ohne Scrollen`, async ({
			page
		}) => {
			await page.setViewportSize({ width: 375, height: 667 });
			await page.goto(`${prefix}/kiez/${KIEZ_BOTTOM_QUARTILE}`);
			await expect(page.getByTestId('kiez-hero-score')).toBeInViewport({ ratio: 1 });
			await expect(page.getByTestId('kiez-hero-rank')).not.toContainText(/\d+ (von|of) \d+/);
			await expect(page.getByTestId('kiez-hero-strength')).toHaveCount(0);
			await expect(page.getByTestId('kiez-map-button')).toBeInViewport({ ratio: 1 });
			await page.screenshot({ path: `${SCREENSHOT_DIR}/mobile-375-bottom-quartile-${label}.png` });
		});
	}

	test('Dublette: heerstrasse-spandau zeigt Bezirk Spandau und passenden Button', async ({
		page
	}) => {
		await page.goto('/kiez/heerstrasse-spandau');
		await expect(page.getByTestId('kiez-hero-bezirk-link')).toHaveAttribute(
			'href',
			'/bezirk/spandau'
		);
		await expect(page.getByTestId('kiez-map-button')).toHaveAttribute(
			'href',
			'/explore?kiez=heerstrasse-spandau'
		);
		await expect(page.getByTestId('kiez-location-map')).toHaveAttribute(
			'aria-label',
			/im Bezirk Spandau$/
		);
	});

	test('Karten-Button führt zu /explore?kiez= mit Ortskarte', async ({ page }) => {
		await page.goto(`/kiez/${KIEZ}`);
		await page.getByTestId('kiez-map-button').click();
		await expect(page).toHaveURL(new RegExp(`/explore\\?kiez=${KIEZ}`));
		await mapReady(page);
		await expect(page.getByTestId('region-focus-card')).toBeVisible({ timeout: 15000 });
	});

	test('Frühere Adresswahl verdrängt den Kiez-Fokus nach dem Karten-Button nicht', async ({
		page
	}) => {
		await page.goto('/explore?address=13.4544,52.5111&q=Boxhagener');
		await mapReady(page);
		await expect(page.getByTestId('inspector-panel')).toBeVisible({ timeout: 20000 });
		await page.getByTestId('inspector-kiez-link').click();
		await expect(page).toHaveURL(/\/kiez\//);
		await page.getByTestId('kiez-map-button').click();
		await expect(page).toHaveURL(/\/explore\?kiez=/);
		await expect(page.getByTestId('region-focus-card')).toBeVisible({ timeout: 15000 });
		await expect(page.getByTestId('inspector-panel')).toHaveCount(0);
		expect(new URL(page.url()).searchParams.has('kiez')).toBe(true);
	});

	test('EN: Button und Links mit /en-Präfix', async ({ page }) => {
		await page.goto(`/en/kiez/${KIEZ}`);
		await expect(page.getByTestId('kiez-map-button')).toHaveAttribute(
			'href',
			`/en/explore?kiez=${KIEZ}`
		);
		await expect(page.getByTestId('kiez-map-button')).toContainText('on the map');
		await expect(page.getByTestId('kiez-hero-bezirk-link')).toHaveAttribute(
			'href',
			'/en/bezirk/pankow'
		);
	});

	test('Lage-Grafik bleibt klein (Pfade vereinfacht, andere Kieze in einem Pfad)', async ({
		page
	}) => {
		await page.goto(`/kiez/${KIEZ}`);
		const svgBytes = await page
			.getByTestId('kiez-location-map')
			.evaluate((el) => new TextEncoder().encode(el.outerHTML).length);
		expect(svgBytes).toBeLessThan(MAX_OUTLINE_BYTES);
	});
});
