// GH-86: Klickziele mindestens 24 × 24 CSS-Pixel (WCAG 2.2 SC 2.5.8, Leitlinie 23).
// Gemessen werden Block-Ziele. Links im Fließtext sind nach SC 2.5.8 ausgenommen.

import { expect, test, type Page } from '@playwright/test';

const MIN = 24;

const PAGES: readonly { name: string; path: string }[] = [
	{ name: 'Startseite', path: '/' },
	{
		name: 'Explore mit Inspector',
		path: '/explore?address=13.42705,52.49755&q=Wiener%20Stra%C3%9Fe%2020'
	},
	{ name: 'Kiez', path: '/kiez/suedliche-luisenstadt' },
	{ name: 'Hitze', path: '/hitze' },
	{ name: 'Wahlen', path: '/berlin-wahlen' }
];

const VIEWPORTS = [
	{ name: 'Desktop', width: 1440, height: 900 },
	{ name: 'Mobil', width: 390, height: 844 }
] as const;

interface Small {
	label: string;
	width: number;
	height: number;
}

async function smallTargets(page: Page): Promise<Small[]> {
	return page.evaluate((min) => {
		const selector =
			'a[href], button, summary, select, input:not([type="hidden"]), [role="button"], [role="tab"], [role="switch"], [role="checkbox"]';
		const out: { label: string; width: number; height: number }[] = [];

		const isInlineTextLink = (el: Element): boolean => {
			if (el.tagName !== 'A') return false;
			if (getComputedStyle(el).display !== 'inline') return false;
			const parent = el.parentElement;
			if (!parent) return false;
			const own = (el.textContent ?? '').trim().length;
			const around = (parent.textContent ?? '').trim().length;
			return around > own;
		};

		const isHidden = (el: Element): boolean => {
			const style = getComputedStyle(el);
			if (style.visibility === 'hidden' || style.display === 'none') return true;
			if (el.closest('[aria-hidden="true"], [inert], .sr-only')) return true;
			// sr-only und ähnliche Clip-Muster
			const rect = el.getBoundingClientRect();
			return rect.width <= 1 || rect.height <= 1;
		};

		for (const el of document.querySelectorAll(selector)) {
			if (isHidden(el) || isInlineTextLink(el)) continue;
			// Fremd-Controls der Kartenbibliothek: deren Größe steuern wir nicht.
			if (el.closest('.maplibregl-ctrl-attrib')) continue;
			const rect = el.getBoundingClientRect();
			if (rect.width < min || rect.height < min) {
				const label =
					el.getAttribute('aria-label') ??
					el.getAttribute('data-testid') ??
					(el.textContent ?? '').trim().slice(0, 40) ??
					el.tagName;
				out.push({
					label: `${el.tagName.toLowerCase()} „${label}“`,
					width: Math.round(rect.width),
					height: Math.round(rect.height)
				});
			}
		}
		return out;
	}, MIN);
}

for (const vp of VIEWPORTS) {
	test.describe(`GH-86 Klickziele ${vp.name}`, () => {
		test.use({ viewport: { width: vp.width, height: vp.height } });

		for (const p of PAGES) {
			test(`${p.name}: alle Block-Ziele mindestens ${MIN} px`, async ({ page }) => {
				await page.goto(p.path);
				await page.waitForLoadState('networkidle');
				const small = await smallTargets(page);
				const report = small.map((s) => `${s.label} ${s.width}×${s.height}`).join('\n');
				expect(report).toBe('');
			});
		}
	});
}
