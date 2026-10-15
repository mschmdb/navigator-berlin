import { expect, test, type Locator, type Page } from '@playwright/test';
import { expectFaqInYamlOrder } from './faq-order';

// i18n Block B4a (spec-i18n-b4a-kiez-bezirk-rahmen.md): Rahmen der Kiez- und
// Bezirk-Seiten auf Englisch. Prosa (`profileProse`) und FAQ-Inhalte
// (`faq_qna`) kommen seit Block C3/C5 in der Seiten-Locale -- `/kiez` und `/bezirk`
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

// Sprachprüfung ohne Ordnung; die FAQ-Reihenfolge prüft der Test `FAQ-Folge` (`sort_order`).
const DE_QUESTION_START =
	/^(Wie|Was|Warum|Welche[rsmn]?|Wo|Wann|Wer|Worin|Wodurch|Berücksichtigt|Bewertet|Ist|Gibt|Wird)\b/;

test.describe('i18n Block B4a: /en/kiez/[slug]', () => {
	test('lang=en, Titel + Hero-Fakten + Breadcrumb englisch', async ({ page }) => {
		const response = await page.goto(`/en/kiez/${KIEZ_SLUG}`);
		expect(response?.status()).toBe(200);
		await expect(page.locator('html')).toHaveAttribute('lang', 'en');
		await expect(page).toHaveTitle(/^Alexanderplatz \(Mitte\): [\d,]+ residents.*$/);

		const hero = page.getByTestId('kiez-hero');
		await expect(hero.locator('h1')).toBeVisible();
		await expect(hero).toContainText('Residents');
		await expect(hero).toContainText(/\d\.\d km²/);
		await expect(hero).toContainText('Kiez in Mitte');

		const breadcrumb = page.getByTestId('breadcrumb');
		await expect(breadcrumb).toHaveAttribute('aria-label', 'Breadcrumb');
	});

	test('Meta-Description + og:image:alt englisch (Bezirk-Klammer, Zahlen, Kiez score)', async ({
		page
	}) => {
		await page.goto(`/en/kiez/${KIEZ_SLUG}`);
		const description = await metaContent(page, 'meta[name="description"]');
		expect(description).toMatch(
			/^Alexanderplatz has [\d,]+ residents across \d+\.\d km² \(as of end of \d{4}\)\./
		);

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

	// i18n Block D1 (spec-i18n-d1-register-sitemap.md): `/en/kiez/…` ist im
	// Übersetzungs-Register. Kein Banner, kein noindex, hreflang de/en/x-default.
	test('Registriert: kein Banner, kein noindex, hreflang de/en/x-default, main lang=en', async ({
		page
	}) => {
		const response = await page.goto(`/en/kiez/${KIEZ_SLUG}`);
		expect(response?.status()).toBe(200);
		await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
		await expect(page.locator('main#main')).toHaveAttribute('lang', 'en');
		await expect(page.getByTestId('translation-disclaimer')).toHaveCount(0);
		await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute(
			'href',
			/\/en\/kiez\/[a-z0-9-]+$/
		);
		await expect(page.locator('link[rel="alternate"][hreflang="de"]')).toHaveAttribute(
			'href',
			/\/kiez\/[a-z0-9-]+$/
		);
		await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveCount(1);
	});

	test('Steckbrief, Vergleichstabelle und Wahl-Verlauf englisch; FAQ-Heading und Q&A englisch ohne lang=de', async ({
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
		// Block C3: Q&A-Inhalte kommen aus den EN-Zeilen von `faq_qna`,
		// ohne lang="de" am Accordion.
		const faqSection = page.getByTestId('faq-section');
		const enQuestions = await faqSection.locator('[data-faq-question]').allTextContents();
		expect(enQuestions.length).toBeGreaterThan(0);
		for (const q of enQuestions) expect(q).not.toMatch(DE_QUESTION_START);
		await expect(faqSection.locator('[lang="de"]')).toHaveCount(0);
		const faqLd = JSON.parse(
			(await page.locator('script[data-testid="faq-jsonld"]').textContent()) ?? '{}'
		);
		for (const e of faqLd.mainEntity as { name: string }[]) {
			expect(e.name).not.toMatch(DE_QUESTION_START);
		}

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

	test('Nachbar-Kieze (statische GeoJSON-Daten): Überschrift englisch, Klick bleibt unter /en/kiez/…', async ({
		page
	}) => {
		await page.goto(`/en/kiez/${KIEZ_SLUG}`);
		const siblings = page.getByTestId('kiez-siblings-list');
		await expect(siblings.locator('h2')).toContainText('Neighbouring Kieze');
		await siblings.getByTestId('kiez-sibling-link').first().click();
		await expect(page).toHaveURL(/\/en\/kiez\//);
	});

	test('Methodik-Link führt auf /en/methodik/kiez-score', async ({ page }) => {
		await page.goto(`/en/kiez/${KIEZ_SLUG}`);
		await page.getByRole('link', { name: /How the Kiez score is calculated/ }).click();
		await expect(page).toHaveURL(/\/en\/methodik\/kiez-score/);
	});

	// Block C5: Profil-Prosa in der Seiten-Locale, kein `lang="de"` am Profil.
	test('Profil-Prosa englisch ohne lang="de"', async ({ page }) => {
		await page.goto(`/en/kiez/${KIEZ_SLUG}`);
		const profile = page.getByTestId('kiez-profile');
		await expect(profile).toBeVisible();
		await expect(profile).not.toHaveAttribute('lang', /.+/);
		await expect(profile.locator('[lang]')).toHaveCount(0);
		await expect(profile).toContainText(/\b(the|and|with|of)\b/);
		await expect(profile).not.toContainText(/\b(und|der|die|das|mit)\b/);
	});

	test('DE-Kontrolle: /kiez/[slug] bleibt unverändert deutsch', async ({ page }) => {
		const response = await page.goto(`/kiez/${KIEZ_SLUG}`);
		expect(response?.status()).toBe(200);
		await expect(page.locator('html')).toHaveAttribute('lang', 'de');
		const hero = page.getByTestId('kiez-hero');
		await expect(hero).toContainText('Einwohner:innen');
		await expect(page.getByTestId('breadcrumb')).toHaveAttribute('aria-label', 'Brotkrumen');
		const faqDe = page.getByTestId('faq-section');
		const deQuestions = await faqDe.locator('[data-faq-question]').allTextContents();
		expect(deQuestions.some((q) => DE_QUESTION_START.test(q))).toBe(true);
		await expect(faqDe.locator('[lang]')).toHaveCount(0);
		const profileDe = page.getByTestId('kiez-profile');
		await expect(profileDe).toContainText(/\b(und|der|die|das|mit)\b/);
		await expect(profileDe).not.toHaveAttribute('lang', /.+/);

		const description = await metaContent(page, 'meta[name="description"]');
		expect(description).toMatch(
			/^Alexanderplatz hat [\d.]+ Einwohner:innen auf \d+,\d km² \(Stand Ende \d{4}\)\./
		);
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
		await expect(page).toHaveTitle(/^Charlottenburg-Wilmersdorf: [\d,]+ residents, \d+\.\d km²$/);

		const hero = page.getByTestId('bezirk-hero');
		await expect(hero.locator('h1')).toBeVisible();
		await expect(hero).toContainText('Residents');

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

	// i18n Block D1 (spec-i18n-d1-register-sitemap.md): `/en/bezirk/…` ist im
	// Übersetzungs-Register. Kein Banner, kein noindex, hreflang de/en/x-default.
	test('Registriert: kein Banner, kein noindex, hreflang de/en/x-default, main lang=en', async ({
		page
	}) => {
		const response = await page.goto(`/en/bezirk/${BEZIRK_SLUG}`);
		expect(response?.status()).toBe(200);
		await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
		await expect(page.locator('main#main')).toHaveAttribute('lang', 'en');
		await expect(page.getByTestId('translation-disclaimer')).toHaveCount(0);
		await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute(
			'href',
			/\/en\/bezirk\/[a-z0-9-]+$/
		);
		await expect(page.locator('link[rel="alternate"][hreflang="de"]')).toHaveAttribute(
			'href',
			/\/bezirk\/[a-z0-9-]+$/
		);
		await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveCount(1);
	});

	test('Meta-Description + og:image:alt englisch (Zahlen, Kiez score, Bezirk data)', async ({
		page
	}) => {
		await page.goto(`/en/bezirk/${BEZIRK_SLUG}`);
		const description = await metaContent(page, 'meta[name="description"]');
		expect(description).toMatch(
			/^Charlottenburg-Wilmersdorf has [\d,]+ residents across \d+\.\d km² \(as of end of \d{4}\)\./
		);

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

	// Block C5: Profil-Prosa in der Seiten-Locale, kein `lang="de"` am Profil.
	test('Profil-Prosa englisch ohne lang="de"', async ({ page }) => {
		await page.goto(`/en/bezirk/${BEZIRK_SLUG}`);
		const profile = page.getByTestId('bezirk-profile');
		await expect(profile).toBeVisible();
		await expect(profile).not.toHaveAttribute('lang', /.+/);
		await expect(profile.locator('[lang]')).toHaveCount(0);
		await expect(profile).toContainText(/\b(the|and|with|of)\b/);
		await expect(profile).not.toContainText(/\b(und|der|die|das|mit)\b/);
	});

	test('DE-Kontrolle: /bezirk/[slug] bleibt unverändert deutsch', async ({ page }) => {
		const response = await page.goto(`/bezirk/${BEZIRK_SLUG}`);
		expect(response?.status()).toBe(200);
		await expect(page.locator('html')).toHaveAttribute('lang', 'de');
		const kiezeList = page.getByTestId('bezirk-kieze-list');
		await expect(kiezeList.locator('h2')).toContainText('Kieze im Bezirk');
		const profileDe = page.getByTestId('bezirk-profile');
		await expect(profileDe).toContainText(/\b(und|der|die|das|mit)\b/);
		await expect(profileDe).not.toHaveAttribute('lang', /.+/);

		const description = await metaContent(page, 'meta[name="description"]');
		expect(description).toMatch(
			/^Charlottenburg-Wilmersdorf hat [\d.]+ Einwohner:innen auf \d+,\d km² \(Stand Ende \d{4}\)\./
		);
		const ogImageAlt = await metaContent(page, 'meta[property="og:image:alt"]');
		expect(ogImageAlt).toBe(
			'Bezirk Charlottenburg-Wilmersdorf: navigator.berlin-Karten-Vorschau mit Kiez-Score und Bezirks-Daten'
		);

		await page.getByRole('link', { name: /Wie der Bezirks-Score entsteht/ }).click();
		await expect(page).toHaveURL(/\/methodik\/kiez-score/);
		expect(page.url()).not.toMatch(/\/en\//);
	});
});

test.describe('FAQ-Folge Kiez (sort_order)', () => {
	test('DE und EN zeigen dieselben Template-IDs in YAML-Folge', async ({ page }) => {
		const read = async (path: string) => {
			await page.goto(path);
			return page.getByTestId('faq-section').locator('[data-faq-question]').allTextContents();
		};
		const de = await expectFaqInYamlOrder(await read(`/kiez/${KIEZ_SLUG}`), 'kiez', 'de');
		const en = await expectFaqInYamlOrder(await read(`/en/kiez/${KIEZ_SLUG}`), 'kiez', 'en');
		expect(de.length).toBeGreaterThan(1);
		expect(en).toEqual(de);
	});
});

type JsonLd = {
	'@id'?: string;
	containedInPlace?: { '@id'?: string };
	url?: string;
	additionalProperty?: { name: string }[];
	itemListElement?: { item: string }[];
};

async function readJsonLd(page: Page, testid: string): Promise<JsonLd> {
	const text = await page.locator(`script[data-testid="${testid}"]`).textContent();
	return JSON.parse(text ?? '{}') as JsonLd;
}

// i18n Block D1: Place, AdministrativeArea und Breadcrumb folgen der Seiten-Locale.
for (const { kind, slug } of [
	{ kind: 'kiez', slug: KIEZ_SLUG },
	{ kind: 'bezirk', slug: BEZIRK_SLUG }
] as const) {
	const areaTestId =
		kind === 'kiez' ? 'kiez-administrative-area-jsonld' : 'bezirk-administrative-area-jsonld';
	test.describe(`i18n Block D1: ${kind} JSON-LD`, () => {
		test(`/en/${kind}/${slug}: url auf /en, EN-Property-Namen, Breadcrumb mit /en`, async ({
			page
		}) => {
			await page.goto(`/en/${kind}/${slug}`);
			const ld = await readJsonLd(page, areaTestId);
			expect(ld.url).toMatch(new RegExp(`/en/${kind}/${slug}$`));
			// @id ist sprachunabhängig (ohne /en), nur url folgt der Locale.
			expect(ld['@id']).toMatch(new RegExp(`/${kind}/${slug}#place$`));
			expect(ld['@id']).not.toContain('/en/');
			expect(ld.additionalProperty?.map((p) => p.name)).toEqual(['Population', 'Area (ha)']);
			if (kind === 'kiez') expect(ld.containedInPlace?.['@id']).toMatch(/\/bezirk\/[^/]+#place$/);
			const crumbs = (await readJsonLd(page, `${kind}-breadcrumb-jsonld`)).itemListElement ?? [];
			expect(crumbs.length).toBeGreaterThan(1);
			for (const crumb of crumbs) expect(new URL(crumb.item).pathname).toMatch(/^\/en(\/|$)/);
		});

		test(`/${kind}/${slug} (DE): url ohne Präfix, DE-Property-Namen`, async ({ page }) => {
			await page.goto(`/${kind}/${slug}`);
			const ld = await readJsonLd(page, areaTestId);
			expect(ld.url).toMatch(new RegExp(`/${kind}/${slug}$`));
			expect(ld.url).not.toContain('/en/');
			expect(ld.additionalProperty?.map((p) => p.name)).toEqual(['Einwohner', 'Fläche (ha)']);
			const crumbs = (await readJsonLd(page, `${kind}-breadcrumb-jsonld`)).itemListElement ?? [];
			for (const crumb of crumbs) expect(new URL(crumb.item).pathname).not.toMatch(/^\/en(\/|$)/);
		});
	});
}
