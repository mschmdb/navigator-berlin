import { expect, test } from '@playwright/test';

// #90: Die längsten Kiez- und Bezirksnamen dürfen die Textspalte neben der Lagekarte
// nicht überragen. Gemessen wird die H1 gegen ihre Spalte, nicht gegen das Fenster.
const KIEZE = [
	'nord-2-waidmannslust-wittenau-luebars',
	'blankenburg-heinersdorf-maerchenland',
	'west-3-borsigwalde-freie-scholle',
	'malchow-wartenberg-und-falkenberg',
	'koellnische-vorstadt-spindlersfeld',
	'west-2-heiligensee-konradshoehe',
	'west-1-tegel-sued-flughafensee',
	'schoenholz-wilhelmsruh-rosenthal',
	'west-4-auguste-viktoria-allee',
	'blankenfelde-niederschoenhausen',
	'otto-suhr-allee-kantstrasse'
];
const BEZIRKE = ['charlottenburg-wilmersdorf', 'friedrichshain-kreuzberg', 'tempelhof-schoeneberg'];
const VIEWPORTS = [
	{ width: 1440, height: 900 },
	{ width: 1024, height: 800 },
	{ width: 390, height: 844 }
];

const pages = [...KIEZE.map((s) => `/kiez/${s}`), ...BEZIRKE.map((s) => `/bezirk/${s}`)];

for (const viewport of VIEWPORTS) {
	test.describe(`Hero-Titel bei ${viewport.width} px`, () => {
		test.use({ viewport });

		for (const path of pages) {
			test(`${path} bleibt in der Spalte`, async ({ page }) => {
				await page.goto(path);
				const h1 = page.getByRole('heading', { level: 1 });
				await expect(h1).toBeVisible();
				const fit = await h1.evaluate((el) => {
					const column = el.parentElement as HTMLElement;
					const title = el.getBoundingClientRect();
					const box = column.getBoundingClientRect();
					return {
						overflow: el.scrollWidth - el.clientWidth,
						rightOverhang: title.right - box.right
					};
				});
				expect(fit.overflow).toBeLessThanOrEqual(0);
				expect(fit.rightOverhang).toBeLessThanOrEqual(0.5);
			});
		}
	});
}
