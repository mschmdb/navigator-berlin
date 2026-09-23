import { test, expect } from '@playwright/test';
import {
	ELECTIONS,
	WINNERS_WECHSEL_KAPITEL,
	ANALYTIK_AGH_KIEZ
} from './fixtures/berlin-wahlen-fixtures.js';

// Story 3 Portal-Skeleton: URL-Sync und Steuerleisten-Verdrahtung auf der
// echten Seite. Deckt zwei Review-/Live-Funde ab: den Zwei-Effect-Revert-Loop
// (Klick wurde vom URL-Pull-Effect zurückgedreht) und das keyed-each-Duplikat
// bei zwei Stimmtyp-Rows pro Jahr.

test('Steuerleisten-Klicks schreiben die URL und revertieren nicht', async ({ page }) => {
	await page.route('**/api/wahl/list', (route) => route.fulfill({ json: ELECTIONS }));
	// Story 4: die Karte mountet jetzt immer mit; winners deterministisch mocken.
	await page.route('**/api/wahl/winners**', (route) => route.fulfill({ json: { winners: [] } }));
	await page.goto('/berlin-wahlen');

	// Duplikat-Fix: 2023 existiert als Erst- UND Zweitstimmen-Row, darf aber
	// nur einen Chip erzeugen (each_key_duplicate, User-Fund 19.09.).
	await expect(page.getByTestId('steuerleiste-jahr-2023')).toHaveCount(1);

	await page.getByTestId('steuerleiste-reihe-btw').click();
	await expect(page.getByTestId('steuerleiste-reihe-btw')).toHaveAttribute('aria-checked', 'true');
	await expect(page).toHaveURL(/reihe=btw/);

	await page.getByTestId('steuerleiste-ebene-bezirk').click();
	await expect(page).toHaveURL(/ebene=bezirk/);
	await expect(page.getByTestId('steuerleiste-reihe-btw')).toHaveAttribute('aria-checked', 'true');

	// Zurück auf Defaults: Query-Params verschwinden wieder (kein Müll).
	// Story 5: Default-Ebene ist jetzt stimmbezirk (Tagesspiegel-Referenz).
	await page.getByTestId('steuerleiste-reihe-agh').click();
	await page.getByTestId('steuerleiste-ebene-stimmbezirk').click();
	await expect(page).not.toHaveURL(/reihe=/);
	await expect(page).not.toHaveURL(/ebene=/);
});

test('Kapitel-Nav: Klick aktiviert das geklickte Kapitel', async ({ page }) => {
	await page.route('**/api/wahl/list', (route) => route.fulfill({ json: ELECTIONS }));
	await page.route('**/api/wahl/winners**', (route) => route.fulfill({ json: { winners: [] } }));
	await page.goto('/berlin-wahlen');
	await page.getByTestId('kapitel-nav-link-trends').click();
	await expect(page.getByTestId('kapitel-nav-link-trends')).toHaveAttribute('aria-current', 'true');
	await expect(page.getByTestId('kapitel-nav-link-wechsel')).not.toHaveAttribute(
		'aria-current',
		'true'
	);
});

// Story 12: eigener Nav-Eintrag „Übergänge" für das aus dem Trends-Kapitel
// ausgezogene Sankey-Kapitel -- Klick scrollt hin, Anker landet unter dem
// Sticky-Stapel (Review Triage Log #5-Muster).
test('Kapitel-Nav: Klick auf „Übergänge" scrollt zum Sankey-Kapitel, Anker landet unter der Sticky-Nav', async ({
	page
}) => {
	await page.route('**/api/wahl/list', (route) => route.fulfill({ json: ELECTIONS }));
	await page.route('**/api/wahl/winners**', (route) => route.fulfill({ json: { winners: [] } }));
	// Review Triage Log #10: das Trends-Kapitel der selben Seite lädt Analytik
	// unabhängig vom aktiven Nav-Eintrag -- ohne Stub liefe es real und würde
	// den Test flaky/langsam machen.
	await page.route('**/api/wahl/analytik**', (route) => route.fulfill({ json: ANALYTIK_AGH_KIEZ }));
	await page.goto('/berlin-wahlen');

	await page.getByTestId('kapitel-nav-link-uebergaenge').click();
	await expect(page.getByTestId('kapitel-nav-link-uebergaenge')).toHaveAttribute(
		'aria-current',
		'true'
	);
	await expect(page.getByTestId('wahl-portal-chapter-uebergaenge')).toBeInViewport();

	const headingBox = await page.locator('#uebergaenge-h').boundingBox();
	const kapitelNavBox = await page.getByTestId('kapitel-nav').boundingBox();
	if (!headingBox || !kapitelNavBox) {
		throw new Error('Übergänge-Überschrift oder Kapitel-Nav nicht renderbar');
	}
	expect(headingBox.y).toBeGreaterThanOrEqual(kapitelNavBox.y + kapitelNavBox.height - 1);
});

// Review Triage Log #9: kein Test prüfte bisher, dass jedes Kapitel seinen
// Erklär-Subtext zeigt (AC „jedes Kapitel bekommt 1-2 Sätze Subtext").
test('Kapitel-Subtexte: alle sechs Kapitel zeigen ihren Erklär-Subtext', async ({ page }) => {
	await page.route('**/api/wahl/list', (route) => route.fulfill({ json: ELECTIONS }));
	await page.route('**/api/wahl/winners**', (route) => route.fulfill({ json: { winners: [] } }));
	await page.route('**/api/wahl/analytik**', (route) => route.fulfill({ json: ANALYTIK_AGH_KIEZ }));
	await page.goto('/berlin-wahlen');

	const chapterIds = ['karte', 'wechsel', 'trends', 'uebergaenge', 'extreme-gebiete', 'methodik'];
	for (const id of chapterIds) {
		await expect(page.getByTestId(`wahl-portal-chapter-${id}-subtext`)).toBeVisible();
	}
	await expect(page.getByTestId('wahl-portal-chapter-karte-subtext')).toContainText('Gewinner-Tab');
});

