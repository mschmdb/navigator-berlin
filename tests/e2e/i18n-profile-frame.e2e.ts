import { expect, test, type Locator, type Page } from '@playwright/test';

// i18n Block B4a (spec-i18n-b4a-kiez-bezirk-rahmen.md): Rahmen der Kiez- und
// Bezirk-Seiten auf Englisch. Prosa (`profileProse`) und FAQ-Inhalte
// (`faq_qna`) bleiben deutsch (Boundary, Block C) -- `/kiez` und `/bezirk`
// sind NICHT im Übersetzungs-Register, die EN-Seiten zeigen deshalb weiterhin
// den Fallback-Disclaimer und bleiben noindex (siehe `i18n-routing.e2e.ts`).
//
// Voraussetzung: `DATABASE_URL` muss auf eine befüllte Postgres-Instanz
// zeigen (`pnpm build`s Prebuild migriert + aggregiert dagegen). Ohne DB
// wären Steckbrief, Vergleichstabelle, FAQ und Wahl-Verlauf leer/Platzhalter
// -- die Assertions unten sind deshalb bewusst HART (kein `if (await
// x.count())`-Guard) und verlangen echte Aggregat-Daten für die realen Slugs
// `alexanderplatz`/`charlottenburg-wilmersdorf`.
//
// Hrefs laufen über `localizedHref` -> SvelteKits `resolve()`, das auf
// prerenderten Seiten RELATIVE Pfade ausgibt (z. B. `../../en/kiez/x`, nicht
// `/en/kiez/x`) -- Assertions prüfen deshalb per Klick + `page.url()` statt
// den rohen `href`-String zu erwarten.

const KIEZ_SLUG = 'alexanderplatz';
const BEZIRK_SLUG = 'charlottenburg-wilmersdorf';

/** Meta-Tag-Content lesen, wirft wenn das Tag fehlt (harte Assertion). */
async function metaContent(page: Page, selector: string): Promise<string> {
	const content = await page.locator(selector).getAttribute('content');
	if (content === null) throw new Error(`meta tag not found: ${selector}`);
	return content;
}

/**
 * Berlin-Spalte einer Vergleichstabellen-Zeile: die Spalte ist immer die
 * zweitletzte (letzte ist Rang; auf Kiez-Seiten gibt es zusätzlich eine
 * Bezirk-Ø-Spalte davor, auf Bezirk-Seiten nicht) -- Index-Suche relativ zum
 * Zeilenende bleibt für beide Seiten korrekt, ohne die Spaltenzahl fest zu
 * verdrahten.
 */
async function berlinCellText(row: Locator): Promise<string> {
	const cells = row.locator('td');
	const count = await cells.count();
	return (await cells.nth(count - 2).textContent())?.trim() ?? '';
}

