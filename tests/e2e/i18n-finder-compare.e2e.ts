import { expect, test } from '@playwright/test';
// Relativer statt `$lib`-Import: Playwright hat hier keine SvelteKit-Alias-
// Aufloesung konfiguriert (kein anderer e2e-Test importiert `$lib/...`),
// ein relativer Pfad in den Quellcode funktioniert aber (smoke-getestet).
import { STORAGE_KEY } from '../../src/lib/state/bookmark-store.js';

// i18n Block B3c (spec-i18n-b3c-finder-compare-bookmarks.md): Kiez-Finder,
// Compare und Bookmarks auf `/en/explore` -- DE bleibt unveraendert.
//
// Muster wie `i18n-inspector.e2e.ts` (Story B3b): Deep-Links statt der
// Adress-Such-Combobox, die reproduzierbar mit "element was detached from
// the DOM" fehlschlaegt (vorbestehender, story-fremder Hydration-Bug, siehe
// `deferred-work.md`). Fuer Adresse B (Compare) wird ein Bookmark per
// `addInitScript` vorab in localStorage gelegt (Muster `compare-flow.e2e.ts`),
// damit auch dieser Pfad ohne Combobox auskommt.

const ADDRESS_LNG = 13.4541;
const ADDRESS_LAT = 52.5126;
const ADDRESS_Q = 'Boxhagener Straße 12, 10245 Berlin';

const BOOKMARK_B = {
	id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
	displayName: 'Wörther Straße 11, Pankow, Berlin',
	lat: 52.5345,
	lng: 13.4181,
	bezirk: 'Pankow',
	postcode: '10405',
	createdAt: '2026-05-01T00:00:00.000Z'
};

function exploreUrl(base: string, extraParams: Record<string, string> = {}): string {
	const params = new URLSearchParams({
		address: `${ADDRESS_LNG},${ADDRESS_LAT}`,
		q: ADDRESS_Q,
		...extraParams
	});
	return `${base}?${params.toString()}`;
}

async function waitForMap(page: import('@playwright/test').Page) {
	await page.locator('[data-testid="map-skeleton"]').waitFor({ state: 'detached', timeout: 30000 });
}

async function seedBookmarkB(page: import('@playwright/test').Page) {
	await page.addInitScript(
		([key, bookmark]) => {
			localStorage.setItem(key, JSON.stringify({ schemaVersion: 1, bookmarks: [bookmark] }));
		},
		[STORAGE_KEY, BOOKMARK_B] as const
	);
}

test.describe('i18n Block B3c: /en/explore Kiez-Finder englisch', () => {
	test('Titel, Close-Aria, Slider-Label und Reset englisch', async ({ page }) => {
		await page.goto(exploreUrl('/en/explore', { finder: '1' }));
		await waitForMap(page);
		const panel = page.getByTestId('finder-panel');
		await expect(panel).toBeVisible({ timeout: 10000 });
		await expect(panel.locator('h2')).toContainText('Kiez finder');
		await expect(page.getByTestId('finder-close')).toHaveAttribute(
			'aria-label',
			'Close Kiez finder'
		);
		const ruheLuftSlider = page.getByTestId('finder-slider-ruheLuft');
		await expect(ruheLuftSlider).toHaveAttribute('aria-label', 'Quiet & air: little to a lot');
		await expect(page.getByTestId('finder-reset')).toContainText('Reset');
	});

	test('Slider-Move zeigt englischen Stufentext + Beste-Passung', async ({ page }) => {
		await page.goto(exploreUrl('/en/explore', { finder: '1' }));
		await waitForMap(page);
		const slider = page.getByTestId('finder-slider-ruheLuft');
		await expect(slider).toBeVisible({ timeout: 10000 });
		await slider.focus();
		await slider.press('ArrowRight');
		await slider.press('ArrowRight');
		await expect(slider).toHaveAttribute('aria-valuetext', 'as much as possible');
		await expect(page.getByTestId('finder-top-list')).toBeVisible({ timeout: 10000 });
		await expect(page.getByText('Best match')).toBeVisible();
	});

	test('Wahl-Hinweis englisch', async ({ page }) => {
		await page.goto(exploreUrl('/en/explore', { finder: '1' }));
		await waitForMap(page);
		await expect(page.getByTestId('finder-wahl-hinweis')).toBeVisible({ timeout: 10000 });
		await expect(page.getByTestId('finder-wahl-hinweis')).toContainText(
			'Voting behaviour: Berlin House of Representatives (Abgeordnetenhaus) party vote 2026'
		);
	});
});