// Story 10 (Steuerungs-Klarheit): die Wahl-Reihe ist jetzt der einzige
// seitenweite Zustand, sichtbar über eine eigene sticky Leiste; Jahr/Ebene
// zogen als Karten-Controls in das Karte-Kapitel um. Deckt die AC "Sticky
// bleibt nach Scroll sichtbar, Reihen-Wechsel wirkt ohne Zurückscrollen" ab.
test('Sticky-Reihen-Leiste bleibt nach Scroll sichtbar; Reihen-Wechsel aktualisiert die Kontext-Badges ohne Zurückscrollen', async ({
	page
}) => {
	await page.route('**/api/wahl/list', (route) => route.fulfill({ json: ELECTIONS }));
	await page.route('**/api/wahl/winners**', (route) => route.fulfill({ json: { winners: [] } }));
	await page.goto('/berlin-wahlen');

	await expect(page.getByTestId('wahl-portal-chapter-wechsel')).toContainText(
		'Abgeordnetenhaus · alle Wahljahre · Kiez-Ebene'
	);
	// Story 12/Review Triage Log #11: der Sankey (mit seinem eigenen
	// Kiez/Bezirk-Toggle) zog in ein eigenes Kapitel um -- das Trends-Kapitel
	// ist reine Kiez-Ebene, das Badge nennt sie deshalb wieder.
	const trendsBadge = page
		.getByTestId('wahl-portal-chapter-trends')
		.getByTestId('kapitel-kontext-badge');
	await expect(trendsBadge).toContainText('Abgeordnetenhaus · alle Wahljahre · Kiez-Ebene');

	// Review Triage Log #4: Extreme-Badge folgt dem Karten-Jahr (Default 2023
	// aus der agh-Fixture). Vor dem Reihen-Wechsel geprüft, weil 2021 nur zu
	// den Jahr-Optionen der agh-Reihe passt.
	await expect(page.getByTestId('wahl-portal-chapter-extreme-gebiete')).toContainText('Wahl 2023');
	await page.getByTestId('steuerleiste-jahr-2021').click();
	await expect(page.getByTestId('wahl-portal-chapter-extreme-gebiete')).toContainText('Wahl 2021');

	// Ans Seitenende scrollen (Methodik-Kapitel): die Reihen-Leiste bleibt
	// sticky sichtbar, Jahr/Ebene (jetzt im Karte-Kapitel) scrollen mit.
	await page.getByTestId('wahl-portal-chapter-methodik').scrollIntoViewIfNeeded();
	await expect(page.getByTestId('reihen-leiste')).toBeInViewport();
	// Review Triage Log #6: `methodik`-in-Viewport statt `not.toBeInViewport`
	// auf `ueberblick` -- letzteres ist anfällig für scrollY-Clamping (ein
	// Reihen-Wechsel kann die Dokument-Höhe schrumpfen, wodurch der Browser
	// scrollY passiv auf die neue Maximalhöhe klemmt und `ueberblick` wieder
	// in den Viewport rutscht, ohne dass die Seite wirklich gesprungen ist).
	await expect(page.getByTestId('wahl-portal-chapter-methodik')).toBeInViewport();

	// Review Triage Log #5: Kapitel-Nav liegt unter der Reihen-Leiste, keine
	// Überdeckung (-1px Toleranz für Subpixel-Rundung).
	const reihenLeisteBox = await page.getByTestId('reihen-leiste').boundingBox();
	const kapitelNavBox = await page.getByTestId('kapitel-nav').boundingBox();
	if (!reihenLeisteBox || !kapitelNavBox) throw new Error('Sticky-Leisten nicht renderbar');
	expect(kapitelNavBox.y).toBeGreaterThanOrEqual(reihenLeisteBox.y + reihenLeisteBox.height - 1);

	// Reihen-Wechsel wirkt sofort auf alle Kapitel (Karte, Wechsel, Trends,
	// Extreme), ohne dass die Seite zurück nach oben springt. Nicht per
	// scrollY-Pixelvergleich geprüft: ein Reihen-Wechsel kann die
	// Dokument-Höhe verändern (andere Kapitel-Inhalte je Reihe), wodurch der
	// Browser scrollY passiv auf die neue Maximalhöhe klemmt -- das ist kein
	// App-Bug. Die eigentliche AC (kein Sprung zum Seitenanfang) prüft die
	// Sichtbarkeit von Leiste vs. Methodik-Kapitel.
	await page.getByTestId('steuerleiste-reihe-btw').click();
	await expect(page).toHaveURL(/reihe=btw/);
	await expect(page.getByTestId('wahl-portal-chapter-wechsel')).toContainText(
		'Bundestag · alle Wahljahre · Kiez-Ebene'
	);
	await expect(trendsBadge).toContainText('Bundestag · alle Wahljahre · Kiez-Ebene');
	await expect(page.getByTestId('reihen-leiste')).toBeInViewport();
	await expect(page.getByTestId('wahl-portal-chapter-methodik')).toBeInViewport();

	// Review Triage Log #5: Anker-Sprung landet nicht unter dem Sticky-Stapel
	// -- die Trends-Überschrift steht unterhalb der Kapitel-Nav-Unterkante.
	await page.getByTestId('kapitel-nav-link-trends').click();
	const trendsHeadingBox = await page.locator('#trends-h').boundingBox();
	const kapitelNavBoxAfterJump = await page.getByTestId('kapitel-nav').boundingBox();
	if (!trendsHeadingBox || !kapitelNavBoxAfterJump) {
		throw new Error('Trends-Überschrift oder Kapitel-Nav nicht renderbar');
	}
	expect(trendsHeadingBox.y).toBeGreaterThanOrEqual(
		kapitelNavBoxAfterJump.y + kapitelNavBoxAfterJump.height - 1
	);
});

