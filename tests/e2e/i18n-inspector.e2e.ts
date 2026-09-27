import { expect, test } from '@playwright/test';

// i18n Block B3b (spec-i18n-b3b-inspector.md): Inspector-Panel auf
// `/en/explore` -- Kopf, Kiez-Score, Wahl-, Demografie-, Klima- und
// Share-Texte englisch; `/explore` (DE) bleibt unverändert (Ausnahme:
// Klima-Chart-Zahlen bekommen ein Komma statt eines Punkts, Koordinator-
// Entscheidung, vorbestehender Formatfehler). KI-Export bleibt deutsch.
//
// Adresse wird per Deep-Link (`?address=lng,lat&q=…`) gesetzt, nicht über
// die Adress-Such-Combobox: `input.click()`/`fill()` schlägt reproduzierbar
// mit "element was detached from the DOM" fehl (vorbestehender, story-
// fremder Hydration-Bug, siehe `deferred-work.md`; betrifft u.a.
// `kiez-score-flow.e2e.ts`, `wahl-flow.e2e.ts`, unverändert an diesen
// Dateien reproduziert). Der Deep-Link-Pfad (`home-quick-links.ts`,
// Story 2.12) baut die Adresse synthetisch aus der URL und triggert
// dieselbe Selection wie ein echter Such-Treffer -- kein Geocoding-API-
// Aufruf nötig, exakt wie beim Default-Einstieg ohne `?address=` in
// `i18n-atlas.e2e.ts` (Pariser-Platz-Fallback).

const ADDRESS_LNG = 13.4541;
const ADDRESS_LAT = 52.5126;
const ADDRESS_Q = 'Boxhagener Straße 12, 10245 Berlin';

function exploreUrl(base: string): string {
	const params = new URLSearchParams({ address: `${ADDRESS_LNG},${ADDRESS_LAT}`, q: ADDRESS_Q });
	return `${base}?${params.toString()}`;
}

async function openInspector(page: import('@playwright/test').Page, base: string) {
	await page.goto(exploreUrl(base));
	// Grosszuegiges Timeout: der Inspector oeffnet erst, sobald die Map-Instanz
	// selbst geladen ist (`rawMap`-Gate im Selection-Effect), ein kalter
	// Preview-Server-Start kann das erste Tile-/Style-Laden deutlich verzoegern.
	await page.locator('[data-testid="map-skeleton"]').waitFor({ state: 'detached', timeout: 30000 });
	await expect(page.getByTestId('inspector-panel')).toBeVisible({ timeout: 10000 });
}

