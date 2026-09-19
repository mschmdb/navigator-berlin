import { test, expect } from '@playwright/test';

// Story 3 Portal-Skeleton: URL-Sync und Steuerleisten-Verdrahtung auf der
// echten Seite. Deckt zwei Review-/Live-Funde ab: den Zwei-Effect-Revert-Loop
// (Klick wurde vom URL-Pull-Effect zurückgedreht) und das keyed-each-Duplikat
// bei zwei Stimmtyp-Rows pro Jahr.
const ELECTIONS = {
	elections: [
		{
			slug: '2023-agh-erststimme',
			jahr: 2023,
			typ: 'agh',
			stimmtyp: 'erststimme',
			is_repeat_election: true,
			parent_slug: '2021-agh-erststimme',
			has_stimmbezirks_geometry: true,
			source_name: 'Amt für Statistik Berlin-Brandenburg',
			source_url: 'https://example.invalid/agh23',
			license: 'dl-de/by-2.0'
		},
		{
			slug: '2023-agh-zweitstimme',
			jahr: 2023,
			typ: 'agh',
			stimmtyp: 'zweitstimme',
			is_repeat_election: true,
			parent_slug: '2021-agh-zweitstimme',
			has_stimmbezirks_geometry: true,
			source_name: 'Amt für Statistik Berlin-Brandenburg',
			source_url: 'https://example.invalid/agh23',
			license: 'dl-de/by-2.0'
		},
		{
			slug: '2021-agh-zweitstimme',
			jahr: 2021,
			typ: 'agh',
			stimmtyp: 'zweitstimme',
			is_repeat_election: false,
			parent_slug: null,
			has_stimmbezirks_geometry: true,
			source_name: 'Amt für Statistik Berlin-Brandenburg',
			source_url: 'https://example.invalid/agh21',
			license: 'dl-de/by-2.0'
		},
		{
			slug: '2016-agh-zweitstimme',
			jahr: 2016,
			typ: 'agh',
			stimmtyp: 'zweitstimme',
			is_repeat_election: false,
			parent_slug: null,
			has_stimmbezirks_geometry: true,
			source_name: 'Amt für Statistik Berlin-Brandenburg',
			source_url: 'https://example.invalid/agh16',
			license: 'dl-de/by-2.0'
		},
		{
			slug: '2025-btw-zweitstimme',
			jahr: 2025,
			typ: 'btw',
			stimmtyp: 'zweitstimme',
			is_repeat_election: false,
			parent_slug: null,
			has_stimmbezirks_geometry: true,
			source_name: 'Bundeswahlleiterin',
			source_url: 'https://example.invalid/btw25',
			license: 'dl-de/by-2.0'
		}
	]
};

test('Steuerleisten-Klicks schreiben die URL und revertieren nicht', async ({ page }) => {
	await page.route('**/api/wahl/list', (route) => route.fulfill({ json: ELECTIONS }));
	// Story 4: die Karte mountet jetzt immer mit; winners deterministisch mocken.
	await page.route('**/api/wahl/winners**', (route) =>
		route.fulfill({ json: { winners: [] } })
	);
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
	await page.route('**/api/wahl/winners**', (route) =>
		route.fulfill({ json: { winners: [] } })
	);
	await page.goto('/berlin-wahlen');
	await page.getByTestId('kapitel-nav-link-trends').click();
	await expect(page.getByTestId('kapitel-nav-link-trends')).toHaveAttribute(
		'aria-current',
		'true'
	);
	await expect(page.getByTestId('kapitel-nav-link-kontraste')).not.toHaveAttribute(
		'aria-current',
		'true'
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

	// Tabellen-Alternative liefert die gejointen Rows.
	await page.getByTestId('table-toggle').click();
	await expect(page.getByTestId('data-table')).toBeVisible();
	await expect(page.getByTestId('data-table')).toContainText('SPD');
	await expect(page.getByTestId('data-table')).toContainText('GRÜNE');

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

// Story 5: Stimmbezirks-Winners jahrweise (ebene=stimmbezirk verlangt jahr).
// `01W100` ist eine echte uwbId aus static/layers/wahlbezirke-ah21*.geojson
// UND wahlbezirke-ah16*.geojson (BEZ=01, UWB3/UWB=100) -- dieselbe Nummer
// existiert in beiden Geometrie-Generationen, deckt also sowohl den
// Default-Render (ah21) als auch den Geo-Swap-Test (ah16 -> ah21) ab.
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
				gebiet_slug: '01W100',
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
				gebiet_slug: '01W100',
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
				gebiet_slug: '01W100',
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

	await page.getByTestId('table-toggle').click();
	await expect(page.getByTestId('data-table')).toContainText('Stimmbezirk 01W100');
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
			return route.fulfill({ json: (jahr && STIMMBEZIRK_WINNERS_BY_JAHR[jahr]) ?? { winners: [] } });
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
