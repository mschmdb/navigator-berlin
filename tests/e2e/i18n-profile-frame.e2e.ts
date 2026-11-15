import { expect, test, type Page } from '@playwright/test';

// i18n Block B4a (spec-i18n-b4a-kiez-bezirk-rahmen.md): Rahmen der Kiez- und
// Bezirk-Seiten auf Englisch. Prosa (`profileProse`) und FAQ-Inhalte
// (`faq_qna`) kommen seit Block C3/C5 in der Seiten-Locale -- `/kiez` und `/bezirk`
// sind NICHT im Übersetzungs-Register, die EN-Seiten zeigen deshalb weiterhin
// den Fallback-Disclaimer und bleiben noindex (siehe `i18n-routing.e2e.ts`).
//
// Voraussetzung: `DATABASE_URL` muss auf eine befüllte Postgres-Instanz
// zeigen (`pnpm build`s Prebuild migriert + aggregiert dagegen). Ohne DB
// wären Kapitel, FAQ und Wahl-Verlauf leer/Platzhalter
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

// Sprachprüfung ohne Ordnung; die FAQ-Reihenfolge prüft der Test `FAQ-Folge` (`sort_order`).
const DE_QUESTION_START =
	/^(Wie|Was|Warum|Welche[rsmn]?|Wo|Wann|Wer|Worin|Wodurch|Berücksichtigt|Bewertet|Ist|Gibt|Wird)\b/;

