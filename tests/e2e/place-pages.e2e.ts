import { AxeBuilder } from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/**
 * Smoke-Tests der Kiez- und Bezirksseiten nach Themen (NAV-105): Kapitel, SEO-Rahmen,
 * Verlinkung, Vergleich, Server-Rendering ohne JavaScript und axe.
 */

const PAGES = [
	{ path: '/kiez/reuterstrasse', h1: 'Reuterstraße', lang: 'de' },
	{ path: '/bezirk/neukoelln', h1: 'Neukölln', lang: 'de' },
	{ path: '/en/kiez/reuterstrasse', h1: 'Reuterstraße', lang: 'en' }
] as const;

const CHAPTERS = ['laerm', 'gruen', 'wohnen', 'unterwegs', 'versorgung', 'menschen', 'wahlen'];

/** SvelteKit schreibt relative hrefs („../kiez/x“); verglichen wird der aufgelöste Pfad mit Anker. */
async function linkPaths(page: Page, selector: string): Promise<string[]> {
	return page
		.locator(selector)
		.evaluateAll((as) =>
			as.map((a) => {
				const u = new URL((a as HTMLAnchorElement).href);
				return u.origin === location.origin ? `${u.pathname}${u.search}${u.hash}` : '';
			})
		)
		.then((xs) => xs.filter(Boolean));
}

async function jsonLdTypes(page: Page): Promise<unknown[]> {
	const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
	return blocks.map((b) => JSON.parse(b) as unknown);
}

for (const p of PAGES) {
	test.describe(p.path, () => {
		test('zeigt Titel, alle Kapitel, Überblick, Nachbarn und Fragen', async ({ page }) => {
			const res = await page.goto(p.path);
			expect(res?.status()).toBe(200);
			await expect(page.getByRole('heading', { level: 1 })).toContainText(p.h1);
			for (const id of [...CHAPTERS, 'nachbarn', 'ueberblick', 'fragen']) {
				await expect(page.locator(`section[id="${id}"]`)).toHaveCount(1);
			}
		});

		test('SEO: canonical auf sich selbst, kein noindex, JSON-LD passt zur sichtbaren FAQ', async ({
			page
		}) => {
			await page.goto(p.path);
			await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
				'href',
				new RegExp(`${p.path.replace(/\//g, '\\/')}$`)
			);
			await expect(page.locator('meta[name="robots"][content*="noindex"]')).toHaveCount(0);
			await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveCount(1);
			const data = JSON.stringify(await jsonLdTypes(page));
			expect(data).toContain('"AdministrativeArea"');
			expect(data).toContain('"BreadcrumbList"');
			const faq = (await jsonLdTypes(page)).find(
				(d) => (d as { '@type'?: string })['@type'] === 'FAQPage'
			) as { mainEntity: { name: string }[] } | undefined;
			expect(faq).toBeDefined();
			const visible = await page.locator('section[id="fragen"] summary').allInnerTexts();
			expect(faq?.mainEntity.map((q) => q.name)).toEqual(
				visible.map((t) => t.replace(/^[›\s]+/, '').trim())
			);
		});

		test('interne Links bleiben in der Seitensprache', async ({ page }) => {
			await page.goto(p.path);
			const hrefs = (await linkPaths(page, 'main a[href]')).filter(
				(h) => !h.startsWith(p.path + '#')
			);
			expect(hrefs.length).toBeGreaterThan(10);
			const own = p.path.replace(/^\/en/, '');
			const wrong = hrefs.filter((h) =>
				p.lang === 'en' ? !h.startsWith('/en') && h.split('#')[0] !== own : h.startsWith('/en/')
			);
			expect(wrong).toEqual([]);
		});

		test('0 axe-Violations', async ({ page }) => {
			await page.goto(p.path);
			await expect(page.locator('section[id="fragen"]')).toBeAttached();
			const results = await new AxeBuilder({ page })
				.withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
				.analyze();
			expect(results.violations).toEqual([]);
		});
	});
}

test.describe('ohne JavaScript', () => {
	test.use({ javaScriptEnabled: false });
	test('Server liefert Kapiteltexte, Tabellen und FAQ', async ({ page }) => {
		await page.goto('/kiez/reuterstrasse');
		await expect(page.getByRole('heading', { level: 1 })).toContainText('Reuterstraße');
		await expect(page.locator('section[id="laerm"]')).toContainText('Verkehrslärm');
		await expect(page.locator('section[id="laerm"]')).toContainText('%');
		await expect(page.locator('section[id="wahlen"]')).toContainText('stärkste Kraft');
		await expect(page.locator('section[id="fragen"] details')).not.toHaveCount(0);
	});
});