// Story 4 (Winner-Map): reale Geometrie kommt aus static/layers (kein Mock nötig,
// echte MANIFEST.json + lor-bezirksregion.geojson liegen im Preview-Build).
// `mv-nord` und `marienfelde-nord` sind eindeutige BZR-Namen (kein Slug-Suffix).
const WINNERS_AGH_KIEZ = {
	typ: 'agh',
	stimmtyp: 'zweitstimme',
	ebene: 'kiez',
	winners: [
		{
			jahr: 2023,
			gebiet_slug: 'mv-nord',
			partei: 'SPD',
			farbe_hex: '#A50C1A',
			anteil: 0.4,
			is_repeat_election: true,
			parent_slug: '2021-agh-zweitstimme'
		},
		{
			jahr: 2023,
			gebiet_slug: 'marienfelde-nord',
			partei: 'GRÜNE',
			farbe_hex: '#0F6E2C',
			anteil: 0.3,
			is_repeat_election: true,
			parent_slug: '2021-agh-zweitstimme'
		},
		{
			jahr: 2021,
			gebiet_slug: 'mv-nord',
			partei: 'CDU',
			farbe_hex: '#1A1A1A',
			anteil: 0.5,
			is_repeat_election: false,
			parent_slug: null
		}
	],
	license: 'dl-de/by-2.0',
	source_url: 'https://example.invalid/agh23',
	source_name: 'Amt für Statistik Berlin-Brandenburg'
};

test('Winner-Map (Ebene kiez): Karte + Tabelle rendern, Jahr-Wechsel ohne neuen Winners-Request', async ({
	page
}) => {
	await page.route('**/api/wahl/list', (route) => route.fulfill({ json: ELECTIONS }));

	let winnersRequestCount = 0;
	await page.route('**/api/wahl/winners**', (route) => {
		winnersRequestCount++;
		return route.fulfill({ json: WINNERS_AGH_KIEZ });
	});

	// Explizit ebene=kiez: Story 5 macht stimmbezirk zum Default, dieser Test
	// deckt weiter den unveränderten Bulk-Reihe-Pfad ab (AC: kiez/bezirk-
	// Semantik unverändert).
	await page.goto('/berlin-wahlen?ebene=kiez');

	// Kapitel rendert den Karten-Container (Default-Reihe agh, Default-Jahr 2023).
	// Fixture hat 1:1-Gleichstand SPD/GRÜNE; der Takeaway löst alphabetisch auf.
	await expect(page.getByTestId('winner-map-canvas')).toBeVisible();
	await expect(page.getByTestId('winner-map-takeaway')).toContainText('GRÜNE');
	expect(winnersRequestCount).toBe(1);

	// Tabellen-Alternative liefert die gejointen Rows. Scope aufs Karte-
	// Kapitel: das Wechsel-Kapitel (Story 7) hat auf derselben Seite eine
	// eigene Tabellen-Alternative mit demselben Testid.
	const karteChapter = page.getByTestId('wahl-portal-chapter-karte');
	await karteChapter.getByTestId('table-toggle').click();
	await expect(karteChapter.getByTestId('data-table')).toBeVisible();
	await expect(karteChapter.getByTestId('data-table')).toContainText('SPD');
	await expect(karteChapter.getByTestId('data-table')).toContainText('GRÜNE');

	// Jahr-Wechsel: nur Client-Filter auf die bereits geladene Bulk-Response,
	// kein zweiter /api/wahl/winners-Request pro Reihe×Ebene.
	await page.getByTestId('steuerleiste-jahr-2021').click();
	await expect(page.getByTestId('winner-map-takeaway')).toContainText('CDU');
	expect(winnersRequestCount).toBe(1);
});

// `reinickendorf` ist ein eindeutiger Gemeinde_name (bare normalizeSlug, kein Suffix).
const WINNERS_AGH_BEZIRK = {
	typ: 'agh',
	stimmtyp: 'zweitstimme',
	ebene: 'bezirk',
	winners: [
		{
			jahr: 2023,
			gebiet_slug: 'reinickendorf',
			partei: 'CDU',
			farbe_hex: '#1A1A1A',
			anteil: 0.35,
			is_repeat_election: true,
			parent_slug: '2021-agh-zweitstimme'
		}
	],
	license: 'dl-de/by-2.0',
	source_url: 'https://example.invalid/agh23',
	source_name: 'Amt für Statistik Berlin-Brandenburg'
};

test('Winner-Map (Ebene kiez/bezirk): Ebenen-Wechsel aktualisiert die bestehende Karte statt sie zu zerstören', async ({
	page
}) => {
	await page.route('**/api/wahl/list', (route) => route.fulfill({ json: ELECTIONS }));
	await page.route('**/api/wahl/winners**', (route) => {
		const url = new URL(route.request().url());
		const ebene = url.searchParams.get('ebene');
		return route.fulfill({ json: ebene === 'bezirk' ? WINNERS_AGH_BEZIRK : WINNERS_AGH_KIEZ });
	});

	await page.goto('/berlin-wahlen?ebene=kiez');

	await expect(page.getByTestId('winner-map-canvas')).toBeVisible();
	await expect(page.getByTestId('winner-map-takeaway')).toContainText('GRÜNE');

	// Live-Fund 19.09.: Ebene-Wechsel darf die Karte NICHT aus dem DOM nehmen
	// (Destroy+Re-Init-Bug); sie muss sichtbar bleiben und ohne Reload auf die
	// neue Ebene aktualisieren.
	await page.getByTestId('steuerleiste-ebene-bezirk').click();
	await expect(page.getByTestId('winner-map-canvas')).toBeVisible();
	await expect(page.getByTestId('winner-map-takeaway')).toContainText('CDU');
	await expect(page.getByTestId('winner-map-loading')).not.toBeVisible();
	await expect(page.getByTestId('winner-map-empty')).not.toBeVisible();
});

