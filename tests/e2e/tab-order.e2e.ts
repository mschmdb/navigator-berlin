import { expect, test, type Page } from '@playwright/test';

test.beforeEach(async ({ page }) => {
	await page.route('**/api/geocode**', (route) => route.fulfill({ json: { suggestions: [] } }));
	await page.route('**/_app/remote/**', (route) =>
		route.fulfill({ json: { type: 'result', result: [] } })
	);
});

async function activeRole(page: Page): Promise<string | null> {
	return await page.evaluate(() => {
		const el = document.activeElement as HTMLElement | null;
		if (!el) return null;
		return el.getAttribute('role') ?? el.tagName.toLowerCase();
	});
}

async function activeLabel(page: Page): Promise<string> {
	return await page.evaluate(() => {
		const el = document.activeElement as HTMLElement | null;
		if (!el) return '';
		return (
			el.getAttribute('aria-label') ??
			el.getAttribute('aria-labelledby') ??
			el.textContent?.trim() ??
			''
		);
	});
}

test('SkipLink ist erstes fokussierbares Element', async ({ page }) => {
	await page.goto('/explore');
	await page.locator('[data-testid="map-skeleton"]').waitFor({ state: 'detached', timeout: 15000 });
	await page.keyboard.press('Tab');
	const label = await activeLabel(page);
	expect(label).toMatch(/Zum Hauptinhalt springen/i);
});

test('Tab-Reihenfolge: SkipLink → Logo → AddressSearch → Map-Container', async ({ page }) => {
	await page.goto('/explore');
	await page.locator('[data-testid="map-skeleton"]').waitFor({ state: 'detached', timeout: 15000 });

	await page.keyboard.press('Tab');
	expect(await activeLabel(page)).toMatch(/Zum Hauptinhalt springen/i);

	await page.keyboard.press('Tab');
	expect(await activeLabel(page)).toMatch(/navigator\.berlin Startseite/i);

	await page.keyboard.press('Tab');
	const searchActive = await page.evaluate(() => {
		const el = document.activeElement as HTMLElement | null;
		return el?.getAttribute('role') ?? el?.tagName.toLowerCase() ?? '';
	});
	expect(searchActive === 'combobox' || searchActive === 'input').toBeTruthy();

	let mapFound = false;
	for (let i = 0; i < 8 && !mapFound; i++) {
		await page.keyboard.press('Tab');
		const role = await activeRole(page);
		if (role === 'application') mapFound = true;
	}
	expect(mapFound).toBe(true);
});

test('Shift+Tab kehrt Reihenfolge um', async ({ page }) => {
	await page.goto('/explore');
	await page.locator('[data-testid="map-skeleton"]').waitFor({ state: 'detached', timeout: 15000 });
	await page.locator('[role="application"]').focus();
	await page.keyboard.press('Shift+Tab');
	const role = await activeRole(page);
	expect(role === 'combobox' || role === 'input' || role === 'a').toBeTruthy();
});

test('Map-Container ist via Tabindex erreichbar', async ({ page }) => {
	await page.goto('/explore');
	await page.locator('[data-testid="map-skeleton"]').waitFor({ state: 'detached', timeout: 15000 });
	const map = page.locator('[role="application"]');
	await map.focus();
	await expect(map).toBeFocused();
	expect(await map.getAttribute('tabindex')).toBe('0');
});

test('Keine tabindex>0 Hacks in DOM', async ({ page }) => {
	await page.goto('/explore');
	await page.locator('[data-testid="map-skeleton"]').waitFor({ state: 'detached', timeout: 15000 });
	const positives = await page.evaluate(() => {
		const all = Array.from(document.querySelectorAll('[tabindex]')) as HTMLElement[];
		return all
			.map((el) => Number(el.getAttribute('tabindex')))
			.filter((n) => Number.isFinite(n) && n > 0);
	});
	expect(positives).toEqual([]);
});