test.describe('Kiezseite', () => {
	test('Eyebrow und Weiter-Links führen auf den Bezirk und seinen Abschnitt auf /kieze', async ({
		page
	}) => {
		await page.goto('/kiez/reuterstrasse');
		const paths = await linkPaths(page, 'main a[href]');
		expect(paths).toContain('/bezirk/neukoelln');
		expect(paths).toContain('/kieze#bezirk-neukoelln');
		expect(paths).toContain('/kiez-score');
		expect(paths).toContain('/methodik/kiez-score');
	});

	test('Nachbarn: Klick öffnet die Kiezseite des Nachbarn', async ({ page }) => {
		await page.goto('/kiez/reuterstrasse');
		const links = page.getByTestId('place-neighbor-link');
		expect(await links.count()).toBeGreaterThanOrEqual(3);
		const [href] = await linkPaths(page, '[data-testid="place-neighbor-link"]');
		expect(href).toMatch(/^\/kiez\/[a-z0-9-]+$/);
		await links.first().click();
		await expect(page).toHaveURL(new RegExp(`${href}$`));
		await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
	});

	test('Kartenlink im Kapitel öffnet den Atlas mit Layer und Ort', async ({ page }) => {
		await page.goto('/kiez/reuterstrasse');
		const [href] = (await linkPaths(page, 'section[id="gruen"] a[href]')).filter((h) =>
			h.startsWith('/explore?')
		);
		expect(href).toMatch(/layers=.+&address=[\d.]+%2C[\d.]+&q=Reuterstra/);
	});

	test('Vergleich mit dem Bezirk schreibt die URL und den Kapiteltext um', async ({ page }) => {
		await page.setViewportSize({ width: 1440, height: 900 });
		await page.goto('/kiez/reuterstrasse');
		// Erst nach der Hydration hört die Auswahl zu.
		await page.waitForLoadState('networkidle');
		await page.locator('[aria-controls="place-compare-panel"]').click();
		await page.locator('fieldset label', { hasText: /^\s*Neukölln\s*$/ }).click();
		await expect(page).toHaveURL(/vs=bezirk/);
		await expect(page.locator('section[id="laerm"]')).toContainText('Neukölln gesamt');
	});

	test('Dublette heerstrasse-spandau gehört zu Spandau', async ({ page }) => {
		await page.goto('/kiez/heerstrasse-spandau');
		expect(await linkPaths(page, 'main a[href]')).toContain('/bezirk/spandau');
	});

	test('nur die Kapitelleiste bleibt stehen, höchstens 56 px', async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 844 });
		await page.goto('/kiez/reuterstrasse');
		await page.locator('section[id="gruen"]').scrollIntoViewIfNeeded();
		await page.evaluate(() => window.scrollBy(0, 400));
		const covered = await page.evaluate(() =>
			[...document.querySelectorAll('body *')]
				.filter((e) => ['sticky', 'fixed'].includes(getComputedStyle(e).position))
				.map((e) => e.getBoundingClientRect())
				.filter((r) => r.top <= 0 && r.bottom > 0)
				.reduce((h, r) => Math.max(h, r.bottom), 0)
		);
		expect(covered).toBeLessThanOrEqual(56);
	});

	test('375 px: kein horizontaler Überlauf', async ({ page }) => {
		await page.setViewportSize({ width: 375, height: 800 });
		await page.goto('/kiez/reuterstrasse');
		const overflow = await page.evaluate(
			() => document.documentElement.scrollWidth - document.documentElement.clientWidth
		);
		expect(overflow).toBeLessThanOrEqual(0);
	});
});

test.describe('Bezirksseite', () => {
	test('listet alle Kieze des Bezirks als Links', async ({ page }) => {
		await page.goto('/bezirk/neukoelln');
		const hrefs = (await linkPaths(page, 'section[id="nachbarn"] a[href]')).filter((h) =>
			h.startsWith('/kiez/')
		);
		expect(new Set(hrefs).size).toBe(12);
		await expect(page.getByTestId('overview-link-bezirke')).toHaveAttribute('href', '/bezirke');
	});
});