// Story 5, ab Story 17 auf Briefwahl-Gruppen umgestellt: Stimmbezirks-
// Winners jahrweise (ebene=stimmbezirk verlangt jahr), gebiet_slug ist die
// Briefwahl-Gruppen-ID, nicht mehr die einzelne Urnen-uwbId (Review-Fund:
// die e2e-Fixtures nutzten noch die alte Urnen-ID '01W100', die gegen die
// dissolvierte wahlgruppen-*-Geometrie nicht mehr matcht -- der Join lief
// still ins Leere). `01B1A` ist eine echte Gruppen-ID aus
// static/layers/wahlgruppen-ah21*.geojson UND wahlgruppen-ah16*.geojson
// (BEZ=01, BWB3/BWB-Suffix=1A) -- dieselbe Gruppe existiert in beiden
// Geometrie-Generationen, deckt also sowohl den Default-Render (ah21) als
// auch den Geo-Swap-Test (ah16 -> ah21) ab.
const STIMMBEZIRK_WINNERS_BY_JAHR: Record<string, unknown> = {
	'2023': {
		typ: 'agh',
		stimmtyp: 'zweitstimme',
		ebene: 'stimmbezirk',
		jahr: 2023,
		geo_slug: 'ah21',
		winners: [
			{
				jahr: 2023,
				gebiet_slug: '01B1A',
				partei: 'SPD',
				farbe_hex: '#A50C1A',
				anteil: 0.4,
				is_repeat_election: true,
				parent_slug: '2021-agh-zweitstimme'
			}
		],
		license: 'dl-de/by-2.0',
		source_url: 'https://example.invalid/agh23',
		source_name: 'Amt für Statistik Berlin-Brandenburg'
	},
	'2021': {
		typ: 'agh',
		stimmtyp: 'zweitstimme',
		ebene: 'stimmbezirk',
		jahr: 2021,
		geo_slug: 'ah21',
		winners: [
			{
				jahr: 2021,
				gebiet_slug: '01B1A',
				partei: 'CDU',
				farbe_hex: '#1A1A1A',
				anteil: 0.5,
				is_repeat_election: false,
				parent_slug: null
			}
		],
		license: 'dl-de/by-2.0',
		source_url: 'https://example.invalid/agh21',
		source_name: 'Amt für Statistik Berlin-Brandenburg'
	},
	'2016': {
		typ: 'agh',
		stimmtyp: 'zweitstimme',
		ebene: 'stimmbezirk',
		jahr: 2016,
		geo_slug: 'ah16',
		winners: [
			{
				jahr: 2016,
				gebiet_slug: '01B1A',
				partei: 'GRÜNE',
				farbe_hex: '#0F6E2C',
				anteil: 0.35,
				is_repeat_election: false,
				parent_slug: null
			}
		],
		license: 'dl-de/by-2.0',
		source_url: 'https://example.invalid/agh16',
		source_name: 'Amt für Statistik Berlin-Brandenburg'
	}
};

async function routeStimmbezirkWinners(page: import('@playwright/test').Page): Promise<void> {
	await page.route('**/api/wahl/winners**', (route) => {
		const url = new URL(route.request().url());
		const ebene = url.searchParams.get('ebene');
		const jahr = url.searchParams.get('jahr');
		if (ebene === 'stimmbezirk') {
			const body = (jahr && STIMMBEZIRK_WINNERS_BY_JAHR[jahr]) ?? {
				typ: 'agh',
				stimmtyp: 'zweitstimme',
				ebene: 'stimmbezirk',
				jahr: jahr ? Number(jahr) : null,
				geo_slug: null,
				winners: []
			};
			return route.fulfill({ json: body });
		}
		return route.fulfill({ json: { winners: [] } });
	});
}

test('Winner-Map (Ebene stimmbezirk): Default-Ansicht rendert die Stimmbezirks-Karte', async ({
	page
}) => {
	await page.route('**/api/wahl/list', (route) => route.fulfill({ json: ELECTIONS }));
	await routeStimmbezirkWinners(page);

	// Kaltstart ohne Params: Default-Ebene ist stimmbezirk (Story 5), URL bleibt param-frei.
	await page.goto('/berlin-wahlen');
	await expect(page).not.toHaveURL(/ebene=/);

	await expect(page.getByTestId('winner-map-canvas')).toBeVisible();
	await expect(page.getByTestId('winner-map-takeaway')).toContainText('SPD');
	await expect(page.getByTestId('winner-map-fallback-hinweis')).not.toBeVisible();

	// Kapitel-Scoping (Story 8): das Trends-Kapitel mountet ab hier auf jeder
	// Seite mit und hat eine eigene Tabellen-Alternative mit demselben Testid.
	const karteChapter = page.getByTestId('wahl-portal-chapter-karte');
	await karteChapter.getByTestId('table-toggle').click();
	await expect(karteChapter.getByTestId('data-table')).toContainText('Stimmbezirke 100, 124 und Briefwahl 1A');
});

