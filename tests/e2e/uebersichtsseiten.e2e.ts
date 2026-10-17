import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const readJson = <T>(relative: string): T =>
	JSON.parse(readFileSync(resolve(process.cwd(), relative), 'utf-8')) as T;

const composites = readJson<{
	kiez: Record<string, number | null>;
	bezirk: Record<string, number | null>;
}>('static/kiez-scores/region-composites.json');
const KIEZ_COUNT = Object.keys(composites.kiez).length;
const BEZIRK_COUNT = Object.keys(composites.bezirk).length;
const KIEZ_WITH_SCORE = Object.values(composites.kiez).filter((v) => v !== null).length;

const detailLayerSlugs = readJson<{
	layers: { slug: string; inspectorRelevant?: boolean; mapRelevant?: boolean }[];
}>('static/layers/MANIFEST.json')
	.layers.filter((l) => !(l.inspectorRelevant === false && l.mapRelevant === false))
	.map((l) => l.slug);

const PAGES = [
	{ path: '/kieze', h1: 'Alle Kieze in Berlin', enH1: 'All Kieze in Berlin' },
	{ path: '/bezirke', h1: 'Alle Bezirke in Berlin', enH1: 'All Bezirke in Berlin' },
	{ path: '/daten', h1: 'Daten-Layer', enH1: 'Data layers' }
] as const;

