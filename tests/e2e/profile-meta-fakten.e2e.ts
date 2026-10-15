import { expect, test, type Page } from '@playwright/test';

// L3: Title und Description nennen Einwohner, Fläche, Stichtag (DE und EN).

async function description(page: Page): Promise<string> {
	const content = await page.locator('meta[name="description"]').getAttribute('content');
	if (content === null) throw new Error('meta description fehlt');
	return content;
}

test.describe('L3: Bezirk-Meta mit Fakten', () => {
	test('DE: Title mit Einwohnern und km², Description beginnt mit Antwortsatz', async ({
		page
	}) => {
		await page.goto('/bezirk/friedrichshain-kreuzberg');
		await expect(page).toHaveTitle(
			/^Friedrichshain-Kreuzberg: [\d.]+ Einwohner:innen, \d+,\d km²$/
		);
		expect(await description(page)).toMatch(
			/^Friedrichshain-Kreuzberg hat [\d.]+ Einwohner:innen auf \d+,\d km² \(Stand Ende \d{4}\)\./
		);
	});

	test('EN: Zahlen englisch formatiert', async ({ page }) => {
		await page.goto('/en/bezirk/friedrichshain-kreuzberg');
		await expect(page).toHaveTitle(/^Friedrichshain-Kreuzberg: [\d,]+ residents, \d+\.\d km²$/);
	});
});

test.describe('L3: Kiez-Meta mit Fakten', () => {
	test('DE: Title mit Bezirk und Einwohnern', async ({ page }) => {
		await page.goto('/kiez/alexanderplatz');
		await expect(page).toHaveTitle(/^Alexanderplatz \(Mitte\): [\d.]+ Einwohner:innen/);
		expect(await description(page)).toMatch(/^Alexanderplatz hat [\d.]+ Einwohner:innen auf/);
	});

	test('EN: Title englisch', async ({ page }) => {
		await page.goto('/en/kiez/alexanderplatz');
		await expect(page).toHaveTitle(/^Alexanderplatz \(Mitte\): [\d,]+ residents/);
	});

	// Score und Rang stehen nur in DB-Builds im Meta; die Logik decken die Unit-Tests ab.
	test('Description bleibt unter 160 Zeichen', async ({ page }) => {
		await page.goto('/kiez/alexanderplatz');
		const text = await description(page);
		expect(text.length).toBeLessThanOrEqual(160);
	});
});
