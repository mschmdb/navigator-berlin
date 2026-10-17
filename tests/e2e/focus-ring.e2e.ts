// GH-86: Ein Fokus-Stil für alle Elemente. Die globale Regel in app.css zeichnet
// 2 px in --focus (#0030c8). Komponenten überschreiben sie nicht mehr.

import { expect, test } from '@playwright/test';

const FOCUS_RGB = 'rgb(0, 48, 200)';
const STEPS = 25;

for (const path of ['/kiez/suedliche-luisenstadt', '/hitze']) {
	test(`${path}: jedes per Tab erreichte Element zeigt den 2-px-Fokusring in --focus`, async ({
		page
	}) => {
		await page.goto(path);
		await page.waitForLoadState('networkidle');
		const wrong: string[] = [];
		for (let i = 0; i < STEPS; i++) {
			await page.keyboard.press('Tab');
			const info = await page.evaluate(() => {
				const el = document.activeElement as HTMLElement | null;
				if (!el || el === document.body) return null;
				const s = getComputedStyle(el);
				return {
					label: `${el.tagName.toLowerCase()} „${(el.getAttribute('aria-label') ?? el.textContent ?? '').trim().slice(0, 30)}“`,
					style: s.outlineStyle,
					width: s.outlineWidth,
					color: s.outlineColor
				};
			});
			if (!info) continue;
			if (info.style !== 'solid' || info.width !== '2px' || info.color !== FOCUS_RGB) {
				wrong.push(`${info.label}: ${info.style} ${info.width} ${info.color}`);
			}
		}
		expect(wrong.join('\n')).toBe('');
	});
}

test('summary zeigt den Fokusring', async ({ page }) => {
	await page.goto('/kiez/suedliche-luisenstadt');
	const summary = page.locator('summary').first();
	await summary.focus();
	await page.keyboard.press('Shift+Tab');
	await page.keyboard.press('Tab');
	const style = await summary.evaluate((el) => {
		const s = getComputedStyle(el);
		return `${s.outlineStyle} ${s.outlineWidth} ${s.outlineColor}`;
	});
	expect(style).toBe(`solid 2px ${FOCUS_RGB}`);
});
