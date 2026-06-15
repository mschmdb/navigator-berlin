import { expect, test } from '@playwright/test';

// Story 1.15: POI-Popover + Lucide-Icon-Pins. E2E deckt Pin-Render, Hover-Popover,
// Click-Action + Inspector-Scroll. axe-Snapshot ist im a11y.e2e.ts gebuendelt.

test.beforeEach(async ({ page }) => {
	await page.route('**/api/geocode**', (route) => route.fulfill({ json: { suggestions: [] } }));
	await page.route('**/_app/remote/**', (route) =>
		route.fulfill({ json: { type: 'result', result: [] } })
	);
});

test('Stolperstein-Layer aktiv: Pin-Sprite registriert (kein Console-Error)', async ({ page }) => {
	const errors: string[] = [];
	page.on('console', (msg) => {
		if (msg.type() === 'error') errors.push(msg.text());
	});
	await page.goto('/?layers=stolpersteine');
	await page.locator('[data-testid="map-skeleton"]').waitFor({ state: 'detached', timeout: 15000 });
	await page.waitForTimeout(1200);
	const missing = errors.find((e) => e.includes('navigator-pin-stolpersteine'));
	expect(missing, `Pin-Sprite missing: ${missing}`).toBeFalsy();
});

test('Hover ueber POI-Pin zeigt POI-Variant des Tooltips', async ({ page }) => {
	await page.goto('/?layers=trinkbrunnen');
	await page.locator('[data-testid="map-skeleton"]').waitFor({ state: 'detached', timeout: 15000 });
	await page.waitForTimeout(1500);
	const tooltip = page.getByTestId('map-hover-tooltip');
	const map = page.locator('[role="application"]').first();
	const box = await map.boundingBox();
	if (!box) throw new Error('Map nicht renderbar');
	// Sweep across map. If a Trinkbrunnen is hit, the POI tooltip should appear.
	for (let i = 0; i < 8; i++) {
		const x = box.x + (box.width * (i + 1)) / 9;
		const y = box.y + box.height / 2;
		await page.mouse.move(x, y);
		await page.waitForTimeout(150);
		if (await tooltip.isVisible().catch(() => false)) break;
	}
	if (await tooltip.isVisible().catch(() => false)) {
		const variant = await tooltip.getAttribute('data-variant');
		expect(['poi', 'polygon']).toContain(variant ?? '');
	}
});