test('Winner-Map (Ebene stimmbezirk): Ebenen-Wechsel zu kiez aktualisiert die bestehende Karte', async ({
	page
}) => {
	await page.route('**/api/wahl/list', (route) => route.fulfill({ json: ELECTIONS }));
	await page.route('**/api/wahl/winners**', (route) => {
		const url = new URL(route.request().url());
		const ebene = url.searchParams.get('ebene');
		const jahr = url.searchParams.get('jahr');
		if (ebene === 'stimmbezirk') {
			return route.fulfill({
				json: (jahr && STIMMBEZIRK_WINNERS_BY_JAHR[jahr]) ?? { winners: [] }
			});
		}
		return route.fulfill({ json: WINNERS_AGH_KIEZ });
	});

	await page.goto('/berlin-wahlen');
	await expect(page.getByTestId('winner-map-canvas')).toBeVisible();
	await expect(page.getByTestId('winner-map-takeaway')).toContainText('SPD');

	// Ebene-Wechsel (Live-Fund 19.09.): Karte bleibt im DOM, aktualisiert nur.
	await page.getByTestId('steuerleiste-ebene-kiez').click();
	await expect(page).toHaveURL(/ebene=kiez/);
	await expect(page.getByTestId('winner-map-canvas')).toBeVisible();
	await expect(page.getByTestId('winner-map-takeaway')).toContainText('GRÜNE');

	// Zurück zu stimmbezirk: wieder sichtbar, wieder SPD (Cache-Hit, kein Datenverlust).
	await page.getByTestId('steuerleiste-ebene-stimmbezirk').click();
	await expect(page.getByTestId('winner-map-canvas')).toBeVisible();
	await expect(page.getByTestId('winner-map-takeaway')).toContainText('SPD');
});

test('Winner-Map (Ebene stimmbezirk): Jahr-Wechsel swappt die Geometrie ohne Karten-Verlust', async ({
	page
}) => {
	await page.route('**/api/wahl/list', (route) => route.fulfill({ json: ELECTIONS }));
	await routeStimmbezirkWinners(page);

	await page.goto('/berlin-wahlen');
	await expect(page.getByTestId('winner-map-canvas')).toBeVisible();
	await expect(page.getByTestId('winner-map-takeaway')).toContainText('SPD');

	// AGH 2021: gleiche Geometrie-Generation (ah21), kein Swap.
	await page.getByTestId('steuerleiste-jahr-2021').click();
	await expect(page.getByTestId('winner-map-canvas')).toBeVisible();
	await expect(page.getByTestId('winner-map-takeaway')).toContainText('CDU');

	// AGH 2016: Geometrie-Generation wechselt ah21 -> ah16 (setData auf der
	// bestehenden Instanz, Bestands-Boundary: nie Re-Init). Karte bleibt sichtbar.
	await page.getByTestId('steuerleiste-jahr-2016').click();
	await expect(page.getByTestId('winner-map-canvas')).toBeVisible();
	await expect(page.getByTestId('winner-map-takeaway')).toContainText('GRÜNE');
});

// Story 6 (Ergebnis-Panel): Series-berlin-Mock für die AGH-Reihe. CDU 2023
// 0.282 deckt die AC „AGH 2023 CDU ≈ 0,282" auch auf E2E-Ebene ab.
const SERIES_BERLIN_AGH = {
	typ: 'agh',
	stimmtyp: 'zweitstimme',
	ebene: 'berlin',
	gebiet: 'berlin',
	coverage_ab: 2021,
	points: [
		{
			jahr: 2021,
			partei: 'CDU',
			farbe_hex: '#1A1A1A',
			anteil: 0.18,
			stimmen: 950000,
			is_repeat_election: false,
			parent_slug: null
		},
		{
			jahr: 2021,
			partei: 'SPD',
			farbe_hex: '#A50C1A',
			anteil: 0.213,
			stimmen: 1100000,
			is_repeat_election: false,
			parent_slug: null
		},
		{
			jahr: 2023,
			partei: 'CDU',
			farbe_hex: '#1A1A1A',
			anteil: 0.282,
			stimmen: 1600000,
			is_repeat_election: true,
			parent_slug: '2021-agh-zweitstimme'
		},
		{
			jahr: 2023,
			partei: 'SPD',
			farbe_hex: '#A50C1A',
			anteil: 0.184,
			stimmen: 1050000,
			is_repeat_election: true,
			parent_slug: '2021-agh-zweitstimme'
		}
	],
	license: 'dl-de/by-2.0',
	source_url: 'https://example.invalid/agh23',
	source_name: 'Amt für Statistik Berlin-Brandenburg'
};

test('Ergebnis-Panel: rendert neben der Karte mit Berlin-Werten, Stimmbezirks-Hinweis auf der Default-Ebene', async ({
	page
}) => {
	await page.route('**/api/wahl/list', (route) => route.fulfill({ json: ELECTIONS }));
	await routeStimmbezirkWinners(page);

	let seriesRequestCount = 0;
	await page.route('**/api/wahl/series**', (route) => {
		seriesRequestCount++;
		return route.fulfill({ json: SERIES_BERLIN_AGH });
	});

	// Default-Ansicht: Reihe agh, Jahr 2023, Ebene stimmbezirk.
	await page.goto('/berlin-wahlen');
	await expect(page.getByTestId('winner-map-canvas')).toBeVisible();

	await expect(page.getByTestId('ergebnis-panel')).toBeVisible();
	await expect(page.getByTestId('ergebnis-panel-anteil-CDU')).toHaveText('28,2 %');
	await expect(page.getByTestId('ergebnis-panel-delta-CDU')).toHaveText('+10,2 Pp.');
	await expect(page.getByTestId('ergebnis-panel-delta-SPD')).toHaveText('−2,9 Pp.');
	await expect(page.getByTestId('ergebnis-panel-stimmbezirk-hinweis')).toBeVisible();
	await expect(page.getByTestId('ergebnis-panel-gebiet-block')).not.toBeVisible();
	expect(seriesRequestCount).toBe(1);

	// Jahr-Wechsel: Deltas aktualisieren sich aus dem bereits geladenen
	// Series-Response, kein zweiter Request (Boundary: eine Reihen-Anfrage
	// deckt alle Jahre ab).
	await page.getByTestId('steuerleiste-jahr-2021').click();
	await expect(page.getByTestId('ergebnis-panel-anteil-CDU')).toHaveText('18,0 %');
	await expect(page.getByTestId('ergebnis-panel-delta-CDU')).not.toBeVisible();
	expect(seriesRequestCount).toBe(1);
});

