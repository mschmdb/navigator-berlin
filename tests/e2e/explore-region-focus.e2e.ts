import { expect, test, type Page } from '@playwright/test';

const SUGGESTION = {
	id: 'way-100001',
	displayName: 'Boxhagener Straße 12, Friedrichshain-Kreuzberg, Berlin',
	lat: 52.5111,
	lng: 13.4544,
	type: 'house',
	addresstype: 'house',
	bezirk: 'Friedrichshain-Kreuzberg',
	postcode: '10245'
};

test.beforeEach(async ({ page }) => {
	await page.route('**/api/geocode**', (route) =>
		route.fulfill({ json: { suggestions: [SUGGESTION] } })
	);
	await page.route('**/_app/remote/**', (route) =>
		route.fulfill({ json: { type: 'result', result: [SUGGESTION] } })
	);
});

async function mapReady(page: Page): Promise<void> {
	await page.locator('[data-testid="map-skeleton"]').waitFor({ state: 'detached', timeout: 15000 });
}

test('Kiez-Fokus: Karte, Ansage, Score mit Rang, teilbare URL', async ({ page }) => {
	await page.goto('/explore?kiez=reuterstrasse');
	await mapReady(page);
	const card = page.getByTestId('region-focus-card');
	await expect(card).toBeVisible({ timeout: 10000 });
	await expect(page.getByTestId('region-focus-name')).toHaveText('Reuterstraße');
	await expect(page.getByTestId('region-focus-bezirk')).toHaveText('Neukölln');
	await expect(page.getByTestId('region-focus-score')).toContainText(/Platz \d+ von 143/);
	await expect(page.getByTestId('region-focus-link')).toHaveAttribute(
		'href',
		'/kiez/reuterstrasse'
	);
	await expect(page.locator('#global-aria-live')).toHaveText(/Reuterstraße, Neukölln/);
	await expect(page.getByTestId('inspector-panel')).toHaveCount(0);
	// Der Parameter bleibt auch nach dem Viewport-Sync in der URL.
	await page.waitForFunction(() => new URL(window.location.href).searchParams.has('bbox'), null, {
		timeout: 10000
	});
	expect(new URL(page.url()).searchParams.get('kiez')).toBe('reuterstrasse');
});

test('Kiez-Fokus passt auf 375 px Breite', async ({ page }) => {
	await page.setViewportSize({ width: 375, height: 700 });
	await page.goto('/explore?kiez=reuterstrasse');
	await mapReady(page);
	const card = page.getByTestId('region-focus-card');
	await expect(card).toBeVisible({ timeout: 10000 });
	const box = await card.boundingBox();
	expect(box).not.toBeNull();
	expect(box!.x).toBeGreaterThanOrEqual(0);
	expect(box!.x + box!.width).toBeLessThanOrEqual(375);
});

test('Bezirk-Fokus mit Layer: Layer aktiv, Rang von 12', async ({ page }) => {
	await page.goto('/explore?bezirk=neukoelln&layers=zensus-altbau-anteil-2022');
	await mapReady(page);
	await expect(page.getByTestId('region-focus-name')).toHaveText('Neukölln', { timeout: 10000 });
	await expect(page.getByTestId('region-focus-score')).toContainText(/Platz \d+ von 12/);
	await expect(page.getByTestId('region-focus-link')).toHaveAttribute('href', '/bezirk/neukoelln');
	expect(new URL(page.url()).searchParams.get('layers')).toBe('zensus-altbau-anteil-2022');
});

test('Dubletten-Slug fokussiert den richtigen Kiez', async ({ page }) => {
	await page.goto('/explore?kiez=heerstrasse-spandau');
	await mapReady(page);
	await expect(page.getByTestId('region-focus-bezirk')).toHaveText('Spandau', { timeout: 10000 });
});

test('Kiez gewinnt gegen Bezirk', async ({ page }) => {
	await page.goto('/explore?kiez=reuterstrasse&bezirk=pankow');
	await mapReady(page);
	await expect(page.getByTestId('region-focus-name')).toHaveText('Reuterstraße', {
		timeout: 10000
	});
});

test('Kiez-Fokus gewinnt gegen bbox aus der URL', async ({ page }) => {
	// bbox zeigt Spandau, der Fokus muss trotzdem auf Reuterstraße zoomen.
	await page.goto('/explore?kiez=reuterstrasse&bbox=13.15,52.50,13.25,52.56');
	await mapReady(page);
	await expect(page.getByTestId('region-focus-name')).toHaveText('Reuterstraße', {
		timeout: 10000
	});
	await page.waitForFunction(
		() => {
			const raw = new URL(window.location.href).searchParams.get('bbox');
			if (!raw) return false;
			const [w, , e] = raw.split(',').map(Number);
			const centerLng = (w! + e!) / 2;
			return centerLng > 13.4 && centerLng < 13.47;
		},
		null,
		{ timeout: 10000 }
	);
	expect(new URL(page.url()).searchParams.get('kiez')).toBe('reuterstrasse');
});

test('EN: Ansage und Link lokalisiert', async ({ page }) => {
	await page.goto('/en/explore?bezirk=pankow');
	await mapReady(page);
	await expect(page.getByTestId('region-focus-card')).toBeVisible({ timeout: 10000 });
	await expect(page.locator('#global-aria-live')).toHaveText(/Map shows the Bezirk Pankow/);
	await expect(page.getByTestId('region-focus-link')).toHaveAttribute('href', '/en/bezirk/pankow');
});

