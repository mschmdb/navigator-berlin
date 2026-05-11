import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('Landing (Hero) hat 0 axe-Violations', async ({ page }) => {
	await page.goto('/');
	const results = await new AxeBuilder({ page })
		.withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
		.analyze();
	expect(results.violations).toEqual([]);
});

test('Wortmarke-Showcase (with-header) hat 0 axe-Violations', async ({ page }) => {
	await page.route('**/api/geocode**', (route) => route.fulfill({ json: { suggestions: [] } }));
	await page.route('**/_app/remote/**', (route) =>
		route.fulfill({ json: { type: 'result', result: [] } })
	);
	await page.goto('/_dev/wortmarke');
	const results = await new AxeBuilder({ page })
		.withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
		.analyze();
	expect(results.violations).toEqual([]);
});