// Story 7 (Zeit-Animation): Play-Durchlauf auf Kiez-Ebene. WINNERS_AGH_KIEZ
// (oben, Story 4) hat genau zwei Jahre (2021/2023) -- reicht, um Play von
// 2021 nach 2023 laufen zu lassen und die Auto-Pause zu pruefen.
test('Zeit-Animation (Ebene kiez): Play-Durchlauf faerbt ohne neuen Winners-Request um, pausiert am letzten Jahr, URL traegt Endjahr', async ({
	page
}) => {
	await page.route('**/api/wahl/list', (route) => route.fulfill({ json: ELECTIONS }));
	let winnersRequestCount = 0;
	await page.route('**/api/wahl/winners**', (route) => {
		winnersRequestCount++;
		return route.fulfill({ json: WINNERS_AGH_KIEZ });
	});

	await page.goto('/berlin-wahlen?ebene=kiez');
	await expect(page.getByTestId('winner-map-canvas')).toBeVisible();

	// Start bei 2021 (aeltestes verfuegbares Jahr der Fixture), damit Play
	// tatsaechlich einen Schritt vorwaerts macht.
	await page.getByTestId('steuerleiste-jahr-2021').click();
	await expect(page.getByTestId('zeit-animation-slider')).toHaveAttribute('aria-valuetext', '2021');

	const playButton = page.getByTestId('zeit-animation-play');
	await playButton.click();
	await expect(playButton).toHaveAttribute('aria-pressed', 'true');
	// Karte bleibt waehrend der gesamten Wiedergabe sichtbar (kein Re-Init).
	await expect(page.getByTestId('winner-map-canvas')).toBeVisible();

	// ~1,5s/Jahr + Puffer: ein Schritt reicht bis zum letzten Jahr (2023),
	// danach pausiert die Animation automatisch.
	await expect(playButton).toHaveAttribute('aria-pressed', 'false', { timeout: 4000 });
	// WINNERS_AGH_KIEZ markiert 2023 als Wiederholungswahl -- aria-valuetext
	// traegt den Zusatz (Boundary: Jahr(+„Wiederholungswahl")).
	await expect(page.getByTestId('zeit-animation-slider')).toHaveAttribute(
		'aria-valuetext',
		'2023 Wiederholungswahl'
	);
	await expect(page.getByTestId('winner-map-canvas')).toBeVisible();
	await expect(page).toHaveURL(/jahr=2023/);

	// Kein weiterer Bulk-Request pro Jahr -- die Animation faerbt nur um.
	expect(winnersRequestCount).toBe(1);
});

test('Zeit-Animation (Ebene stimmbezirk): zeigt Hinweis + Zur-Kiez-Ebene-Button statt Play/Slider', async ({
	page
}) => {
	await page.route('**/api/wahl/list', (route) => route.fulfill({ json: ELECTIONS }));
	await page.route('**/api/wahl/winners**', (route) => {
		const url = new URL(route.request().url());
		const ebene = url.searchParams.get('ebene');
		const jahr = url.searchParams.get('jahr');
		if (ebene === 'stimmbezirk') {
			const body = (jahr && STIMMBEZIRK_WINNERS_BY_JAHR[jahr]) ?? { winners: [] };
			return route.fulfill({ json: body });
		}
		return route.fulfill({ json: WINNERS_AGH_KIEZ });
	});

	// Default-Ansicht: Ebene stimmbezirk (Story 5).
	await page.goto('/berlin-wahlen');
	await expect(page.getByTestId('winner-map-canvas')).toBeVisible();

	await expect(page.getByTestId('zeit-animation-hinweis')).toBeVisible();
	await expect(page.getByTestId('zeit-animation-play')).not.toBeVisible();
	await expect(page.getByTestId('zeit-animation-slider')).not.toBeVisible();

	await page.getByTestId('zeit-animation-zur-kiez-button').click();
	await expect(page).toHaveURL(/ebene=kiez/);
	await expect(page.getByTestId('zeit-animation-play')).toBeVisible();
	await expect(page.getByTestId('zeit-animation-hinweis')).not.toBeVisible();
});

// Story 7 (Wechsel-Kapitel): `WINNERS_WECHSEL_KAPITEL` (2016 SPD -> 2021
// GRÜNE -> 2023 Wiederholungswahl GRÜNE, genau ein Wechsel an 2021->2023,
// siehe wechsel-data.test.ts Klammer-Test) liegt jetzt in
// `fixtures/berlin-wahlen-fixtures.ts` -- geteilt mit `a11y.e2e.ts` (Review
// Triage Log #9: der Axe-Scan des Portals braucht ein sichtbares
// Trends-Kapitel mit einem gerenderten Sankey-Band).

test('Wechsel-Kapitel: rendert die Liste aus der Fixture (Gebiet, Jahr, Von -> Nach)', async ({
	page
}) => {
	await page.route('**/api/wahl/list', (route) => route.fulfill({ json: ELECTIONS }));
	await page.route('**/api/wahl/winners**', (route) =>
		route.fulfill({ json: WINNERS_WECHSEL_KAPITEL })
	);

	await page.goto('/berlin-wahlen');
	await expect(page.getByTestId('wahl-portal-chapter-wechsel')).toBeVisible();

	const eintrag = page.getByTestId('wechsel-kapitel-eintrag');
	await expect(eintrag).toBeVisible();
	await expect(eintrag).toContainText('2023');
	await expect(page.getByTestId('wechsel-kapitel-von')).toContainText('SPD');
	await expect(page.getByTestId('wechsel-kapitel-nach')).toContainText('GRÜNE');
	await expect(page.getByTestId('wechsel-kapitel-canvas')).toBeVisible();
	// Review Triage Log #8: deckt den ungetesteten `defaultMapFactory`-Pfad ab
	// -- die vorherige Assertion prüfte nur den Container-Div, nicht dass
	// MapLibre darin tatsächlich einen Canvas rendert.
	await expect(
		page.getByTestId('wechsel-kapitel-canvas').locator('canvas.maplibregl-canvas')
	).toBeVisible();
});

