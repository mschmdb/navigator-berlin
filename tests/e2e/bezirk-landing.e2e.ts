import { expect, test, type Page } from '@playwright/test';

const BEZIRK = 'friedrichshain-kreuzberg';
const SCREENSHOT_DIR = 'test-results/bezirk-landing';

async function mapReady(page: Page): Promise<void> {
	await page.locator('[data-testid="map-skeleton"]').waitFor({ state: 'detached', timeout: 30000 });
}

test.describe('L5: Bezirksseite mit Karte und Liste', () => {
	test('375 px: h1, Einwohnerzahl, Karte und Karten-Button im ersten Bildschirm', async ({
		page
	}) => {
		await page.setViewportSize({ width: 375, height: 667 });
		await page.goto(`/bezirk/${BEZIRK}`);
		await expect(page.locator('h1')).toBeInViewport();
		await expect(page.getByTestId('bezirk-facts')).toContainText(/\d/);
		await expect(page.getByTestId('bezirk-facts')).toBeInViewport();
		await expect(page.getByTestId('bezirk-kieze-map').locator('svg')).toBeInViewport();
		await expect(page.getByTestId('bezirk-map-button')).toBeInViewport({ ratio: 1 });
		await page.screenshot({ path: `${SCREENSHOT_DIR}/mobile-375.png` });
	});

	test('Kartenrahmen: Score-Erklärung mit Link, Button im Rahmen, zwei Spalten ab 1280 px', async ({
		page
	}) => {
		await page.setViewportSize({ width: 1280, height: 900 });
		await page.goto(`/bezirk/${BEZIRK}`);
		const card = page.getByTestId('hero-map-card');
		await expect(card).toContainText('Kiez-Score der Kieze');
		await expect(card).toContainText('von 0 bis 100');
		await expect(card.getByTestId('bezirk-score-explain-link')).toHaveAttribute(
			'href',
			'/methodik/kiez-score'
		);
		await expect(card.getByTestId('bezirk-map-button')).toBeVisible();
		const geometry = await page.evaluate((heroId) => {
			const rect = (el: Element | null) => el?.getBoundingClientRect();
			const eyebrow = rect(document.querySelector(`[data-testid="${heroId}"] h1`));
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
		}, 'bezirk-hero');
		expect(Math.abs(geometry.eyebrowLeft - geometry.crumbLeft)).toBeLessThanOrEqual(1);
		expect(Math.abs(geometry.h1Left - geometry.crumbLeft)).toBeLessThanOrEqual(1);
		expect(geometry.cardLeft).toBeGreaterThanOrEqual(geometry.h1Right - 1);
		expect(Math.abs(geometry.cardTop - geometry.eyebrowTop)).toBeLessThanOrEqual(8);
		await page.screenshot({ path: `${SCREENSHOT_DIR}/desktop-1280-hero.png` });
	});

	test('Desktop: Screenshot und Reihenfolge Hero, Liste, Details', async ({ page }) => {
		await page.setViewportSize({ width: 1280, height: 800 });
		await page.goto(`/bezirk/${BEZIRK}`);
		const order = await page.evaluate(() => {
			const top = (id: string): number =>
				document.querySelector(`[data-testid="${id}"]`)?.getBoundingClientRect().top ?? -1;
			return [top('bezirk-hero'), top('bezirk-kieze-list'), top('bezirk-details')];
		});
		expect(order.every((y) => y >= 0)).toBe(true);
		expect(order[0]).toBeLessThan(order[1]);
		expect(order[1]).toBeLessThan(order[2]);
		// FAQ steht nach dem Steckbrief, ganz am Ende des Detailteils.
		const faqAfterSteckbrief = await page.evaluate(() => {
			const faq = document.querySelector('#faq-heading, #faq-placeholder-heading');
			const steck = document.querySelector('#steckbrief-heading');
			if (!faq || !steck) return false;
			return Boolean(steck.compareDocumentPosition(faq) & Node.DOCUMENT_POSITION_FOLLOWING);
		});
		expect(faqAfterSteckbrief).toBe(true);
		await page.screenshot({ path: `${SCREENSHOT_DIR}/desktop-1280.png` });
	});

	test('Karte: jeder Kiez ist ein Link auf seine Kiez-Seite', async ({ page }) => {
		await page.goto(`/bezirk/${BEZIRK}`);
		const links = page.getByTestId('bezirk-map-link');
		const count = await links.count();
		expect(count).toBeGreaterThan(5);
		await expect(page.getByTestId('bezirk-kieze-link')).toHaveCount(count);
		await expect(links.first()).toHaveAttribute('href', /^\/kiez\/[a-z0-9-]+$/);
		await expect(links.first().locator('title')).toHaveText(/Kiez-Score|ohne Kiez-Score/);
	});

	test('Liste: sortierbar per Tastatur, aria-sort wechselt', async ({ page }) => {
		await page.goto(`/bezirk/${BEZIRK}`);
		const nameHeader = page.locator('th', { has: page.getByTestId('bezirk-kieze-sort-name') });
		const scoreHeader = page.locator('th', { has: page.getByTestId('bezirk-kieze-sort-score') });
		const names = async (): Promise<string[]> =>
			(await page.getByTestId('bezirk-kieze-link').allTextContents()).map((t) => t.trim());

		const sortName = page.getByTestId('bezirk-kieze-sort-name');
		await sortName.focus();
		await page.keyboard.press('Enter');
		await expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');
		await expect(scoreHeader).toHaveAttribute('aria-sort', 'none');
		const asc = await names();
		expect(asc).toEqual([...asc].sort((a, b) => a.localeCompare(b, 'de')));

		await page.keyboard.press('Space');
		await expect(nameHeader).toHaveAttribute('aria-sort', 'descending');
		const desc = await names();
		expect(desc).toEqual([...asc].reverse());
		await page.screenshot({ path: `${SCREENSHOT_DIR}/list-sorted.png`, fullPage: true });
	});

	test('Karten-Button führt zu /explore?bezirk= mit Ortskarte', async ({ page }) => {
		await page.goto(`/bezirk/${BEZIRK}`);
		await page.getByTestId('bezirk-map-button').click();
		await expect(page).toHaveURL(new RegExp(`/explore\\?bezirk=${BEZIRK}`));
		await mapReady(page);
		await expect(page.getByTestId('region-focus-card')).toBeVisible({ timeout: 15000 });
		await expect(page.getByTestId('region-focus-name')).toHaveText('Friedrichshain-Kreuzberg');
	});

	test('Frühere Adresswahl verdrängt den Fokus nach dem Karten-Button nicht', async ({ page }) => {
		await page.goto('/explore?address=13.4544,52.5111&q=Boxhagener');
		await mapReady(page);
		await expect(page.getByTestId('inspector-panel')).toBeVisible({ timeout: 20000 });
		await page.getByTestId('inspector-bezirk-link').click();
		await expect(page).toHaveURL(/\/bezirk\//);
		await page.getByTestId('bezirk-map-button').click();
		await expect(page).toHaveURL(/\/explore\?bezirk=/);
		await expect(page.getByTestId('region-focus-card')).toBeVisible({ timeout: 15000 });
		await expect(page.getByTestId('inspector-panel')).toHaveCount(0);
		expect(new URL(page.url()).searchParams.has('bezirk')).toBe(true);
	});

	test('EN: Button und Links mit /en-Präfix', async ({ page }) => {
		await page.goto('/en/bezirk/pankow');
		await expect(page.getByTestId('bezirk-map-button')).toHaveAttribute(
			'href',
			'/en/explore?bezirk=pankow'
		);
		await expect(page.getByTestId('bezirk-map-button')).toContainText('Pankow on the map');
		await expect(page.getByTestId('bezirk-score-explain-link')).toHaveAttribute(
			'href',
			'/en/methodik/kiez-score'
		);
		await expect(page.getByTestId('bezirk-map-link').first()).toHaveAttribute(
			'href',
			/^\/en\/kiez\//
		);
		await expect(page.getByTestId('bezirk-kieze-link').first()).toHaveAttribute(
			'href',
			/^\/en\/kiez\//
		);
	});
});
