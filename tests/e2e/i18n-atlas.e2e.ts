import { expect, test } from '@playwright/test';

// i18n Block B3a (spec-i18n-b3a-atlas-fundament.md): Atlas-Fundament auf
// `/en/explore` -- Layer-Palette, Legende, Map-Controls, Layer-Link, Hover-
// Tooltip englisch; `/explore` (DE) bleibt unverändert. Layer `laerm-2023`
// ist real (Prerender-Output, echtes Legend-Profil `choropleth-belastung-3`),
// dient als durchgängiges Beispiel für Legende/Palette/Tooltip.
//
// i18n Block C1 (spec-i18n-c1-hinweise-layer-erklaerungen.md): `/en/explore`
// ist jetzt im vollen Übersetzungs-Register (`translation-register.ts`) --
// vorher unregistriert/noindex (B3a), dann teilweise übersetzt mit Banner
// (spec-i18n-teiluebersetzung-banner.md), jetzt vollständig übersetzt ohne
// Banner, indexierbar, mit hreflang.

test.beforeEach(async ({ page }) => {
	await page.route('**/api/geocode**', (route) => route.fulfill({ json: { suggestions: [] } }));
	await page.route('**/_app/remote/**', (route) =>
		route.fulfill({ json: { type: 'result', result: [] } })
	);
});

test.describe('i18n Block C1: /en/explore -- vollständig übersetzt, indexierbar', () => {
	// i18n Block C1 (spec-i18n-c1-hinweise-layer-erklaerungen.md): `/explore`
	// zog aus dem Teil-Übersetzungs-Register in das volle Register um
	// (`translation-register.ts`) -- layer-explain-Texte und alle
	// EditorialDisclaimer-Varianten sind jetzt vollständig lokalisiert, kein
	// deutscher Rest mehr auf der Seite. Entsprechend: kein noindex mehr,
	// hreflang erscheint (wie `/en/berlin-wahlen`).
	test('GET /en/explore: 200, lang=en, kein noindex', async ({ page }) => {
		const response = await page.goto('/en/explore');
		expect(response?.status()).toBe(200);
		await expect(page.locator('html')).toHaveAttribute('lang', 'en');
		await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
	});

	// Review-Fund: Route-Content (sr-only H1 + <title>) war noch ungeprüft.
	test('sr-only H1 + <title> sind englisch', async ({ page }) => {
		await page.goto('/en/explore');
		await expect(page.locator('h1')).toHaveText('Berlin Atlas: data for every address');
		await expect(page).toHaveTitle('Atlas - Berlin in data - navigator.berlin');
	});

	// i18n Block C1: `/explore` graduierte von "teilweise übersetzt" zu
	// "übersetzt" -- kein Banner mehr (wie `/en/berlin-wahlen`), `<main lang>`
	// bleibt `en`, hreflang erscheint jetzt (AC "übersetzt ≠ teilweise
	// übersetzt": hreflang + kein noindex, statt umgekehrt vorher).
	// `/explore` ist (wie `/en`, siehe Kommentar dort weiter unten) SSR statt
	// prerendered (dynamische Query-Params: Adresse, Layer, Finder-Gewichte)
	// -- die absolute Origin folgt hier dem tatsächlichen Request statt dem
	// Build-Time-`prerender.origin` (svelte.config.js), deshalb Pfad-Check
	// statt fester `https://navigator.berlin`-Origin-Assertion.
	test('Kein Übersetzungs-Banner mehr, main lang=en, hreflang=en vorhanden', async ({ page }) => {
		await page.goto('/en/explore');
		await expect(page.locator('main#main')).toHaveAttribute('lang', 'en');
		await expect(page.getByTestId('translation-disclaimer')).toHaveCount(0);
		await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute(
			'href',
			/\/en\/explore$/
		);
	});

	test('GET /explore (DE): hreflang=en vorhanden, kein noindex', async ({ page }) => {
		await page.goto('/explore');
		await expect(page.locator('html')).toHaveAttribute('lang', 'de');
		await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
		await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute(
			'href',
			/\/en\/explore$/
		);
	});
});