test('Unbekannter Slug: Karte startet normal mit Default-Punkt, keine Fokus-Ansage', async ({
	page
}) => {
	await page.goto('/explore?kiez=gibtsnicht');
	await mapReady(page);
	await page.waitForFunction(() => !new URL(window.location.href).searchParams.has('kiez'), null, {
		timeout: 10000
	});
	await expect(page.getByTestId('region-focus-card')).toHaveCount(0);
	// "Normal" heißt: derselbe Default-Einstieg wie ohne Parameter (Pariser Platz).
	await expect(page.getByTestId('inspector-panel')).toBeVisible({ timeout: 10000 });
	await expect(page.locator('#global-aria-live')).not.toHaveText(/Karte zeigt/);
	await expect(page.getByRole('application')).toBeVisible();
});

test('Adresse gewinnt: Fokus-Parameter entfällt, Inspector öffnet', async ({ page }) => {
	await page.goto('/explore?kiez=reuterstrasse&address=13.4544,52.5111&q=Boxhagener');
	await mapReady(page);
	await page.waitForFunction(() => !new URL(window.location.href).searchParams.has('kiez'), null, {
		timeout: 10000
	});
	await expect(page.getByTestId('region-focus-card')).toHaveCount(0);
	await expect(page.getByTestId('inspector-panel')).toBeVisible({ timeout: 10000 });
});

test('Klick auf die Karte löst den Fokus ab', async ({ page }) => {
	await page.goto('/explore?kiez=reuterstrasse');
	await mapReady(page);
	await expect(page.getByTestId('region-focus-card')).toBeVisible({ timeout: 10000 });
	// Mitte der Karte liegt im Kiez (fitBounds zentriert), weit weg von Karte und Controls.
	const canvas = page.locator('canvas.maplibregl-canvas');
	const box = await canvas.boundingBox();
	expect(box).not.toBeNull();
	await page.mouse.click(box!.x + box!.width * 0.65, box!.y + box!.height * 0.6);
	await expect(page.getByTestId('region-focus-card')).toHaveCount(0, { timeout: 10000 });
	await page.waitForFunction(() => !new URL(window.location.href).searchParams.has('kiez'), null, {
		timeout: 10000
	});
});

test('Schließen-Button beendet den Fokus und gibt dem Fokus die Karte', async ({ page }) => {
	await page.goto('/explore?kiez=reuterstrasse');
	await mapReady(page);
	await expect(page.getByTestId('region-focus-card')).toBeVisible({ timeout: 10000 });
	await page.getByTestId('region-focus-close').click();
	await expect(page.getByTestId('region-focus-card')).toHaveCount(0);
	await page.waitForFunction(() => !new URL(window.location.href).searchParams.has('kiez'), null, {
		timeout: 10000
	});
	await expect(page.getByRole('application')).toBeFocused();
});

test('Adresswahl während der Fokus lädt: Adresse bleibt, kein Fokus nach dem Laden', async ({
	page
}) => {
	let release: () => void = () => {};
	const gate = new Promise<void>((resolve) => (release = resolve));
	await page.route('**/layers/lor-bezirksregion*.geojson', async (route) => {
		await gate;
		await route.continue();
	});
	await page.goto('/explore?kiez=reuterstrasse');
	await mapReady(page);
	const canvas = page.locator('canvas.maplibregl-canvas');
	const box = await canvas.boundingBox();
	expect(box).not.toBeNull();
	await page.mouse.click(box!.x + box!.width * 0.65, box!.y + box!.height * 0.6);
	await page.waitForFunction(
		() => new URL(window.location.href).searchParams.has('address'),
		null,
		{
			timeout: 10000
		}
	);
	release();
	await page.waitForTimeout(1500);
	const params = new URL(page.url()).searchParams;
	expect(params.has('address')).toBe(true);
	expect(params.has('kiez')).toBe(false);
	await expect(page.getByTestId('region-focus-card')).toHaveCount(0);
});

test('Client-Navigation innerhalb /explore wendet den neuen Fokus an', async ({ page }) => {
	await page.goto('/explore?kiez=reuterstrasse');
	await mapReady(page);
	await expect(page.getByTestId('region-focus-name')).toHaveText('Reuterstraße', {
		timeout: 10000
	});
	await page.evaluate(() => {
		const a = document.createElement('a');
		a.href = '/explore?kiez=heerstrasse-spandau';
		a.id = 'test-nav-link';
		a.textContent = 'nav';
		document.body.appendChild(a);
	});
	await page.locator('#test-nav-link').click();
	await expect(page.getByTestId('region-focus-bezirk')).toHaveText('Spandau', { timeout: 10000 });
	await expect(page.getByTestId('region-focus-name')).toHaveText('Heerstraße');
});

test('Escape beendet den Fokus', async ({ page }) => {
	await page.goto('/explore?kiez=reuterstrasse');
	await mapReady(page);
	await expect(page.getByTestId('region-focus-card')).toBeVisible({ timeout: 10000 });
	await page.getByTestId('region-focus-close').focus();
	await page.keyboard.press('Escape');
	await expect(page.getByTestId('region-focus-card')).toHaveCount(0);
	await page.waitForFunction(() => !new URL(window.location.href).searchParams.has('kiez'), null, {
		timeout: 10000
	});
});
