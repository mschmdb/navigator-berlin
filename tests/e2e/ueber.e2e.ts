import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

interface JsonLdNode {
	'@type'?: string;
	'@id'?: string;
	[key: string]: unknown;
}

async function jsonLdNodes(page: import('@playwright/test').Page): Promise<JsonLdNode[]> {
	const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
	return blocks.map((text) => JSON.parse(text) as JsonLdNode);
}

// Kanonische Origin: @id, hreflang und Sitemap zeigen unabhängig vom Testhost auf Produktion.
const CANONICAL = 'https://navigator.berlin';

const LOCALES = [
	{ path: '/ueber', h1: 'Über navigator.berlin', footer: 'Über das Projekt', lang: 'de-DE' },
	{ path: '/en/ueber', h1: 'About navigator.berlin', footer: 'About the project', lang: 'en-US' }
] as const;

for (const { path, h1, footer, lang } of LOCALES) {
	test.describe(path, () => {
		test('antwortet mit 200, hat eine H1 und ist indexierbar', async ({ page }) => {
			const response = await page.goto(path);
			expect(response?.status()).toBe(200);
			await expect(page.getByRole('heading', { level: 1 })).toHaveText(h1);
			await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
			await expect(page.locator('meta[name="robots"][content*="noindex"]')).toHaveCount(0);
		});

		test('Footer führt auf die Seite', async ({ page, baseURL }) => {
			await page.goto(path === '/ueber' ? '/methodik' : '/en/methodik');
			const link = page.getByTestId('meta-footer').last().getByRole('link', { name: footer });
			await expect(link).toHaveAttribute('href', path);
			await link.click();
			await expect(page).toHaveURL(`${baseURL}${path}`);
			await expect(page.getByRole('heading', { level: 1 })).toHaveText(h1);
		});

		test('JSON-LD: Graph AboutPage zu Organization zu Person, eindeutige @ids', async ({
			page
		}) => {
			await page.goto(path);
			const nodes = await jsonLdNodes(page);
			const about = nodes.find((n) => n['@type'] === 'AboutPage');
			expect(about?.['@id']).toBe(`${CANONICAL}${path}#about`);
			expect(about?.url).toBe(`${CANONICAL}${path}`);
			expect(about?.inLanguage).toBe(lang);
			expect((about?.about as JsonLdNode)['@id']).toBe(`${CANONICAL}/#organization`);
			const org = about?.mainEntity as JsonLdNode;
			expect(org['@id']).toBe(`${CANONICAL}/#organization`);
			const founder = org.founder as JsonLdNode;
			expect(founder['@type']).toBe('Person');
			expect(founder['@id']).toBe('https://schmidbauer.dev/#person');
			expect(founder.jobTitle).toBe('Solutions Architect');
			expect(founder.sameAs).toHaveLength(2);
			// Keine losen Knoten: jeder Block mit @id ist genau einmal vorhanden.
			const ids = nodes.map((n) => n['@id']).filter(Boolean);
			expect(new Set(ids).size).toBe(ids.length);
			expect(nodes.filter((n) => n['@type'] === 'Person')).toHaveLength(0);
		});

		test('hat 0 axe-Violations', async ({ page }) => {
			await page.goto(path);
			const results = await new AxeBuilder({ page })
				.withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
				.analyze();
			expect(results.violations).toEqual([]);
		});
	});
}

test('EN: hreflang-Cluster verbindet DE und EN', async ({ page }) => {
	await page.goto('/en/ueber');
	await expect(page.locator('link[rel="alternate"][hreflang="de"]')).toHaveAttribute(
		'href',
		`${CANONICAL}/ueber`
	);
	await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute(
		'href',
		`${CANONICAL}/en/ueber`
	);
});

test('Startseite: Organization verweist per founder auf die Person', async ({ page }) => {
	await page.goto('/');
	const org = (await jsonLdNodes(page)).find((n) => n['@type'] === 'Organization');
	const founder = org?.founder as JsonLdNode;
	expect(founder['@id']).toBe('https://schmidbauer.dev/#person');
	expect(founder).not.toHaveProperty('sameAs');
	expect(JSON.stringify(org?.sameAs)).not.toMatch(/linkedin|bsky/);
});

test('Sitemaps und llms.txt führen /ueber', async ({ request }) => {
	const de = await (await request.get('/sitemap-de.xml')).text();
	expect(de).toContain(`<loc>${CANONICAL}/ueber</loc>`);
	const en = await (await request.get('/sitemap-en.xml')).text();
	expect(en).toContain(`<loc>${CANONICAL}/en/ueber</loc>`);
	const llms = await (await request.get('/llms.txt')).text();
	expect(llms).toContain(`${CANONICAL}/ueber`);
});

test('Impressum nennt § 5 DDG', async ({ page }) => {
	await page.goto('/impressum');
	await expect(page.getByRole('heading', { name: 'Angaben gemäß § 5 DDG' })).toBeVisible();
});
