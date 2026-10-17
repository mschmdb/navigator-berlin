import { expect, test, type Page } from '@playwright/test';

// #91: Eine Adresswahl im Explorer legt einen History-Eintrag an. Back führt zur
// vorigen Adresse zurück statt aus /explore heraus. Einstieg per Deep-Link wie in
// i18n-inspector.e2e.ts; die zweite Adresse kommt per Karten-Klick.

const FIRST = { lng: 13.4541, lat: 52.5126, q: 'Boxhagener Straße 12, 10245 Berlin' };

async function waitForInspector(page: Page): Promise<void> {
	await page.locator('[data-testid="map-skeleton"]').waitFor({ state: 'detached', timeout: 30000 });
	await expect(page.getByTestId('inspector-panel')).toBeVisible({ timeout: 15000 });
}

// Schreibformat mit fünf Nachkommastellen; ein Deep-Link darf weniger Stellen tragen.
function addressParam(page: Page): string | null {
	const raw = new URL(page.url()).searchParams.get('address');
	if (!raw) return null;
	const [lng, lat] = raw.split(',').map((part) => Number.parseFloat(part));
	return `${lng!.toFixed(5)},${lat!.toFixed(5)}`;
}

test('Back nach einer neuen Adresswahl zeigt wieder die vorige Adresse', async ({ page }) => {
	const params = new URLSearchParams({ address: `${FIRST.lng},${FIRST.lat}`, q: FIRST.q });
	await page.goto(`/explore?${params.toString()}`);
	await waitForInspector(page);
	await expect(page.getByTestId('inspector-panel')).toHaveAttribute(
		'aria-label',
		new RegExp(FIRST.q)
	);
	const firstAddress = addressParam(page);
	expect(firstAddress).toBe('13.45410,52.51260');

	// Zweite Adresse per Klick neben den Pin: Berlin, aber andere Koordinate.
	const canvas = page.locator('canvas.maplibregl-canvas');
	const box = await canvas.boundingBox();
	if (!box) throw new Error('Karten-Canvas fehlt');
	await canvas.click({ position: { x: box.width * 0.3, y: box.height * 0.4 } });
	await expect.poll(() => addressParam(page), { timeout: 15000 }).not.toBe(firstAddress);
	await waitForInspector(page);

	await page.goBack();
	await expect.poll(() => addressParam(page), { timeout: 10000 }).toBe(firstAddress);
	expect(new URL(page.url()).pathname).toBe('/explore');
	await expect(page.getByTestId('inspector-panel')).toHaveAttribute(
		'aria-label',
		new RegExp(FIRST.q),
		{ timeout: 15000 }
	);
});

test('Karten-Bewegung legt keinen History-Eintrag an', async ({ page }) => {
	await page.goto('/lizenzen');
	const params = new URLSearchParams({ address: `${FIRST.lng},${FIRST.lat}`, q: FIRST.q });
	await page.goto(`/explore?${params.toString()}`);
	await waitForInspector(page);
	const zoomIn = page.getByRole('button', { name: 'Hineinzoomen' }).first();
	await zoomIn.click();
	await zoomIn.click();
	// Viewport-Sync ist auf 500 ms entprellt.
	await page.waitForTimeout(1200);
	await page.goBack();
	await expect(page).toHaveURL(/\/lizenzen$/, { timeout: 10000 });
});