test.describe('i18n Block B3b: /en/explore Inspector englisch', () => {
	test('Kopf, Kiez-Score, Weitere-Daten-Header und Share-Trigger englisch', async ({ page }) => {
		await openInspector(page, '/en/explore');
		await expect(page.getByTestId('inspector-panel')).toHaveAttribute(
			'aria-label',
			`Layer data for ${ADDRESS_Q}`
		);
		await expect(page.getByTestId('inspector-close')).toHaveAttribute(
			'aria-label',
			'Close inspector'
		);
		// "Bookmark" ist DE/EN identisch (Lehnwort, beweist keine Übersetzung) --
		// das aria-label unterscheidet sich eindeutig.
		await expect(page.getByTestId('inspector-bookmark-trigger')).toHaveAttribute(
			'aria-label',
			'Save address as bookmark'
		);
		await expect(page.getByTestId('share-sheet-trigger')).toContainText('Share');
		await expect(page.getByTestId('kiez-score-section-header')).toContainText('Kiez score');
		await expect(page.getByTestId('weitere-daten-header')).toContainText(
			'More data at this address'
		);
	});

	test('Wahl-Sektion englisch (Glossar-Begriffe) + Detail-/Methodik-Link auf /en/…', async ({
		page
	}) => {
		await openInspector(page, '/en/explore');
		const wahlHeader = page.getByTestId('wahl-section-header');
		await expect(wahlHeader).toBeVisible({ timeout: 8000 });
		await expect(wahlHeader).toContainText('Voting behaviour here');
		await expect(page.getByTestId('wahl-methodik-link')).toContainText(
			'Methodology · Election data'
		);
		await expect(page.getByTestId('wahl-methodik-link')).toHaveAttribute(
			'href',
			/^\/en\/methodik\/wahldaten/
		);
		await expect(page.getByTestId('wahl-detail-link')).toHaveAttribute(
			'href',
			/^\/en\/berlin-wahlen\//
		);
	});

	// spec-i18n-teiluebersetzung-banner.md: der Wahl-Hinweis (Editorial-
	// Disclaimer `wahl-stimmenanteile`, Inspector/Compare) war bisher auf
	// `/en` deutsch -- jetzt über eine eigene Message lokalisiert, gleiche
	// Fakten wie DE (Briefstimmen auf allen Ebenen enthalten, Kiez-Wert eine
	// Schätzung).
	test('Wahl-Stimmenanteile-Hinweis (Editorial-Disclaimer) englisch', async ({ page }) => {
		await openInspector(page, '/en/explore');
		const wahlSection = page.getByTestId('wahl-section');
		await expect(wahlSection).toBeVisible({ timeout: 8000 });
		const disclaimer = wahlSection.getByTestId('editorial-disclaimer');
		await expect(disclaimer).toHaveAttribute('data-variant', 'wahl-stimmenanteile');
		await expect(disclaimer).toContainText('Postal votes are included at every level');
		await expect(disclaimer).toContainText('an estimate, not an official breakdown');
	});

	test('Demografie-Block englisch, "Kiez"/"Bezirk" bleiben deutsch, Learn-more auf /en/layer/…', async ({
		page
	}) => {
		await openInspector(page, '/en/explore');
		const block = page.getByTestId('demografie-block');
		await expect(block).toBeVisible({ timeout: 8000 });
		await expect(block).toContainText('Population profile');
		await expect(block.getByTestId('learn-more')).toHaveAttribute(
			'href',
			'/en/layer/einwohner-dichte-2024'
		);
	});

	test('Klima-Sektion englisch (Heading, Sparkline-Definitionen)', async ({ page }) => {
		await openInspector(page, '/en/explore');
		const klima = page.getByTestId('klima-section');
		await expect(klima).toBeVisible({ timeout: 10000 });
		await expect(klima).toContainText('Climate · DWD station');
		await expect(klima).toContainText('Data series since');
		await expect(klima.getByTestId('climate-sparkline-heading').first()).toContainText(
			'Summer days'
		);
	});

	test('Share-Sheet öffnet englisch (Copy permalink, Print)', async ({ page }) => {
		await openInspector(page, '/en/explore');
		await page.getByTestId('share-sheet-trigger').click();
		const sheet = page.getByTestId('share-sheet');
		await expect(sheet).toBeVisible();
		await expect(page.getByTestId('share-option-permalink')).toContainText('Copy permalink');
		await expect(page.getByTestId('share-option-print')).toContainText('Print');
	});

	// Für Boxhagener Straße 12 sind alle Layer-Hits `CARD_SLUGS` (LayerCard),
	// kein `LayerHitRow` (POI-/Netz-Layer wie Stolpersteine/Kultur/Trinkbrunnen
	// treffen hier nicht) -- Map-Toggle/Learn-more-Muster ist bei beiden
	// identisch (siehe Unit-Tests `layer-hit-row.svelte.test.ts`, `layer-card.
	// svelte.test.ts`), LayerCard genügt hier als e2e-Stichprobe.
	test('Layer-Card Map-Toggle-Titel englisch + Learn-more-Link auf /en/layer/…', async ({
		page
	}) => {
		await openInspector(page, '/en/explore');
		const toggles = page.locator('[data-testid="layer-card"] [data-testid="map-toggle"]');
		await expect(toggles.first()).toHaveAttribute('title', /on map$/, { timeout: 8000 });
		const learnMore = page.locator('[data-testid="layer-card"] [data-testid="learn-more"]').first();
		await expect(learnMore).toHaveAttribute('href', /^\/en\/layer\//);
	});

	// Boxhagener Straße 12 löst zuverlässig Kiez "Frankfurter Allee Süd FK" +
	// Bezirk "Friedrichshain-Kreuzberg" auf (manuell verifiziert) -- kein
	// bedingter Skip, sondern harte Erwartung mit Warte-Timeout auf die
	// asynchrone Spatial-Context-Auflösung.
	test('Kiez-/Bezirk-Profil-Links zeigen auf /en/kiez/… bzw. /en/bezirk/…', async ({ page }) => {
		await openInspector(page, '/en/explore');
		await expect(page.getByTestId('inspector-kiez-link')).toHaveAttribute('href', /^\/en\/kiez\//, {
			timeout: 10000
		});
		await expect(page.getByTestId('inspector-bezirk-link')).toHaveAttribute(
			'href',
			/^\/en\/bezirk\//,
			{ timeout: 10000 }
		);
	});
});

test.describe('i18n Block B3b: /explore (DE) Inspector unverändert', () => {
	test('Kopf, Kiez-Score, Wahl- und Demografie-Texte bleiben deutsch', async ({ page }) => {
		await openInspector(page, '/explore');
		await expect(page.getByTestId('inspector-panel')).toHaveAttribute(
			'aria-label',
			`Layer-Daten für ${ADDRESS_Q}`
		);
		await expect(page.getByTestId('inspector-close')).toHaveAttribute(
			'aria-label',
			'Inspektor schließen'
		);
		await expect(page.getByTestId('kiez-score-section-header')).toContainText('Kiez-Score');
		await expect(page.getByTestId('weitere-daten-header')).toContainText(
			'Weitere Daten an dieser Adresse'
		);
		const wahlHeader = page.getByTestId('wahl-section-header');
		await expect(wahlHeader).toBeVisible({ timeout: 8000 });
		await expect(wahlHeader).toContainText('Wahlverhalten hier');
		await expect(page.getByTestId('demografie-block')).toContainText('Bevölkerungsprofil');
	});

	// DE-Pendant zum Kiez-/Bezirk-Link-Test: Links bleiben ohne Locale-Präfix.
	test('Kiez-/Bezirk-Profil-Links zeigen auf /kiez/… bzw. /bezirk/… (kein Präfix)', async ({
		page
	}) => {
		await openInspector(page, '/explore');
		await expect(page.getByTestId('inspector-kiez-link')).toHaveAttribute('href', /^\/kiez\//, {
			timeout: 10000
		});
		await expect(page.getByTestId('inspector-bezirk-link')).toHaveAttribute('href', /^\/bezirk\//, {
			timeout: 10000
		});
	});
});