test.describe('i18n Block B4a: /en/kiez/[slug]', () => {
	test('lang=en, Titel + Lead + Breadcrumb englisch', async ({ page }) => {
		const response = await page.goto(`/en/kiez/${KIEZ_SLUG}`);
		expect(response?.status()).toBe(200);
		await expect(page.locator('html')).toHaveAttribute('lang', 'en');
		await expect(page).toHaveTitle(/Berlin in data - navigator\.berlin/);

		const hero = page.getByTestId('kiez-hero');
		await expect(hero.locator('h1')).toBeVisible();
		await expect(hero).toContainText('residents');
		await expect(hero).toContainText(/\d+ ha/);
		await expect(hero).toContainText(
			'Data on housing, environment, climate and mobility on this page.'
		);

		const breadcrumb = page.getByTestId('breadcrumb');
		await expect(breadcrumb).toHaveAttribute('aria-label', 'Breadcrumb');
	});

	test('Meta-Description + og:image:alt englisch (Bezirk-Klammer, Zahlen, Kiez score)', async ({
		page
	}) => {
		await page.goto(`/en/kiez/${KIEZ_SLUG}`);
		const description = await metaContent(page, 'meta[name="description"]');
		expect(description).toMatch(
			/^Kiez Alexanderplatz in Bezirk Mitte \(\d[\d,.]* residents, \d[\d,.]* ha\): Kiez score,/
		);
		expect(description).toContain('Berlin data atlas.');

		const ogImageAlt = await metaContent(page, 'meta[property="og:image:alt"]');
		expect(ogImageAlt).toBe(
			'Kiez Alexanderplatz (Mitte): navigator.berlin preview with Kiez score'
		);
	});

	test('Breadcrumb-"Berlin"-Link führt auf /en (localizedHref)', async ({ page }) => {
		await page.goto(`/en/kiez/${KIEZ_SLUG}`);
		await page.getByTestId('breadcrumb').getByRole('link', { name: 'Berlin' }).click();
		await expect(page).toHaveURL(/\/en\/?$/);
	});

	test('Steckbrief, Vergleichstabelle und Wahl-Verlauf englisch; FAQ-Heading englisch, Q&A-Inhalte bleiben deutsch', async ({
		page
	}) => {
		await page.goto(`/en/kiez/${KIEZ_SLUG}`);

		const table = page.getByTestId('kiez-steckbrief');
		await expect(table).toContainText('Noise');
		await expect(table).toContainText(/Source: /);

		const comparison = page.getByTestId('score-comparison');
		await expect(comparison).toContainText('In comparison');
		await expect(comparison).toContainText(/Rank \d+ of \d+|bottom quartile/);
		const ruheLuftRow = comparison.locator('tr', { hasText: 'Quiet & air' });
		await expect(ruheLuftRow).toBeVisible();
		expect(await berlinCellText(ruheLuftRow)).toMatch(/^\d+$/);

		const faqHeading = page.getByRole('heading', { name: 'Frequently asked questions' });
		await expect(faqHeading).toBeVisible();
		// Q&A-Inhalte selbst bleiben deutsch (Boundary, Block C) -- nur die
		// Section-Chrome (Heading, Methodik-Link) ist übersetzt.
		const faqSection = page.getByTestId('faq-section');
		await expect(faqSection.locator('[data-faq-question]').first()).toContainText(/Wie /);

		const wahlVerlauf = page.getByTestId('kiez-wahl-verlauf');
		await expect(wahlVerlauf).toContainText('Election history here');
		await expect(wahlVerlauf).not.toContainText('Bundestagswahlen');
	});

	test('Score-Rank-Link zeigt englischen Text, Klick führt auf /en/umwelt-infrastruktur-score', async ({
		page
	}) => {
		await page.goto(`/en/kiez/${KIEZ_SLUG}`);
		const link = page.getByTestId('score-rank-link');
		await expect(link).toContainText(/Rank \d+ of \d+ in the environment & infrastructure score/);
		await link.click();
		await expect(page).toHaveURL(/\/en\/umwelt-infrastruktur-score/);
	});

	test('Kiez-Geschwister-Liste (statische GeoJSON-Daten): Überschrift englisch, Klick bleibt unter /en/kiez/…', async ({
		page
	}) => {
		await page.goto(`/en/kiez/${KIEZ_SLUG}`);
		const siblings = page.getByTestId('kiez-siblings-list');
		await expect(siblings.locator('h2')).toContainText('Other Kieze in');
		await siblings.getByTestId('kiez-sibling-link').first().click();
		await expect(page).toHaveURL(/\/en\/kiez\//);
	});

	test('Methodik-Link führt auf /en/methodik/kiez-score', async ({ page }) => {
		await page.goto(`/en/kiez/${KIEZ_SLUG}`);
		await page.getByRole('link', { name: /How the Kiez score is calculated/ }).click();
		await expect(page).toHaveURL(/\/en\/methodik\/kiez-score/);
	});

	test('DE-Kontrolle: /kiez/[slug] bleibt unverändert deutsch', async ({ page }) => {
		const response = await page.goto(`/kiez/${KIEZ_SLUG}`);
		expect(response?.status()).toBe(200);
		await expect(page.locator('html')).toHaveAttribute('lang', 'de');
		const hero = page.getByTestId('kiez-hero');
		await expect(hero).toContainText('Einwohner:innen');
		await expect(page.getByTestId('breadcrumb')).toHaveAttribute('aria-label', 'Brotkrumen');

		const description = await metaContent(page, 'meta[name="description"]');
		expect(description).toMatch(
			/^Kiez Alexanderplatz in Bezirk Mitte \(\d[\d.,]* Einwohner:innen, \d[\d.,]* ha\): Kiez-Score,/
		);
		expect(description).toContain('Berliner Daten-Atlas.');
		const ogImageAlt = await metaContent(page, 'meta[property="og:image:alt"]');
		expect(ogImageAlt).toBe(
			'Kiez Alexanderplatz (Mitte): navigator.berlin-Vorschau mit Kiez-Score'
		);

		const comparison = page.getByTestId('score-comparison');
		const ruheLuftRow = comparison.locator('tr', { hasText: 'Ruhe & Luft' });
		expect(await berlinCellText(ruheLuftRow)).toMatch(/^\d+$/);

		await page.getByRole('link', { name: /Wie der Kiez-Score entsteht/ }).click();
		await expect(page).toHaveURL(/\/methodik\/kiez-score/);
		expect(page.url()).not.toMatch(/\/en\//);
	});
});

test.describe('i18n Block B4a: /en/bezirk/[slug]', () => {
	test('lang=en, Titel + Lead + Kieze-Liste + Vergleichstabelle englisch', async ({ page }) => {
		const response = await page.goto(`/en/bezirk/${BEZIRK_SLUG}`);
		expect(response?.status()).toBe(200);
		await expect(page.locator('html')).toHaveAttribute('lang', 'en');
		await expect(page).toHaveTitle(/Berlin in data - navigator\.berlin/);

		const hero = page.getByTestId('bezirk-hero');
		await expect(hero.locator('h1')).toBeVisible();
		await expect(hero).toContainText('residents');

		const comparison = page.getByTestId('score-comparison');
		await expect(comparison).toContainText('In comparison');
		await expect(comparison).not.toContainText('Bezirk-Ø');
		const ruheLuftRow = comparison.locator('tr', { hasText: 'Quiet & air' });
		expect(await berlinCellText(ruheLuftRow)).toMatch(/^\d+$/);

		const kiezeList = page.getByTestId('bezirk-kieze-list');
		await expect(kiezeList.locator('h2')).toContainText('Kieze in Bezirk');
		await kiezeList.getByTestId('bezirk-kieze-link').first().click();
		await expect(page).toHaveURL(/\/en\/kiez\//);
	});

	test('Meta-Description + og:image:alt englisch (Zahlen, Kiez score, Bezirk data)', async ({
		page
	}) => {
		await page.goto(`/en/bezirk/${BEZIRK_SLUG}`);
		const description = await metaContent(page, 'meta[name="description"]');
		expect(description).toMatch(
			/^Bezirk Charlottenburg-Wilmersdorf \(\d[\d,.]* residents, \d[\d,.]* ha\): Kiez score,/
		);
		expect(description).toContain('Berlin data atlas.');

		const ogImageAlt = await metaContent(page, 'meta[property="og:image:alt"]');
		expect(ogImageAlt).toBe(
			'Bezirk Charlottenburg-Wilmersdorf: navigator.berlin map preview with Kiez score and Bezirk data'
		);
	});

	test('Methodik-Link führt auf /en/methodik/kiez-score', async ({ page }) => {
		await page.goto(`/en/bezirk/${BEZIRK_SLUG}`);
		await page.getByRole('link', { name: /How the Bezirk score is calculated/ }).click();
		await expect(page).toHaveURL(/\/en\/methodik\/kiez-score/);
	});

	test('DE-Kontrolle: /bezirk/[slug] bleibt unverändert deutsch', async ({ page }) => {
		const response = await page.goto(`/bezirk/${BEZIRK_SLUG}`);
		expect(response?.status()).toBe(200);
		await expect(page.locator('html')).toHaveAttribute('lang', 'de');
		const kiezeList = page.getByTestId('bezirk-kieze-list');
		await expect(kiezeList.locator('h2')).toContainText('Kieze im Bezirk');

		const description = await metaContent(page, 'meta[name="description"]');
		expect(description).toMatch(
			/^Bezirk Charlottenburg-Wilmersdorf \(\d[\d.,]* Einwohner:innen, \d[\d.,]* ha\): Kiez-Score,/
		);
		expect(description).toContain('Berliner Daten-Atlas.');
		const ogImageAlt = await metaContent(page, 'meta[property="og:image:alt"]');
		expect(ogImageAlt).toBe(
			'Bezirk Charlottenburg-Wilmersdorf: navigator.berlin-Karten-Vorschau mit Kiez-Score und Bezirks-Daten'
		);

		await page.getByRole('link', { name: /Wie der Bezirks-Score entsteht/ }).click();
		await expect(page).toHaveURL(/\/methodik\/kiez-score/);
		expect(page.url()).not.toMatch(/\/en\//);
	});
});