test.describe('i18n Block B3c: /en/explore Compare englisch', () => {
	test("Kopf, Tabs, th's und Bookmark-Pick-Flow englisch", async ({ page }) => {
		await seedBookmarkB(page);
		await page.goto(exploreUrl('/en/explore'));
		await waitForMap(page);
		await expect(page.getByTestId('inspector-panel')).toBeVisible({ timeout: 10000 });
		await page.getByTestId('compare-trigger').click();
		const panel = page.getByTestId('compare-panel');
		await expect(panel).toBeVisible();
		await expect(panel).toHaveAttribute('aria-label', 'Compare addresses');
		await page.getByTestId('compare-pick-bookmarks').click();
		await expect(page.getByTestId('bookmark-dialog')).toBeVisible();
		await page.getByTestId('bookmark-select').click();
		await expect(page.getByTestId('compare-address-b')).toContainText('Wörther');
		await expect(page.getByTestId('compare-tab-a')).toContainText('Address A');
		await expect(page.getByTestId('compare-tab-b')).toContainText('Address B');
		// Beide Adressen liegen in Berlin, das Boundaries-Bundle (Bezirke/
		// Ortsteile/PLZ) trifft deshalb deterministisch fuer beide -- die
		// Tabelle rendert immer, kein Empty-Fallback noetig.
		const table = page.getByTestId('compare-table');
		await expect(table).toBeVisible({ timeout: 10000 });
		await expect(table.locator('thead th').first()).toContainText('Indicator');
		const boundariesSection = page.getByTestId('compare-section-boundaries');
		await expect(boundariesSection).toContainText('Location & administration');
		const plzRow = page.locator('[data-testid="compare-row"][data-slug="plz"] th');
		await expect(plzRow).toContainText('Postcodes');
	});

	// spec-i18n-teiluebersetzung-banner.md: der Wahl-Hinweis (Editorial-
	// Disclaimer `wahl-stimmenanteile`) im Compare-Modus war bisher auf `/en`
	// deutsch -- jetzt über dieselbe Message wie der Inspector lokalisiert.
	test('Wahl-Compare-Block: Stimmenanteile-Hinweis englisch', async ({ page }) => {
		await seedBookmarkB(page);
		await page.goto(exploreUrl('/en/explore'));
		await waitForMap(page);
		await expect(page.getByTestId('inspector-panel')).toBeVisible({ timeout: 10000 });
		await page.getByTestId('compare-trigger').click();
		await expect(page.getByTestId('compare-panel')).toBeVisible();
		await page.getByTestId('compare-pick-bookmarks').click();
		await expect(page.getByTestId('bookmark-dialog')).toBeVisible();
		await page.getByTestId('bookmark-select').click();
		const wahlBlock = page.getByTestId('wahl-compare-block');
		await expect(wahlBlock).toBeVisible({ timeout: 10000 });
		const disclaimer = wahlBlock.getByTestId('editorial-disclaimer');
		await expect(disclaimer).toHaveAttribute('data-variant', 'wahl-stimmenanteile');
		await expect(disclaimer).toContainText('Postal votes are included at every level');
	});

	test('Compare-Exit-Aria englisch', async ({ page }) => {
		await page.goto(exploreUrl('/en/explore'));
		await waitForMap(page);
		await expect(page.getByTestId('inspector-panel')).toBeVisible({ timeout: 10000 });
		await page.getByTestId('compare-trigger').click();
		await expect(page.getByTestId('compare-exit')).toHaveAttribute('aria-label', 'Exit comparison');
	});
});

test.describe('i18n Block B3c: /en/explore Bookmarks englisch', () => {
	test('Dialog-Titel, Zaehler, Datenschutz-Link und Loeschen-Bestaetigung englisch', async ({
		page
	}) => {
		await seedBookmarkB(page);
		await page.goto('/en/explore');
		await waitForMap(page);
		await page.getByTestId('header-bookmark-trigger').click();
		const dialog = page.getByTestId('bookmark-dialog');
		await expect(dialog).toBeVisible();
		await expect(dialog.locator('h2')).toContainText('Saved addresses');
		await expect(page.getByTestId('bookmark-counter')).toContainText('1/50');
		const privacyLink = page.getByTestId('bookmark-privacy-link');
		await expect(privacyLink).toHaveAttribute('href', '/en/datenschutz#bookmarks');
		await expect(privacyLink).toContainText('Privacy');

		await page.getByTestId('bookmark-delete').click();
		await expect(page.getByTestId('bookmark-confirm')).toContainText('Delete this bookmark?');
		await page.getByTestId('bookmark-confirm-delete').click();
		await expect(page.getByTestId('bookmark-empty')).toContainText('No bookmarks yet.');
	});
});

test.describe('i18n Block B3c: /explore (DE) Finder, Compare, Bookmarks unveraendert', () => {
	// `?finder=1` schliesst den Inspector (`ui.inspectorOpen = false`, Fundament
	// des Panels), Finder und Compare/Bookmarks werden deshalb in getrennten
	// Navigationen geprueft statt in einer gemeinsamen URL.
	test('Finder-Titel + Close-Aria bleiben deutsch', async ({ page }) => {
		await page.goto(exploreUrl('/explore', { finder: '1' }));
		await waitForMap(page);
		const finder = page.getByTestId('finder-panel');
		await expect(finder).toBeVisible({ timeout: 10000 });
		await expect(finder.locator('h2')).toContainText('Kiez-Finder');
		await expect(page.getByTestId('finder-close')).toHaveAttribute(
			'aria-label',
			'Kiez-Finder schließen'
		);
	});

	test('Compare-Aria + Tab-Label bleiben deutsch', async ({ page }) => {
		await page.goto(exploreUrl('/explore'));
		await waitForMap(page);
		await expect(page.getByTestId('inspector-panel')).toBeVisible({ timeout: 10000 });
		await page.getByTestId('compare-trigger').click();
		await expect(page.getByTestId('compare-panel')).toHaveAttribute(
			'aria-label',
			'Adressen vergleichen'
		);
		// Ohne Adresse B rendert nur der B-Picker, nicht die Mobile-Tabs.
		await expect(page.getByTestId('compare-b-picker')).toContainText('Adresse B wählen');
	});

	test('Bookmark-Dialog-Titel + Datenschutz-Link bleiben deutsch', async ({ page }) => {
		await page.goto('/explore');
		await waitForMap(page);
		await page.getByTestId('header-bookmark-trigger').click();
		await expect(page.getByTestId('bookmark-dialog').locator('h2')).toContainText(
			'Gespeicherte Adressen'
		);
		const privacyLink = page.getByTestId('bookmark-privacy-link');
		await expect(privacyLink).toHaveAttribute('href', '/datenschutz#bookmarks');
		await expect(privacyLink).toContainText('Datenschutz');
	});
});