// Story 8 (Trends/Sankey): `ANALYTIK_AGH_KIEZ` liegt jetzt ebenfalls in
// `fixtures/berlin-wahlen-fixtures.ts` (s. o.). `mv-nord` deckt sich mit
// `WINNERS_WECHSEL_KAPITEL`, damit Geometrie + Analytik dasselbe Gebiet
// treffen.

test('Trends-Kapitel: rendert Karte aus Fixtures, Toggle wechselt ohne neuen Analytik-Request', async ({
	page
}) => {
	await page.route('**/api/wahl/list', (route) => route.fulfill({ json: ELECTIONS }));
	await page.route('**/api/wahl/winners**', (route) =>
		route.fulfill({ json: WINNERS_WECHSEL_KAPITEL })
	);
	let analytikRequestCount = 0;
	await page.route('**/api/wahl/analytik**', (route) => {
		analytikRequestCount++;
		return route.fulfill({ json: ANALYTIK_AGH_KIEZ });
	});

	await page.goto('/berlin-wahlen');
	await expect(page.getByTestId('wahl-portal-chapter-trends')).toBeVisible();

	const trendsChapter = page.getByTestId('wahl-portal-chapter-trends');
	await expect(trendsChapter.getByTestId('trends-kapitel-canvas')).toBeVisible();
	// Review Triage Log #8: deckt den ungetesteten `defaultMapFactory`-Pfad ab.
	await expect(
		trendsChapter.getByTestId('trends-kapitel-canvas').locator('canvas.maplibregl-canvas')
	).toBeVisible();
	await expect(trendsChapter.getByTestId('trends-kapitel-takeaway')).toContainText('SPD');
	expect(analytikRequestCount).toBe(1);

	// Toggle Trend -> Volatilität: nur Paint-Wechsel, kein neuer Analytik-Request.
	await trendsChapter.getByTestId('trends-kapitel-toggle-volatilitaet').click();
	await expect(trendsChapter.getByTestId('trends-kapitel-toggle-volatilitaet')).toHaveAttribute(
		'aria-checked',
		'true'
	);
	expect(analytikRequestCount).toBe(1);
});

// Story 12: der Sankey zog aus dem Trends-Kapitel in ein eigenes Kapitel
// „Übergänge" um -- eigener Nav-Eintrag, eigenes Kapitel-Testid.
test('Übergänge-Kapitel: rendert den Sankey aus Fixtures, eigener Nav-Eintrag', async ({
	page
}) => {
	await page.route('**/api/wahl/list', (route) => route.fulfill({ json: ELECTIONS }));
	// WINNERS_WECHSEL_KAPITEL (3 Kalenderjahre je Gebiet, 2 effektive Spalten
	// nach der Wiederholungs-Regel) statt WINNERS_AGH_KIEZ (nur 2 Kalenderjahre
	// -> kollabiert auf 1 effektive Spalte, kein Übergang für den Sankey).
	await page.route('**/api/wahl/winners**', (route) =>
		route.fulfill({ json: WINNERS_WECHSEL_KAPITEL })
	);
	// Review Triage Log #10: das Trends-Kapitel der selben Seite lädt Analytik
	// unabhängig vom aktiven Nav-Eintrag -- ohne Stub liefe es real.
	await page.route('**/api/wahl/analytik**', (route) => route.fulfill({ json: ANALYTIK_AGH_KIEZ }));

	await page.goto('/berlin-wahlen');
	await page.getByTestId('kapitel-nav-link-uebergaenge').click();
	await expect(page.getByTestId('kapitel-nav-link-uebergaenge')).toHaveAttribute(
		'aria-current',
		'true'
	);

	const uebergaengeChapter = page.getByTestId('wahl-portal-chapter-uebergaenge');
	await expect(uebergaengeChapter).toBeVisible();
	await expect(uebergaengeChapter.getByTestId('sankey-wahljahre-svg')).toBeVisible();

	const sankeyTabelle = page.getByTestId('sankey-wahljahre').getByTestId('table-toggle');
	await sankeyTabelle.click();
	// WINNERS_WECHSEL_KAPITEL (mv-nord: 2016 SPD -> 2021 GRÜNE -> 2023(W)
	// GRÜNE) kollabiert auf die effektive Reihe 2016 SPD -> 2023 GRÜNE -- die
	// Tabelle muss die konkreten Fixture-Werte zeigen, nicht nur die
	// Überschrift „Gebiete" (Review Triage Log #22).
	const sankeyDataTable = page.getByTestId('sankey-wahljahre').getByTestId('data-table');
	await expect(sankeyDataTable).toContainText('Gebiete');
	await expect(sankeyDataTable).toContainText('SPD');
	await expect(sankeyDataTable).toContainText('GRÜNE');
	await expect(sankeyDataTable).toContainText('2023');
	await expect(sankeyDataTable).toContainText('1');
});

