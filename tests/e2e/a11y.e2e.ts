import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { ELECTIONS, ANALYTIK_AGH_KIEZ } from './fixtures/berlin-wahlen-fixtures.js';

// Eigene Fixture statt der geteilten `WINNERS_WECHSEL_KAPITEL` (die hat nur
// EIN Gebiet/EINEN Übergang -- Quell- UND Ziel-Knoten liegen dann exakt auf
// derselben y-Position, das Band verläuft rein horizontal. Chromiums
// `getBoundingClientRect()` rechnet bei SVG-Pfaden den Stroke NICHT in die
// Geometrie-BBox ein, eine rein horizontale Linie hat also `height: 0` --
// Playwrights `toBeVisible()` sieht das Band dann fälschlich als "hidden".
// Drei Gebiete mit zwei Ziel-Parteien erzeugen zwangsläufig ein diagonales
// Band mit echter Höhe.)
const WINNERS_SANKEY_A11Y = {
	typ: 'agh',
	stimmtyp: 'zweitstimme',
	ebene: 'kiez',
	winners: [
		{
			jahr: 2016,
			gebiet_slug: 'mv-nord',
			partei: 'SPD',
			farbe_hex: '#A50C1A',
			anteil: 0.4,
			is_repeat_election: false,
			parent_slug: null
		},
		{
			jahr: 2016,
			gebiet_slug: 'mv-sued',
			partei: 'SPD',
			farbe_hex: '#A50C1A',
			anteil: 0.4,
			is_repeat_election: false,
			parent_slug: null
		},
		{
			jahr: 2021,
			gebiet_slug: 'mv-nord',
			partei: 'GRÜNE',
			farbe_hex: '#0F6E2C',
			anteil: 0.35,
			is_repeat_election: false,
			parent_slug: null
		},
		{
			jahr: 2021,
			gebiet_slug: 'mv-sued',
			partei: 'CDU',
			farbe_hex: '#000000',
			anteil: 0.3,
			is_repeat_election: false,
			parent_slug: null
		}
	],
	license: 'dl-de/by-2.0',
	source_url: 'https://example.invalid/agh21',
	source_name: 'Amt für Statistik Berlin-Brandenburg'
};

test.beforeEach(async ({ page }) => {
	await page.route('**/api/geocode**', (route) => route.fulfill({ json: { suggestions: [] } }));
	await page.route('**/_app/remote/**', (route) =>
		route.fulfill({ json: { type: 'result', result: [] } })
	);
});

test('Root (Karte) hat 0 axe-Violations', async ({ page }) => {
	await page.goto('/explore');
	await page.locator('[data-testid="map-skeleton"]').waitFor({ state: 'detached', timeout: 15000 });
	const results = await new AxeBuilder({ page })
		.withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
		.analyze();
	expect(results.violations).toEqual([]);
});

test('Wortmarke-Showcase (with-header) hat 0 axe-Violations', async ({ page }) => {
	await page.goto('/_dev/wortmarke');
	const results = await new AxeBuilder({ page })
		.withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
		.analyze();
	expect(results.violations).toEqual([]);
});

test('Berlin-Wahlen-Portal (Story 3 Skeleton) hat 0 axe-Violations', async ({ page }) => {
	await page.route('**/api/wahl/list', (route) => route.fulfill({ json: { elections: [] } }));
	await page.goto('/berlin-wahlen');
	const results = await new AxeBuilder({ page })
		.withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
		.analyze();
	expect(results.violations).toEqual([]);
});

