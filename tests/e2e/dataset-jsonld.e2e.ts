import { expect, test } from '@playwright/test';

const LAYER = 'laerm-2023';

test.describe('Dataset-JSON-LD (S4)', () => {
	test('Layer-Seite enthält die Felder für Google Dataset Search', async ({ page }) => {
		await page.goto(`/layer/${LAYER}`);
		const dataset = JSON.parse(
			(await page
				.locator('script[type="application/ld+json"][data-testid="layer-dataset-jsonld"]')
				.textContent()) ?? '{}'
		);
		expect(dataset.url).toMatch(new RegExp(`/layer/${LAYER}$`));
		expect(dataset.isAccessibleForFree).toBe(true);
		expect(dataset.includedInDataCatalog).toMatchObject({
			'@type': 'DataCatalog',
			'@id': 'https://navigator.berlin/lizenzen#catalog',
			url: 'https://navigator.berlin/lizenzen'
		});
		expect(dataset['@id']).toBe(`${dataset.url}#dataset`);
		expect(dataset.spatialCoverage?.geo?.box).toMatch(/^52\.\d+ 13\.\d+ 52\.\d+ 13\.\d+$/);
		expect(dataset.temporalCoverage).toBe('2023');
		expect(dataset.creator?.url).toMatch(/^https?:\/\//);
		expect(dataset.distribution?.contentUrl).toMatch(new RegExp(`/daten/${LAYER}\\.geojson$`));
	});

	test('Download-Route leitet auf die Hash-Datei weiter', async ({ request }) => {
		const res = await request.get(`/daten/${LAYER}.geojson`, { maxRedirects: 0 });
		expect(res.status()).toBe(302);
		expect(res.headers()['location']).toMatch(
			new RegExp(`^/layers/${LAYER}\\.[0-9a-f]+\\.geojson$`)
		);
	});

	test('Download-Route liefert 404 für unbekannten Slug', async ({ request }) => {
		const res = await request.get('/daten/gibt-es-nicht.geojson', { maxRedirects: 0 });
		expect(res.status()).toBe(404);
	});

	test('Lizenzen-Seite trägt die DataCatalog-@id', async ({ page }) => {
		await page.goto('/lizenzen');
		const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
		const catalog = scripts
			.map((t) => JSON.parse(t) as Record<string, unknown>)
			.find((j) => j['@type'] === 'DataCatalog');
		expect(catalog?.['@id']).toBe('https://navigator.berlin/lizenzen#catalog');
	});
});