test.describe('i18n Block B3a: /en/explore -- Legende + Map-Controls + Layer-Link englisch', () => {
	test('Legende + Map-Controls zeigen englischen Text, keine deutschen Karten-UI-Wörter', async ({
		page
	}) => {
		await page.goto('/en/explore?layers=laerm-2023');
		await page
			.locator('[data-testid="map-skeleton"]')
			.waitFor({ state: 'detached', timeout: 15000 });

		const controls = page.getByRole('group', { name: 'Map controls' });
		await expect(controls).toBeVisible();
		await expect(controls.getByRole('button', { name: 'Zoom in' })).toBeVisible();
		await expect(controls.getByRole('button', { name: 'Zoom out' })).toBeVisible();
		// Negativ: die DEUTSCHEN Rollen-Namen (Aria-Labels) aus map-interaction.e2e.ts
		// dürfen auf der EN-Seite nicht mehr auffindbar sein.
		await expect(page.getByRole('group', { name: /Karten-Steuerung/i })).toHaveCount(0);
		await expect(page.getByRole('button', { name: /Hineinzoomen/i })).toHaveCount(0);
		await expect(page.getByRole('button', { name: /Herauszoomen/i })).toHaveCount(0);

		const legend = page.getByTestId('map-legend');
		await expect(legend).toBeVisible();
		await expect(legend).toContainText('Noise pollution 2023');
		await expect(legend).toContainText('low');
		await expect(legend).toContainText('medium');
		await expect(legend).toContainText('high');

		// Negativ-Stichprobe: typische deutsche Legenden-Wörter aus B3a dürfen
		// nach der Übersetzung nicht mehr vorkommen. Unicode-Lookaround statt
		// `\b` (Review-Fund aus Block B2: `\b` matcht nie am Wortanfang bei
		// führendem Umlaut/Sonderzeichen -- hier zur Konsistenz durchgehend
		// verwendet, auch wo die Wörter selbst ASCII-Buchstaben beginnen).
		//
		// Scope bewusst auf die Legende (nicht `body`): am Standard-
		// Einstiegspunkt (Pariser Platz, ohne `?address=`) öffnet die Route
		// automatisch den Inspector für die Fallback-Adresse -- der bleibt
		// laut Boundary (B3b, ausserhalb dieser Story) deutsch, u.a. mit der
		// Layer-Card-Überschrift "Lärmbelastung 2023". Ein `body`-weiter Scope
		// würde also fälschlich B3b-Bestandsverhalten als B3a-Regression melden.
		const legendText = await legend.innerText();
		expect(legendText).not.toMatch(/(?<!\p{L})Lärmbelastung 2023(?!\p{L})/u);
		expect(legendText).not.toMatch(/(?<!\p{L})gefüllt(?!\p{L})/u);
		expect(legendText).not.toMatch(/(?<!\p{L})Mehr erfahren(?!\p{L})/u);
	});

	test('Legenden-Link zeigt ohne 301-Umweg auf /en/layer/laerm-2023', async ({ page }) => {
		await page.goto('/en/explore?layers=laerm-2023');
		await page
			.locator('[data-testid="map-skeleton"]')
			.waitFor({ state: 'detached', timeout: 15000 });
		await page.getByTestId('legend-summary-laerm-2023').click();
		await expect(page.getByTestId('legend-more-link-laerm-2023')).toHaveAttribute(
			'href',
			'/en/layer/laerm-2023'
		);
	});

	test('Layer-Palette zeigt englische Layer-/Bundle-Namen + englische Chrome-Texte', async ({
		page
	}) => {
		await page.goto('/en/explore');
		await page
			.locator('[data-testid="map-skeleton"]')
			.waitFor({ state: 'detached', timeout: 15000 });
		await page.getByRole('button', { name: /Open (layer palette|palette)/ }).click();
		const palette = page.getByTestId('layer-palette');
		await expect(palette).toBeVisible();
		await expect(page.getByRole('heading', { name: 'Select layers' })).toBeVisible();
		await expect(page.getByPlaceholder('Search layers…')).toBeVisible();
		await expect(palette.getByTestId('palette-toggle-bodenrichtwerte')).toContainText(
			'Standard land values (EUR/m²)'
		);

		const bodyText = await page.locator('body').innerText();
		expect(bodyText).not.toMatch(/(?<!\p{L})Layer auswählen(?!\p{L})/u);
		expect(bodyText).not.toMatch(/(?<!\p{L})Layer durchsuchen(?!\p{L})/u);
		expect(bodyText).not.toMatch(/(?<!\p{L})Alle deaktivieren(?!\p{L})/u);
	});

	// laerm-2023 ist ein Flächen-Choroplath (deckt praktisch ganz Berlin ab) --
	// anders als der POI-Sweep in poi-popover.e2e.ts trifft ein Hover auf die
	// Kartenmitte hier zuverlässig eine Fläche, kein Sweep nötig.
	test('Hover über die Karte zeigt englischen Tooltip-Layer-Namen + englischen Erklärtext', async ({
		page
	}) => {
		await page.goto('/en/explore?layers=laerm-2023');
		await page
			.locator('[data-testid="map-skeleton"]')
			.waitFor({ state: 'detached', timeout: 15000 });
		const map = page.locator('[role="application"]').first();
		const box = await map.boundingBox();
		if (!box) throw new Error('Map nicht renderbar');
		const cx = box.x + box.width / 2;
		const cy = box.y + box.height / 2;
		const tooltip = page.getByTestId('map-hover-tooltip');
		// Der Choroplath braucht nach dem Skeleton-Detach noch einen Moment zum
		// Stylen (MapLibre `queryRenderedFeatures` liefert erst danach Treffer).
		// Review-Fund: statt einer festen Wartezeit wird auf den Zustand
		// gewartet -- wiederholt gehovert, bis der Tooltip erscheint.
		await expect(async () => {
			await page.mouse.move(cx, cy);
			await page.mouse.move(cx + 1, cy + 1);
			await expect(tooltip).toBeVisible({ timeout: 500 });
		}).toPass({ timeout: 15000 });
		await expect(tooltip).toContainText('Noise pollution 2023');
		// i18n Block C1: der kurze Erklärtext (`getLayerExplain(slug, 'short',
		// opts)`) ist jetzt selbst lokalisiert (Messages, vormals Boundary
		// Block C: DE, unabhängig von `opts.locale`) -- kein `lang="de"`-
		// Override mehr, echter englischer Text im Tooltip.
		const explain = page.getByTestId('hover-tooltip-explain');
		await expect(explain).toContainText('Noise pollution in the area');
		await expect(explain).not.toHaveAttribute('lang', 'de');
		await expect(page.locator('main#main')).toHaveAttribute('lang', 'en');
	});
});