test.describe('Übersichtsseiten (S7)', () => {
	for (const { path, h1, enH1 } of PAGES) {
		test(`${path}: 200 HTML mit genau einer h1, Titel und Canonical`, async ({ request, page }) => {
			const res = await request.get(path);
			expect(res.status()).toBe(200);
			expect(res.headers()['content-type']).toContain('text/html');

			await page.goto(path);
			await expect(page.locator('h1')).toHaveCount(1);
			await expect(page.locator('h1')).toHaveText(h1);
			await expect(page).toHaveTitle(/\| navigator\.berlin$/);
			await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
				'href',
				`https://navigator.berlin${path}`
			);
		});

		test(`/en${path}: englische h1, noindex fehlt, hreflang-Cluster`, async ({ page }) => {
			await page.goto(`/en${path}`);
			await expect(page.locator('h1')).toHaveText(enH1);
			await expect(page.locator('meta[name="robots"][content*="noindex"]')).toHaveCount(0);
			await expect(page.locator('link[rel="alternate"][hreflang="de"]')).toHaveAttribute(
				'href',
				`https://navigator.berlin${path}`
			);
			await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute(
				'href',
				`https://navigator.berlin/en${path}`
			);
		});

		test(`${path}: Meta-Description 70 bis 160 Zeichen in DE und EN`, async ({ page }) => {
			for (const url of [path, `/en${path}`]) {
				await page.goto(url);
				const description = await page.locator('meta[name="description"]').getAttribute('content');
				expect(description?.length, url).toBeGreaterThanOrEqual(70);
				expect(description?.length, url).toBeLessThanOrEqual(160);
			}
		});

		test(`${path}: 0 axe-Violations (DE und EN)`, async ({ page }) => {
			for (const url of [path, `/en${path}`]) {
				await page.goto(url);
				const results = await new AxeBuilder({ page })
					.withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
					.analyze();
				expect(results.violations, url).toEqual([]);
			}
		});
	}

	test('/kieze: alle Kiez-Links in allen Bezirks-Gruppen', async ({ page }) => {
		await page.goto('/kieze');
		await expect(page.locator('article h2')).toHaveCount(BEZIRK_COUNT);
		await expect(page.getByTestId('kiez-overview-item')).toHaveCount(KIEZ_COUNT);
		const hrefs = await page
			.getByTestId('kiez-overview-item')
			.locator('a')
			.evaluateAll((els) => els.map((el) => el.getAttribute('href')));
		expect(new Set(hrefs).size).toBe(KIEZ_COUNT);
		expect(hrefs.every((h) => h?.startsWith('/kiez/'))).toBe(true);
	});

	test('/kieze: Scores entsprechen der Composite-Datei', async ({ page }) => {
		await page.goto('/kieze');
		const items = page.getByTestId('kiez-overview-item');
		await expect(items.filter({ hasText: /Kiez-Score \d+ von 100/ })).toHaveCount(KIEZ_WITH_SCORE);
		await expect(items.filter({ hasText: 'ohne Score' })).toHaveCount(KIEZ_COUNT - KIEZ_WITH_SCORE);
	});

	test('/kieze: Zuordnung zu Bezirken und Sprunglinks', async ({ page }) => {
		await page.goto('/kieze');
		const mitte = page.locator('section#bezirk-mitte');
		await expect(mitte.locator('a[href="/kiez/moabit-west"]')).toHaveCount(1);
		await expect(page.locator('section#bezirk-spandau a[href="/kiez/moabit-west"]')).toHaveCount(0);
		const sections = page.locator('article section');
		for (let i = 0; i < (await sections.count()); i++) {
			expect(await sections.nth(i).locator('li').count(), `Bezirk ${i}`).toBeGreaterThan(0);
		}
		const targets = await page
			.locator('nav a[href^="#bezirk-"]')
			.evaluateAll((els) => els.map((el) => el.getAttribute('href')!.slice(1)));
		expect(targets).toHaveLength(BEZIRK_COUNT);
		for (const id of targets) await expect(page.locator(`section[id="${id}"]`)).toHaveCount(1);
	});

	test('/en/kieze: Kiez-Links tragen /en', async ({ page }) => {
		await page.goto('/en/kieze');
		await expect(page.getByTestId('kiez-overview-item')).toHaveCount(KIEZ_COUNT);
		const hrefs = await page
			.getByTestId('kiez-overview-item')
			.locator('a')
			.evaluateAll((els) => els.map((el) => el.getAttribute('href')));
		expect(hrefs.every((h) => h?.startsWith('/en/kiez/'))).toBe(true);
	});

	test('/bezirke: alle Bezirke mit Einwohnerzahl und Score', async ({ page }) => {
		await page.goto('/bezirke');
		const items = page.getByTestId('bezirk-overview-item');
		await expect(items).toHaveCount(BEZIRK_COUNT);
		await expect(items.filter({ hasText: 'Einwohner:innen' })).toHaveCount(BEZIRK_COUNT);
		await expect(items.filter({ hasText: /Kiez-Score\s*\d+ von 100/ })).toHaveCount(BEZIRK_COUNT);
	});

	test('/daten: Layer-Links entsprechen exakt den Layern mit Detailseite', async ({ page }) => {
		await page.goto('/daten');
		await expect(page.locator('article h2')).not.toHaveCount(0);
		const hrefs = await page
			.getByTestId('layer-overview-item')
			.locator('a')
			.evaluateAll((els) => els.map((el) => el.getAttribute('href')));
		expect([...hrefs].sort()).toEqual(detailLayerSlugs.map((slug) => `/layer/${slug}`).sort());
	});

	test('Layer-Seite: Breadcrumb-JSON-LD "Daten" zeigt auf /daten', async ({ page }) => {
		await page.goto('/layer/laerm-2023');
		const json = JSON.parse(
			(await page
				.locator('script[type="application/ld+json"][data-testid="layer-breadcrumb-jsonld"]')
				.textContent()) ?? '{}'
		) as { itemListElement: { name: string; item: string }[] };
		expect(json.itemListElement[1]).toMatchObject({
			name: 'Daten-Layer',
			item: 'https://navigator.berlin/daten'
		});
	});

	test('Footer "Erkunden" endet mit den drei Übersichtsseiten', async ({ page }) => {
		await page.goto('/methodik');
		const footer = page.getByTestId('meta-footer').first();
		for (const href of ['/kieze', '/bezirke', '/daten']) {
			await expect(footer.locator(`a[href="${href}"]`)).toHaveCount(1);
		}
		await page.goto('/en/methodik');
		const enFooter = page.getByTestId('meta-footer').first();
		for (const href of ['/en/kieze', '/en/bezirke', '/en/daten']) {
			await expect(enFooter.locator(`a[href="${href}"]`)).toHaveCount(1);
		}
	});

	test('Sitemaps listen die drei Seiten ohne lastmod', async ({ request }) => {
		const de = await (await request.get('/sitemap-de.xml')).text();
		const en = await (await request.get('/sitemap-en.xml')).text();
		const urlBlock = (xml: string, loc: string): string =>
			xml.split('<url>').find((block) => block.includes(`<loc>${loc}</loc>`)) ?? '';
		for (const path of ['/kieze', '/bezirke', '/daten']) {
			const block = urlBlock(de, `https://navigator.berlin${path}`);
			expect(block, path).not.toBe('');
			expect(block).not.toContain('<lastmod>');
			expect(urlBlock(en, `https://navigator.berlin/en${path}`), `/en${path}`).not.toBe('');
		}
		expect(de).not.toContain('/daten/laerm');
	});

	test('llms.txt führt die drei Seiten', async ({ request }) => {
		const text = await (await request.get('/llms.txt')).text();
		for (const path of ['/kieze', '/bezirke', '/daten']) {
			expect(text).toContain(`https://navigator.berlin${path}`);
		}
	});

	test('Download-Redirect /daten/<datei> bleibt neben /daten bestehen', async ({ request }) => {
		const res = await request.get('/daten/laerm-2023.geojson', { maxRedirects: 0 });
		expect(res.status()).toBe(302);
		expect(res.headers()['location']).toMatch(/^\/layers\/laerm-2023\.[0-9a-f]+\.geojson$/);
		const en = await request.get('/en/daten/laerm-2023.geojson', { maxRedirects: 0 });
		expect(en.status()).toBe(302);
		const unknown = await request.get('/daten/gibt-es-nicht.geojson', { maxRedirects: 0 });
		expect(unknown.status()).toBe(404);
	});
});
