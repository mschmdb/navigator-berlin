import { expect, test } from '@playwright/test';

// #105: Leseseiten mit Code-Bezeichnern dürfen auf schmalen Bildschirmen nicht
// horizontal überlaufen (WCAG 1.4.10 Reflow). Gemessen wird die ganze Seite.
const PAGES = [
	'/webmcp',
	'/en/webmcp',
	'/architektur',
	'/en/architektur',
	'/methodik',
	'/methodik/kiez-score',
	'/methodik/wahldaten',
	'/layer/bodenrichtwerte'
];
const VIEWPORTS = [
	{ width: 390, height: 844 },
	{ width: 320, height: 640 }
];

for (const viewport of VIEWPORTS) {
	test.describe(`Leseseiten bei ${viewport.width} px`, () => {
		test.use({ viewport });

		for (const path of PAGES) {
			test(`${path} läuft nicht horizontal über`, async ({ page }) => {
				await page.goto(path, { waitUntil: 'networkidle' });
				await expect(page.locator('main').last()).toBeVisible();
				// Die WebMCP-Diagnose rendert ihre Tabelle erst nach dem Mount.
				await expect(page.getByTestId('webmcp-diagnose-laedt')).toHaveCount(0);
				const result = await page.evaluate(() => {
					const root = document.documentElement;
					// Ausnahme laut WCAG 1.4.10: Datentabellen in einem eigenen Scroll-Container.
					// Abgeschnittener Text (overflow hidden/clip) zählt dagegen als Fehler.
					const clipped = (el: Element) => {
						for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
							const ox = getComputedStyle(p).overflowX;
							if ((ox === 'auto' || ox === 'scroll') && p.querySelector('table')) return true;
						}
						return false;
					};
					const widest = [...document.querySelectorAll('main *')]
						.map((el) => ({ el, right: el.getBoundingClientRect().right }))
						.filter(({ el, right }) => right > root.clientWidth + 0.5 && !clipped(el))
						.slice(0, 3)
						.map(({ el, right }) => `${el.tagName.toLowerCase()} ${Math.round(right)}px`);
					return { overflow: root.scrollWidth - root.clientWidth, widest };
				});
				expect(result.widest, `überstehende Elemente: ${result.widest.join(', ')}`).toEqual([]);
				expect(result.overflow).toBeLessThanOrEqual(0);
			});
		}
	});
}

test.describe('Definitionslisten ab sm', () => {
	test.use({ viewport: { width: 1024, height: 800 } });

	for (const path of ['/methodik', '/layer/bodenrichtwerte']) {
		test(`${path} zeigt Begriff und Wert nebeneinander`, async ({ page }) => {
			await page.goto(path, { waitUntil: 'networkidle' });
			const dt = page.locator('main dl.definition-grid dt').first();
			const dd = page.locator('main dl.definition-grid dd').first();
			const [t, d] = [await dt.boundingBox(), await dd.boundingBox()];
			expect(t && d).toBeTruthy();
			expect(Math.abs(t!.y - d!.y)).toBeLessThan(4);
			expect(d!.x).toBeGreaterThan(t!.x + t!.width);
		});
	}
});
