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
					// Inhalt in einem eigenen Scroll-Container (z. B. breite Tabelle) ist erlaubt.
					const clipped = (el: Element) => {
						for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
							const ox = getComputedStyle(p).overflowX;
							if (ox === 'auto' || ox === 'scroll' || ox === 'hidden' || ox === 'clip') return true;
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