// Story 11 (Sankey-Rework): Hover-Smoke im echten Browser-Layout -- der
// Komponenten-Test (`sankey-wahljahre.svelte.test.ts`) prüft denselben
// Handler per direktem `pointermove`-Event (Playwright-`hover()` verlangt
// eine als sichtbar/stabil erkannte Bounding-Box, die im isolierten
// Komponenten-Test ohne volles Layout unzuverlässig ist); hier läuft die
// echte Seite mit echtem CSS, `hover()` ist deshalb zuverlässig.
// Story 12: Sankey-Kapitel-Scope zog von „trends" auf „uebergaenge" um.
test('Sankey-Hover: ein Partei-Band zeigt den Tooltip mit Von/Nach/Anzahl', async ({ page }) => {
	await page.route('**/api/wahl/list', (route) => route.fulfill({ json: ELECTIONS }));
	await page.route('**/api/wahl/winners**', (route) =>
		route.fulfill({ json: WINNERS_WECHSEL_KAPITEL })
	);
	await page.route('**/api/wahl/analytik**', (route) => route.fulfill({ json: ANALYTIK_AGH_KIEZ }));

	await page.goto('/berlin-wahlen');
	await page.getByTestId('kapitel-nav-link-uebergaenge').click();
	const uebergaengeChapter = page.getByTestId('wahl-portal-chapter-uebergaenge');
	await expect(uebergaengeChapter.getByTestId('sankey-wahljahre-svg')).toBeVisible();

	// `dispatchEvent` statt `hover()`: Playwrights Actionability-Check
	// hittestet die Mitte der Bounding-Box bzw. verlangt einen Viewport-Punkt
	// für die echte Maus-Bewegung; bei einer gebogenen Bezier-Ribbon-Form
	// (unser Band) ist das je nach Kurvenverlauf unzuverlässig -- ein
	// bekanntes Playwright/SVG-Pfad-Verhalten, kein Rendering-Fehler. Ein
	// direktes `pointermove`-Event prüft denselben Handler ohne diese
	// Heuristik.
	const band = uebergaengeChapter.getByTestId('sankey-band').first();
	await band.dispatchEvent('pointermove', { clientX: 10, clientY: 10 });
	await expect(page.getByTestId('sankey-tooltip')).toBeVisible();
	await expect(page.getByTestId('sankey-tooltip-title')).toHaveText('SPD → GRÜNE');

	// Review Triage Log #10: zusätzlich ein ECHTER `mouse.move` auf einen Punkt
	// AUF dem Band. `boundingBox()` ist dafür KEINE verlässliche Quelle: bei
	// dieser Fixture (ein Gebiet, ein Übergang) liegen Quell- und Ziel-Knoten
	// auf derselben Höhe, das Band verläuft rein horizontal -- Chromiums
	// `getBoundingClientRect()` rechnet den Stroke nicht in die Geometrie-BBox
	// ein, eine horizontale Linie hat also `height: 0` und jeder Punkt "aus der
	// Box-Mitte" verfehlt das Band. Stattdessen: ein Punkt exakt AUF der
	// Pfad-Mittellinie nahe dem Band-Anfang (`getPointAtLength`), über
	// `getScreenCTM` in Viewport-Koordinaten übersetzt -- robust unabhängig
	// vom Kurvenverlauf. `scrollIntoViewIfNeeded` zuerst, sonst liefert
	// `elementFromPoint` an dieser Stelle `null` (Punkt unterhalb des
	// sichtbaren Viewports).
	await band.scrollIntoViewIfNeeded();
	const point = await band.evaluate((el: SVGPathElement) => {
		const ctm = el.getScreenCTM();
		if (!ctm) return null;
		const len = el.getTotalLength();
		const p = el.getPointAtLength(Math.min(20, len / 4));
		return { x: ctm.a * p.x + ctm.c * p.y + ctm.e, y: ctm.b * p.x + ctm.d * p.y + ctm.f };
	});
	expect(point).not.toBeNull();
	if (point) {
		await page.mouse.move(point.x, point.y);
		await expect(page.getByTestId('sankey-tooltip')).toBeVisible();
		await expect(page.getByTestId('sankey-tooltip-title')).toHaveText('SPD → GRÜNE');
	}
});

// Review-Fund VG-3/BH-4: die echte matchMedia-Verdrahtung von reduced motion
// (Boundary: "Play-Button steppt pro Klick genau ein Jahr weiter, kein
// Timer-Lauf") war von keinem Test ausgeführt -- Muster
// `climate-heritage.e2e.ts:108-125` (eigener Browser-Context statt Page-Reload,
// `reducedMotion: 'reduce'` kann nicht nachträglich pro Page gesetzt werden).
test.describe('Zeit-Animation Reduced-Motion: Step statt Timer', () => {
	test('Kiez-Ebene: ein Klick auf den Schritt-Button rückt aria-valuetext genau ein Jahr vor und bleibt danach stehen', async ({
		browser
	}) => {
		const ctx = await browser.newContext({ reducedMotion: 'reduce' });
		const page = await ctx.newPage();
		await page.route('**/api/wahl/list', (route) => route.fulfill({ json: ELECTIONS }));
		await page.route('**/api/wahl/winners**', (route) => route.fulfill({ json: WINNERS_AGH_KIEZ }));

		await page.goto('/berlin-wahlen?ebene=kiez');
		await expect(page.getByTestId('winner-map-canvas')).toBeVisible();

		// Start bei 2021 (aeltestes verfuegbares Jahr der Fixture), damit ein
		// Schritt tatsaechlich vorwaerts geht.
		await page.getByTestId('steuerleiste-jahr-2021').click();
		await expect(page.getByTestId('zeit-animation-slider')).toHaveAttribute(
			'aria-valuetext',
			'2021'
		);

		const stepButton = page.getByTestId('zeit-animation-play');
		await expect(stepButton).toHaveAttribute('aria-label', 'Ein Jahr weiter');
		await stepButton.click();
		await expect(page.getByTestId('zeit-animation-slider')).toHaveAttribute(
			'aria-valuetext',
			'2023 Wiederholungswahl'
		);

		// Kein Timer-Weiterlauf: binnen ~2,5s (deutlich über der sonst
		// üblichen 1,5s-Play-Kadenz) bleibt das Jahr stehen, weiter gibt es
		// ohnehin kein Jahr nach 2023 in der Fixture.
		await page.waitForTimeout(2500);
		await expect(page.getByTestId('zeit-animation-slider')).toHaveAttribute(
			'aria-valuetext',
			'2023 Wiederholungswahl'
		);

		await ctx.close();
	});
});