test.describe('i18n Block B3a: /explore (DE) bleibt unverändert', () => {
	test('Legende + Legenden-Link bleiben deutsch, Link ohne /de/-Präfix', async ({ page }) => {
		await page.goto('/explore?layers=laerm-2023');
		await page
			.locator('[data-testid="map-skeleton"]')
			.waitFor({ state: 'detached', timeout: 15000 });

		const legend = page.getByTestId('map-legend');
		await expect(legend).toBeVisible();
		await expect(legend).toContainText('Lärmbelastung 2023');
		await expect(legend).toContainText('gering');
		await expect(legend).toContainText('mittel');
		await expect(legend).toContainText('hoch');

		await page.getByTestId('legend-summary-laerm-2023').click();
		// i18n Block B3a Task 3: vorbestehender Bug (`/de/layer/...`, 301-Umweg)
		// ist gefixt -- DE hat keinen URL-Präfix.
		await expect(page.getByTestId('legend-more-link-laerm-2023')).toHaveAttribute(
			'href',
			'/layer/laerm-2023'
		);
	});

	test('Map-Controls bleiben deutsch (Karten-Steuerung, Hineinzoomen, Herauszoomen)', async ({
		page
	}) => {
		await page.goto('/explore');
		const controls = page.getByRole('group', { name: /Karten-Steuerung/i });
		await expect(controls).toBeVisible();
		await expect(controls.getByRole('button', { name: /Hineinzoomen/i })).toBeVisible();
		await expect(controls.getByRole('button', { name: /Herauszoomen/i })).toBeVisible();
	});
});
