import { test, expect } from '@playwright/test';
import { ELECTIONS } from './fixtures/berlin-wahlen-fixtures.js';

/**
 * Story 9 (Partei-Tabs + Small Multiples): eigene Datei (Ordner-Konvention
 * ein Flow pro Datei, `berlin-wahlen.e2e.ts` hat bereits 735 Zeilen).
 * Geometrie kommt real aus static/layers (Muster `berlin-wahlen.e2e.ts`);
 * `mv-nord`/`marienfelde-nord` sind eindeutige BZR-Slugs im echten Preview-Build.
 */

const FINDER_PARTIES = ['SPD', 'CDU', 'GRÜNE', 'FDP', 'AfD', 'Die Linke', 'BSW'] as const;

function winnersFor(partei: string | null) {
	const p = partei ?? 'SPD';
	return {
		typ: 'agh',
		stimmtyp: 'zweitstimme',
		ebene: 'kiez',
		winners: [
			{
				jahr: 2023,
				gebiet_slug: 'mv-nord',
				partei: p,
				farbe_hex: '#A50C1A',
				anteil: partei ? 0.1 : 0.4,
				is_repeat_election: true,
				parent_slug: '2021-agh-zweitstimme'
			},
			{
				jahr: 2023,
				gebiet_slug: 'marienfelde-nord',
				partei: partei ? p : 'GRÜNE',
				farbe_hex: '#0F6E2C',
				anteil: partei ? 0.5 : 0.3,
				is_repeat_election: true,
				parent_slug: '2021-agh-zweitstimme'
			}
		],
		license: 'dl-de/by-2.0',
		source_url: 'https://example.invalid/agh23',
		source_name: 'Amt für Statistik Berlin-Brandenburg'
	};
}

test('Partei-Tab faerbt die Karte um (ein partei=-Request); Rueck-Tab zu Gewinner nutzt den Cache (kein neuer Request)', async ({
	page
}) => {
	await page.route('**/api/wahl/list', (route) => route.fulfill({ json: ELECTIONS }));

	let gewinnerRequests = 0;
	let spdRequests = 0;
	await page.route('**/api/wahl/winners**', (route) => {
		const url = new URL(route.request().url());
		const partei = url.searchParams.get('partei');
		if (partei === 'SPD') spdRequests++;
		else gewinnerRequests++;
		return route.fulfill({ json: winnersFor(partei) });
	});

	await page.goto('/berlin-wahlen?ebene=kiez');
	await expect(page.getByTestId('winner-map-canvas')).toBeVisible();
	expect(gewinnerRequests).toBe(1);

	// Tab-Wechsel zu SPD: ein zusaetzlicher Request (partei=SPD), Legende/
	// Takeaway nennen die Partei statt "Staerkste Partei".
	await page.getByTestId('winner-map-partei-tab-SPD').click();
	await expect(page.getByTestId('winner-map-takeaway')).toContainText('SPD');
	await expect(page.getByTestId('winner-map-legende')).toContainText('Anteil SPD');
	expect(spdRequests).toBe(1);
	expect(gewinnerRequests).toBe(1);

	// Zurueck zu Gewinner: Bestand exakt wiederhergestellt, kein neuer Request.
	await page.getByTestId('winner-map-partei-tab-gewinner').click();
	await expect(page.getByTestId('winner-map-takeaway')).toContainText('GRÜNE');
	expect(gewinnerRequests).toBe(1);
	expect(spdRequests).toBe(1);
});

test('Review-Fund #18: Extreme-Kapitel bleibt lazy -- kein Partei-Request und kein Small-Multiples-Mount vor dem Scroll ins Blickfeld', async ({
	page
}) => {
	await page.route('**/api/wahl/list', (route) => route.fulfill({ json: ELECTIONS }));

	let parteiRequests = 0;
	await page.route('**/api/wahl/winners**', (route) => {
		const url = new URL(route.request().url());
		if (url.searchParams.get('partei')) parteiRequests++;
		return route.fulfill({ json: winnersFor(url.searchParams.get('partei')) });
	});

	await page.goto('/berlin-wahlen');
	await expect(page.getByTestId('winner-map-canvas')).toBeVisible();

	// Vor dem Scroll: kein einziger Partei-Request, das Kapitel ist nicht im
	// DOM, ein sichtbarer Hinweis erklärt den Lazy-Mount statt einer leeren
	// Section (Review-Fund #18: E2E würde einen Eager-Rückfall sonst nicht
	// bemerken).
	expect(parteiRequests).toBe(0);
	await expect(page.getByTestId('small-multiples')).toHaveCount(0);
	await expect(page.getByTestId('extreme-gebiete-lazy-hinweis')).toBeVisible();
});

test('Kapitel "Staerkste und schwaechste Gebiete": 7 Mini-Karten mit Extrem-Kiez-Labels, geteilter Cache mit den Karten-Tabs', async ({
	page
}) => {
	await page.route('**/api/wahl/list', (route) => route.fulfill({ json: ELECTIONS }));

	let parteiRequests = 0;
	await page.route('**/api/wahl/winners**', (route) => {
		const url = new URL(route.request().url());
		const partei = url.searchParams.get('partei');
		if (partei) parteiRequests++;
		return route.fulfill({ json: winnersFor(partei) });
	});

	// Ebene kiez: der Cache-Share mit den Hero-Tabs gilt nur bei gleicher
	// Ebene (die Minis laden immer kiez; auf der Stimmbezirk-Default-Ansicht
	// haette der SPD-Tab einen eigenen, legitimen stimmbezirk-Request).
	await page.goto('/berlin-wahlen?ebene=kiez');
	await page.getByTestId('kapitel-nav-link-extreme-gebiete').click();

	const chapter = page.getByTestId('wahl-portal-chapter-extreme-gebiete');
	await expect(chapter.getByTestId('small-multiples')).toBeVisible();
	for (const partei of FINDER_PARTIES) {
		await expect(chapter.getByTestId(`small-multiples-mini-${partei}`)).toBeVisible();
	}
	// Review-Fund #18: genau EIN Partei-Request je Partei fürs Kapitel (7),
	// unabhängig davon, wie oft die Loader-Klasse instanziiert wird.
	expect(parteiRequests).toBe(7);

	await chapter.getByTestId('table-toggle').click();
	await expect(chapter.getByTestId('data-table')).toBeVisible();
	await expect(chapter.getByTestId('data-table')).toContainText('SPD');

	// Cache-Share-AC: ein SPD-Tab-Klick an der Hero-Karte erzeugt KEINEN
	// achten Partei-Request -- die Small Multiples haben SPD bereits geladen.
	await page.getByTestId('winner-map-partei-tab-SPD').click();
	await expect(page.getByTestId('winner-map-takeaway')).toContainText('SPD');
	expect(parteiRequests).toBe(7);
});
