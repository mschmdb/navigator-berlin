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
	await page.getByTestId('steuerleiste-reihe-agh').click();
	await page.getByTestId('steuerleiste-ebene-kiez').click();
	await expect(page).not.toHaveURL(/reihe=/);
	await expect(page).not.toHaveURL(/ebene=/);
});

test('Kapitel-Nav: Klick aktiviert das geklickte Kapitel', async ({ page }) => {
	await page.route('**/api/wahl/list', (route) => route.fulfill({ json: ELECTIONS }));
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
