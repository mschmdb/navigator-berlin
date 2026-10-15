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

	for (const { route, lang } of [
		{ route: '/', lang: 'de-DE' },
		{ route: '/en', lang: 'en-US' }
	]) {
		test(`${route}: genau ein WebSite-Block ohne SearchAction, publisher verweist auf Organization`, async ({
			page
		}) => {
			await page.goto(route);
			const blocks = (
				await page.locator('script[type="application/ld+json"]').allTextContents()
			).map((text) => JSON.parse(text) as Record<string, unknown>);
			const websites = blocks.filter((b) => b['@type'] === 'WebSite');
			expect(websites).toHaveLength(1);
			expect(websites[0].potentialAction).toBeUndefined();
			expect(websites[0].inLanguage).toBe(lang);
			const orgs = blocks.filter((b) => b['@type'] === 'Organization');
			expect(orgs).toHaveLength(1);
			expect(String(orgs[0]['@id'])).toMatch(/^https?:\/\/[^/]+\/#organization$/);
			expect(websites[0].publisher).toMatchObject({
				'@id': orgs[0]['@id'],
				'@type': 'Organization',
				name: 'navigator.berlin'
			});
			expect(JSON.stringify(orgs[0].logo)).toContain('/logo-organization.png');
		});
	}

	test('/kiez/reuterstrasse: genau eine AdministrativeArea mit @id und Verweis auf den Bezirk', async ({
		page
	}) => {
		await page.goto('/kiez/reuterstrasse');
		const blocks = (await page.locator('script[type="application/ld+json"]').allTextContents()).map(
			(text) => JSON.parse(text) as Record<string, unknown>
		);
		expect(blocks.filter((b) => b['@type'] === 'Place')).toHaveLength(0);
		const areas = blocks.filter((b) => b['@type'] === 'AdministrativeArea');
		expect(areas).toHaveLength(1);
		expect(areas[0]['@id']).toMatch(/\/kiez\/reuterstrasse#place$/);
		const parent = areas[0].containedInPlace as { '@id': string; url: string };
		expect(parent['@id']).toMatch(/\/bezirk\/neukoelln#place$/);
		expect(parent['@id']).toBe(`${parent.url}#place`);
	});

	test('/bezirk/pankow: eine AdministrativeArea mit @id und Wikidata-sameAs', async ({ page }) => {
		await page.goto('/bezirk/pankow');
		const blocks = (await page.locator('script[type="application/ld+json"]').allTextContents()).map(
			(text) => JSON.parse(text) as Record<string, unknown>
		);
		const areas = blocks.filter((b) => b['@type'] === 'AdministrativeArea');
		expect(areas).toHaveLength(1);
		expect(areas[0]['@id']).toMatch(/\/bezirk\/pankow#place$/);
		expect(JSON.stringify(areas[0].sameAs)).toContain('wikidata.org');
	});
});