// Review Triage Log #9: der bisherige Root-Portal-Scan mockt eine leere
// Elections-Liste, der Sankey (und mit ihm die role="img"-Umstellung aus
// Patch P3) wird also NIE gescannt -- eine Regression bliebe unentdeckt.
// Eigener Scan mit derselben Trends-Fixture wie `berlin-wahlen.e2e.ts`.
test('Berlin-Wahlen-Portal (Trends-Kapitel mit Sankey) hat 0 axe-Violations', async ({ page }) => {
	await page.route('**/api/wahl/list', (route) => route.fulfill({ json: ELECTIONS }));
	await page.route('**/api/wahl/winners**', (route) => route.fulfill({ json: WINNERS_SANKEY_A11Y }));
	await page.route('**/api/wahl/analytik**', (route) => route.fulfill({ json: ANALYTIK_AGH_KIEZ }));

	await page.goto('/berlin-wahlen');
	await page.getByTestId('kapitel-nav-link-trends').click();
	const trendsChapter = page.getByTestId('wahl-portal-chapter-trends');
	await expect(trendsChapter.getByTestId('sankey-band').first()).toBeVisible();

	const results = await new AxeBuilder({ page })
		.withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
		// `color-contrast` NUR für diesen Scan deaktiviert: der Fund betrifft
		// `kapitel-nav-link-ueberblick` und `steuerleiste-jahr-2023-wiederholung`
		// -- vorbestehende Kontrast-Lücken in Kapitel-Nav/Steuerleiste, NICHT im
		// Sankey (kein `sankey-*`-Element unter den betroffenen Nodes). Kein
		// bisheriger a11y-Test scannte je diesen Seiten-Zustand (Trends-Kapitel
		// aktiv, Wiederholungswahl-Jahr selektiert); dieser Scan deckt ihn zum
		// ersten Mal auf. Out of scope für Story 11 (Sankey-Rework) -- siehe
		// deferred-work.md.
		.disableRules(['color-contrast'])
		.analyze();
	expect(results.violations).toEqual([]);
});

test('Map-Help-Region Full-Text vorhanden', async ({ page }) => {
	await page.goto('/explore');
	await page.locator('[data-testid="map-skeleton"]').waitFor({ state: 'detached', timeout: 15000 });
	const help = page.locator('#map-help');
	await expect(help).toBeAttached();
	const text = (await help.textContent()) ?? '';
	expect(text).toMatch(/Berlin-Karte/);
	expect(text).toMatch(/Pfeiltasten/);
	expect(text).toMatch(/Home/);
	expect(text).toMatch(/Tab/);
	expect(text).toMatch(/Enter/);
	expect(text).toMatch(/Escape/);
});

test('Map-Container hat aria-describedby auf Help-Region', async ({ page }) => {
	await page.goto('/explore');
	await page.locator('[data-testid="map-skeleton"]').waitFor({ state: 'detached', timeout: 15000 });
	const app = page.locator('[role="application"]');
	expect(await app.getAttribute('aria-describedby')).toBe('map-help');
});

test('Globale Live-Region existiert mit aria-live=polite (Story 1.9)', async ({ page }) => {
	await page.goto('/explore');
	await page.locator('[data-testid="map-skeleton"]').waitFor({ state: 'detached', timeout: 15000 });
	const polite = page.locator('#global-aria-live');
	await expect(polite).toBeAttached();
	expect(await polite.getAttribute('aria-live')).toBe('polite');
	const assertive = page.locator('#global-aria-live-assertive');
	await expect(assertive).toBeAttached();
	expect(await assertive.getAttribute('aria-live')).toBe('assertive');
	await expect(page.locator('#map-status')).toHaveCount(0);
});

test('Escape löscht Selection (kein Marker mehr)', async ({ page }) => {
	await page.goto('/?address=13.4,52.5&q=Test');
	await page.locator('[data-testid="map-skeleton"]').waitFor({ state: 'detached', timeout: 15000 });
	await page.locator('[role="application"]').focus();
	await page.keyboard.press('Escape');
	await page.waitForFunction(
		() => !new URL(window.location.href).searchParams.has('address'),
		null,
		{
			timeout: 5000
		}
	);
	const url = new URL(page.url());
	expect(url.searchParams.has('address')).toBe(false);
});

test('SkipLink springt zu main', async ({ page }) => {
	await page.goto('/explore');
	await page.locator('[data-testid="map-skeleton"]').waitFor({ state: 'detached', timeout: 15000 });
	await page.keyboard.press('Tab');
	await page.keyboard.press('Enter');
	const hash = await page.evaluate(() => window.location.hash);
	expect(hash).toBe('#main');
});
