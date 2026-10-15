import { test, expect } from '@playwright/test';

test.describe('Indexierungs-Hygiene S1', () => {
	test('/hitze: Canonical und og:url sind absolut ohne Punkt-Artefakt', async ({
		page,
		baseURL
	}) => {
		await page.goto('/hitze');
		const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
		const ogUrl = await page.locator('meta[property="og:url"]').getAttribute('content');
		expect(canonical).toBe(`${baseURL}/hitze`);
		expect(ogUrl).toBe(canonical);
	});

	test('/en/hitze: Canonical auf /en/hitze', async ({ page, baseURL }) => {
		await page.goto('/en/hitze');
		await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
			'href',
			`${baseURL}/en/hitze`
		);
	});

	test('/explore?kiez=x liefert noindex, follow und Canonical /explore', async ({
		page,
		baseURL
	}) => {
		const response = await page.goto('/explore?kiez=x');
		expect(response?.headers()['x-robots-tag']).toBe('noindex, follow');
		await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
			'href',
			`${baseURL}/explore`
		);
	});

	test('/explore ohne Query bleibt indexierbar', async ({ page }) => {
		const response = await page.goto('/explore');
		expect(response?.headers()['x-robots-tag']).toBeUndefined();
	});

	test('Fehlerseite: 404 mit Titel und noindex', async ({ page }) => {
		const response = await page.goto('/gibtsnicht');
		expect(response?.status()).toBe(404);
		await expect(page).toHaveTitle('Seite nicht gefunden · navigator.berlin');
		await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
	});

	test('/demo liefert noindex', async ({ request }) => {
		const response = await request.get('/demo');
		expect(response.headers()['x-robots-tag']).toContain('noindex');
	});

	for (const path of ['/hitze', '/en/hitze', '/methodik', '/lizenzen']) {
		test(`${path}: JSON-LD ohne /./ oder /../`, async ({ page }) => {
			await page.goto(path);
			const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
			expect(blocks.length).toBeGreaterThan(0);
			for (const block of blocks) {
				expect(block).not.toContain('/./');
				expect(block).not.toContain('/../');
			}
		});
	}

	for (const [path, items] of [
		['/hitze', ['/', '/hitze']],
		['/en/hitze', ['/en', '/en/hitze']]
	] as const) {
		test(`${path}: Hitze-Breadcrumb-Items exakt`, async ({ page, baseURL }) => {
			await page.goto(path);
			const raw = await page.getByTestId('hitze-breadcrumb-jsonld').textContent();
			const data = JSON.parse(raw ?? '{}') as { itemListElement: { item: string }[] };
			expect(data.itemListElement.map((i) => i.item)).toEqual(items.map((p) => `${baseURL}${p}`));
		});
	}
});