test.describe('i18n Block B4a: /en/kiez/[slug]', () => {
	test('lang=en, Titel + Hero-Fakten + Breadcrumb englisch', async ({ page }) => {
		const response = await page.goto(`/en/kiez/${KIEZ_SLUG}`);
		expect(response?.status()).toBe(200);
		await expect(page.locator('html')).toHaveAttribute('lang', 'en');
		await expect(page).toHaveTitle(/^Alexanderplatz \(Mitte\): [\d,]+ residents.*$/);

		const main = page.locator('main#main');
		await expect(main.locator('h1')).toBeVisible();
		await expect(main).toContainText('Residents');
		await expect(main).toContainText(/\d\.\d\s*km²/);
		await expect(main).toContainText('Kiez in');
		await expect(main.locator('header a', { hasText: 'Mitte' })).toBeVisible();

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

	test('Kapitel, Wahl-Verlauf und FAQ englisch; FAQ-Heading und Q&A englisch ohne lang=de', async ({
		page
	}) => {
		await page.goto(`/en/kiez/${KIEZ_SLUG}`);

		await expect(
			page.locator('#laerm').getByRole('heading', { name: 'Noise and air' })
		).toBeVisible();
		await expect(page.locator('#ueberblick h2')).toContainText('The Kiez score at a glance');

		const faqHeading = page.getByRole('heading', { name: 'Frequently asked questions' });
		await expect(faqHeading).toBeVisible();
		// Block C3: Q&A-Inhalte kommen in der Seiten-Locale, ohne lang="de" am Accordion.
		const faqSection = page.locator('#fragen');
		const enQuestions = await faqSection.locator('summary').allTextContents();
		expect(enQuestions.length).toBeGreaterThan(0);
		for (const q of enQuestions) expect(q).not.toMatch(DE_QUESTION_START);
		await expect(faqSection.locator('[lang="de"]')).toHaveCount(0);
		const faqLd = JSON.parse(
			(await page.locator('script[data-testid="place-faq-jsonld"]').textContent()) ?? '{}'
		);
		for (const e of faqLd.mainEntity as { name: string }[]) {
			expect(e.name).not.toMatch(DE_QUESTION_START);
		}

		const wahlen = page.locator('#wahlen');
		await expect(wahlen.locator('h2')).toContainText('Elections since 2016');
		await expect(wahlen).not.toContainText('Bundestagswahlen');
	});

	test('Ranking-Link zeigt englischen Text, Klick führt auf /en/kiez-score', async ({ page }) => {
		await page.goto(`/en/kiez/${KIEZ_SLUG}`);
		const link = page.getByRole('link', { name: 'Kiez score: all Kieze compared' });
		await link.click();
		await expect(page).toHaveURL(/\/en\/kiez-score/);
	});

	test('Nachbar-Kieze (statische GeoJSON-Daten): Überschrift englisch, Klick bleibt unter /en/kiez/…', async ({
		page
	}) => {
		await page.goto(`/en/kiez/${KIEZ_SLUG}`);
		const neighbors = page.locator('#nachbarn');
		await expect(neighbors.locator('h2').first()).toContainText('Neighbours and similar Kieze');
		await neighbors.getByTestId('place-neighbor-link').first().click();
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
		const prose = page.locator('main#main header p[lang]');
		await expect(prose.first()).toBeVisible();
		await expect(page.locator('main#main [lang="de"]')).toHaveCount(0);
		await expect(prose.first()).toHaveAttribute('lang', 'en');
		const text = (await prose.allTextContents()).join(' ');
		expect(text).toMatch(/\b(the|and|with|of)\b/);
		expect(text).not.toMatch(/\b(und|der|die|das|mit)\b/);
	});

	test('DE-Kontrolle: /kiez/[slug] bleibt unverändert deutsch', async ({ page }) => {
		const response = await page.goto(`/kiez/${KIEZ_SLUG}`);
		expect(response?.status()).toBe(200);
		await expect(page.locator('html')).toHaveAttribute('lang', 'de');
		await expect(page.locator('main#main')).toContainText('Einwohnerinnen und Einwohner');
		await expect(page.getByTestId('breadcrumb')).toHaveAttribute('aria-label', 'Brotkrumen');
		const faqDe = page.locator('#fragen');
		const deQuestions = await faqDe.locator('summary').allTextContents();
		expect(deQuestions.some((q) => DE_QUESTION_START.test(q.replace('›', '').trim()))).toBe(true);
		const proseDe = page.locator('main#main header p[lang]');
		await expect(proseDe.first()).toHaveAttribute('lang', 'de');
		expect((await proseDe.allTextContents()).join(' ')).toMatch(/\b(und|der|die|das|mit)\b/);

		const description = await metaContent(page, 'meta[name="description"]');
		expect(description).toMatch(
			/^Alexanderplatz hat [\d.]+ Einwohner:innen auf \d+,\d km² \(Stand Ende \d{4}\)\./
		);
		const ogImageAlt = await metaContent(page, 'meta[property="og:image:alt"]');
		expect(ogImageAlt).toBe(
			'Kiez Alexanderplatz (Mitte): navigator.berlin-Vorschau mit Kiez-Score'
		);

		await page.getByRole('link', { name: /So entsteht der Kiez-Score/ }).click();
		await expect(page).toHaveURL(/\/methodik\/kiez-score/);
		expect(page.url()).not.toMatch(/\/en\//);
	});
});

test.describe('i18n Block B4a: /en/bezirk/[slug]', () => {
	test('lang=en, Titel + Überblick + Nachbarn englisch', async ({ page }) => {
		const response = await page.goto(`/en/bezirk/${BEZIRK_SLUG}`);
		expect(response?.status()).toBe(200);
		await expect(page.locator('html')).toHaveAttribute('lang', 'en');
		await expect(page).toHaveTitle(/^Charlottenburg-Wilmersdorf: Berlin district in numbers$/);

		const main = page.locator('main#main');
		await expect(main.locator('h1')).toBeVisible();
		await expect(main).toContainText('Residents');
		await expect(page.locator('#ueberblick h2')).toContainText('The Kiez score at a glance');

		const neighbors = page.locator('#nachbarn');
		await expect(neighbors.locator('h2').first()).toContainText('Neighbouring districts and Kieze');
		await neighbors.locator('ul a[href*="/kiez/"]').first().click();
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
		await page.getByRole('link', { name: /How the Kiez score is calculated/ }).click();
		await expect(page).toHaveURL(/\/en\/methodik\/kiez-score/);
	});

	// Block C5: Profil-Prosa in der Seiten-Locale, kein `lang="de"` am Profil.
	test('Profil-Prosa englisch ohne lang="de"', async ({ page }) => {
		await page.goto(`/en/bezirk/${BEZIRK_SLUG}`);
		const prose = page.locator('main#main header p[lang]');
		await expect(prose.first()).toBeVisible();
		await expect(page.locator('main#main [lang="de"]')).toHaveCount(0);
		await expect(prose.first()).toHaveAttribute('lang', 'en');
		const text = (await prose.allTextContents()).join(' ');
		expect(text).toMatch(/\b(the|and|with|of)\b/);
		expect(text).not.toMatch(/\b(und|der|die|das|mit)\b/);
	});

	test('DE-Kontrolle: /bezirk/[slug] bleibt unverändert deutsch', async ({ page }) => {
		const response = await page.goto(`/bezirk/${BEZIRK_SLUG}`);
		expect(response?.status()).toBe(200);
		await expect(page.locator('html')).toHaveAttribute('lang', 'de');
		await expect(page.locator('#nachbarn h2').first()).toContainText('Nachbarbezirke und Kieze');
		const proseDe = page.locator('main#main header p[lang]');
		await expect(proseDe.first()).toHaveAttribute('lang', 'de');
		expect((await proseDe.allTextContents()).join(' ')).toMatch(/\b(und|der|die|das|mit)\b/);

		const description = await metaContent(page, 'meta[name="description"]');
		expect(description).toMatch(
			/^Charlottenburg-Wilmersdorf hat [\d.]+ Einwohner:innen auf \d+,\d km² \(Stand Ende \d{4}\)\./
		);
		const ogImageAlt = await metaContent(page, 'meta[property="og:image:alt"]');
		expect(ogImageAlt).toBe(
			'Bezirk Charlottenburg-Wilmersdorf: navigator.berlin-Karten-Vorschau mit Kiez-Score und Bezirks-Daten'
		);

		await page.getByRole('link', { name: /So entsteht der Kiez-Score/ }).click();
		await expect(page).toHaveURL(/\/methodik\/kiez-score/);
		expect(page.url()).not.toMatch(/\/en\//);
	});
});

test.describe('FAQ-Folge Kiez', () => {
	test('DE und EN zeigen gleich viele Fragen mit denselben Kapitel-Sprungmarken', async ({
		page
	}) => {
		const read = async (path: string) => {
			await page.goto(path);
			const hrefs = await page
				.locator('#fragen details a[href^="#"]')
				.evaluateAll((els) => els.map((el) => el.getAttribute('href')));
			const count = await page.locator('#fragen summary').count();
			return { hrefs, count };
		};
		const de = await read(`/kiez/${KIEZ_SLUG}`);
		const en = await read(`/en/kiez/${KIEZ_SLUG}`);
		expect(de.count).toBeGreaterThan(1);
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
	const areaTestId = 'place-administrative-area-jsonld';
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
			const crumbs = (await readJsonLd(page, 'place-breadcrumb-jsonld')).itemListElement ?? [];
			expect(crumbs.length).toBeGreaterThan(1);
			for (const crumb of crumbs) expect(new URL(crumb.item).pathname).toMatch(/^\/en(\/|$)/);
		});

		test(`/${kind}/${slug} (DE): url ohne Präfix, DE-Property-Namen`, async ({ page }) => {
			await page.goto(`/${kind}/${slug}`);
			const ld = await readJsonLd(page, areaTestId);
			expect(ld.url).toMatch(new RegExp(`/${kind}/${slug}$`));
			expect(ld.url).not.toContain('/en/');
			expect(ld.additionalProperty?.map((p) => p.name)).toEqual(['Einwohner', 'Fläche (ha)']);
			const crumbs = (await readJsonLd(page, 'place-breadcrumb-jsonld')).itemListElement ?? [];
			for (const crumb of crumbs) expect(new URL(crumb.item).pathname).not.toMatch(/^\/en(\/|$)/);
		});
	});
}
