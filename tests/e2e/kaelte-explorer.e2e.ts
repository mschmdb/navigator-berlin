import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Issue #73: Explorer im Kälte-Modus. Der Inspector zeigt nur die Warme-Orte-Card.
// Die Adresse kommt über `address=lng,lat` in der URL: die Combobox-Suche des Musters in
// inspector-panel.e2e.ts hängt in dieser Umgebung schon vor diesem Feature.
const ADDRESS_QUERY = 'address=13.4544,52.5111&q=Boxhagener';

async function openWithAddress(page: Page, path: string): Promise<void> {
	const sep = path.includes('?') ? '&' : '?';
	await page.goto(`${path}${sep}${ADDRESS_QUERY}`);
	await expect(page.getByTestId('inspector-panel')).toBeVisible({ timeout: 15000 });
}

test.describe('Kälte-Modus im Explorer (#73)', () => {
	test('Link auf /kaelte führt in den Explorer, Inspector zeigt nur warme Orte', async ({
		page
	}) => {
		await page.goto('/kaelte');
		await page.getByTestId('kaelte-karte-link').click();
		await expect(page).toHaveURL(/layers=waerme-orte&mode=kaelte/);
		await page
			.locator('[data-testid="map-skeleton"]')
			.waitFor({ state: 'detached', timeout: 15000 });
		await openWithAddress(page, new URL(page.url()).pathname + new URL(page.url()).search);
		const inspector = page.getByTestId('inspector-panel');
		await expect(inspector).toBeVisible({ timeout: 5000 });
		await expect(inspector.getByTestId('waerme-orte-card')).toBeVisible();
		await expect(inspector.getByTestId('waerme-orte-item')).toHaveCount(5);
		await expect(inspector.getByTestId('kuehle-orte-card')).toHaveCount(0);
		await expect(inspector.getByTestId('hitze-trinkbrunnen-toggle')).toHaveCount(0);
		await expect(inspector.getByTestId('kaelte-full-navigator')).toBeVisible();
		for (const key of ['boundaries', 'wohn', 'sozial', 'klima', 'mobilitaet'])
			await expect(inspector.getByTestId(`section-${key}`)).toHaveCount(0);
		for (const testid of [
			'kiez-score-section',
			'weitere-daten-header',
			'inspector-profile-links',
			'demografie-block'
		])
			await expect(inspector.getByTestId(testid)).toHaveCount(0);
		await expect(
			inspector.locator('[data-testid="section-umwelt"] [data-testid^="hit-"]')
		).toHaveCount(0);
	});

	test('Layer aus: Hinweis mit Einblenden-Button statt Liste', async ({ page }) => {
		await openWithAddress(page, '/explore?mode=kaelte');
		const card = page.getByTestId('waerme-orte-card');
		await expect(card.getByTestId('waerme-orte-layer-off')).toBeVisible();
		await expect(card.getByTestId('waerme-orte-list')).toHaveCount(0);
		await card.getByTestId('waerme-orte-show-layer').click();
		await expect(card.getByTestId('waerme-orte-item')).toHaveCount(5);
	});

	test('EN: UI englisch', async ({ page }) => {
		await openWithAddress(page, '/en/explore?layers=waerme-orte&mode=kaelte');
		const card = page.getByTestId('waerme-orte-card');
		await expect(card.getByTestId('waerme-orte-item').first()).toContainText(
			'Staying without buying'
		);
		await expect(
			card.getByTestId('waerme-orte-item').first().locator('[lang="de"]').first()
		).toBeVisible();
	});

	test('Hitze-Modus unverändert: Kühle-Orte-Card, keine warmen Orte, kein Index-Fetch', async ({
		page
	}) => {
		const indexRequests: string[] = [];
		page.on('request', (req) => {
			if (req.url().includes('/data/waerme-orte.geojson')) indexRequests.push(req.url());
		});
		await openWithAddress(page, '/explore?layers=kuehle-orte&mode=hitze');
		const inspector = page.getByTestId('inspector-panel');
		await expect(inspector.getByTestId('kuehle-orte-card')).toBeVisible();
		await expect(inspector.getByTestId('waerme-orte-card')).toHaveCount(0);
		await expect(inspector.getByTestId('hitze-full-navigator')).toBeVisible();
		await page.waitForTimeout(1000);
		expect(indexRequests).toEqual([]);
	});

	test('Default-Inspector unverändert: keine Warme-Orte-Card, kein Index-Fetch', async ({
		page
	}) => {
		const indexRequests: string[] = [];
		page.on('request', (req) => {
			if (req.url().includes('/data/waerme-orte.geojson')) indexRequests.push(req.url());
		});
		await openWithAddress(page, '/explore?layers=waerme-orte');
		await expect(page.getByTestId('waerme-orte-card')).toHaveCount(0);
		await expect(page.getByTestId('section-klima')).toBeVisible();
		await page.waitForTimeout(1000);
		expect(indexRequests).toEqual([]);
	});

	test('Ladefehler des Index: Card zeigt Fehlerhinweis', async ({ page }) => {
		await page.route('**/data/waerme-orte.geojson', (route) => route.fulfill({ status: 404 }));
		await openWithAddress(page, '/explore?layers=waerme-orte&mode=kaelte');
		await expect(page.getByTestId('waerme-orte-load-error')).toBeVisible();
		await expect(page.getByTestId('waerme-orte-loading')).toHaveCount(0);
	});

	test('keine Axe-Verstöße im Inspector', async ({ page }) => {
		await openWithAddress(page, '/explore?layers=waerme-orte&mode=kaelte');
		await expect(page.getByTestId('waerme-orte-item').first()).toBeVisible();
		const results = await new AxeBuilder({ page })
			.include('[data-testid="inspector-panel"]')
			.withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
			.analyze();
		expect(results.violations).toEqual([]);
	});
});
