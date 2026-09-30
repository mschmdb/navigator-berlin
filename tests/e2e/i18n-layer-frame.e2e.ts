import { expect, test } from '@playwright/test';

// i18n Block B4b (spec-i18n-b4b-layer-rahmen.md): Rahmen der Layer-Detailseite
// auf Englisch. Layer-Explain-Fließtext (`explain.*`) und Methodik-Inhalte
// (`methodology.*`) blieben zunächst deutsch (Boundary, Block C) -- die
// Section-Chrome (Überschriften, Labels, Links) war schon übersetzt.
//
// i18n Block C1 (spec-i18n-c1-hinweise-layer-erklaerungen.md): `explain.*`
// (Lead, Skala) ist jetzt ebenfalls lokalisiert (Messages), kein lang="de"
// mehr dafür.
//
// i18n Block C2 (spec-i18n-c2-layer-methodik.md): `methodology.*`
// (Berechnung, Aggregation, Pflege, Aktualisierung, Coverage-Lücken,
// Omissions) ist jetzt ebenfalls lokalisiert (Messages), kein lang="de"
// mehr dafür -- der Methodik-Block ist damit komplett aus der Teil-
// Übersetzung raus. `/layer` bleibt trotzdem im TEIL-Übersetzungs-Register
// (Register-Eintrag erst im Abschluss-Block; FAQ seit C3 englisch): `/en/layer/…`
// zeigt weiterhin das Teil-Übersetzungs-Banner und bleibt noindex ohne
// hreflang (siehe `i18n-routing.e2e.ts`).
//
// i18n Block C3 (spec-i18n-c3-faq.md): FAQ kommt in der Seiten-Locale aus
// `faq_qna` (EN-Zeilen), ohne lang="de".

// Sprachprüfung ohne Ordnung; die FAQ-Reihenfolge prüft `i18n-profile-frame.e2e.ts` (`sort_order`).
const DE_QUESTION_START =
	/^(Wie|Was|Warum|Welche[rsmn]?|Wo|Wann|Wer|Worin|Wodurch|Berücksichtigt|Bewertet|Ist|Gibt|Wird)\b/;

const LAYER_WITH_METHODOLOGY = 'laerm-2023';
const LAYER_WITHOUT_METHODOLOGY = 'kultur-museum';
const HITZE_LAYER = 'kuehle-orte';

test.describe('i18n Block B4b: /en/layer/[slug]', () => {
	test('lang=en, Titel + Layer-Name + Quelle-Karte + Werte + Berechnung englisch', async ({
		page
	}) => {
		const response = await page.goto(`/en/layer/${LAYER_WITH_METHODOLOGY}`);
		expect(response?.status()).toBe(200);
		await expect(page.locator('html')).toHaveAttribute('lang', 'en');
		await expect(page).toHaveTitle(/Noise pollution 2023 - Berlin in data - navigator\.berlin/);
		await expect(page.getByTestId('layer-detail-name')).toHaveText(/Noise pollution 2023/);

		const sourceCard = page.getByTestId('layer-detail-source-card');
		await expect(sourceCard).toContainText('Source');
		await expect(sourceCard).toContainText('Provider');
		await expect(sourceCard).toContainText('Licence');
		await expect(sourceCard).toContainText('Data as of');
		await expect(sourceCard).toContainText('Features');
		await expect(sourceCard).toContainText('542');

		const scale = page.getByTestId('layer-detail-scale');
		await expect(scale).toContainText('Values');
		await expect(scale).toContainText('Scale');
		// i18n Block C1: die Skala (`explain.valueScaleExplain`) ist jetzt
		// selbst lokalisiert (Messages) -- kein lang="de" mehr, echter EN-Text.
		const scaleDd = scale.locator('dd').last();
		await expect(scaleDd).not.toHaveAttribute('lang', 'de');
		await expect(scaleDd).toContainText('low (good) to high (problematic)');

		// i18n Block C2: die Methodik-Felder (Berechnung, Pflege, Aktualisierung)
		// sind jetzt selbst lokalisiert (Messages) -- kein lang="de" mehr,
		// echter EN-Text.
		const methodology = page.getByTestId('layer-detail-methodology');
		await expect(methodology).toContainText('Calculation');
		await expect(methodology).toContainText('Aggregation');
		await expect(methodology).toContainText('Maintenance');
		await expect(methodology.locator('p')).not.toHaveAttribute('lang', 'de');
		await expect(methodology.locator('p')).toContainText(/Total traffic noise from road/);
		await expect(methodology).toContainText(
			'Senate Department for Urban Mobility, Transport, Climate Action and the Environment'
		);

		// i18n Block C1: der Lead (`explain.long`) ist jetzt selbst lokalisiert
		// (Messages) -- kein lang="de" mehr, echter EN-Text.
		const lead = page.getByTestId('layer-detail-lead');
		await expect(lead).not.toHaveAttribute('lang', 'de');
		await expect(lead).toContainText(/Categorised overall noise pollution/);
	});

	// i18n Block D1 (spec-i18n-d1-register-sitemap.md): `/en/layer/…` ist im
	// Übersetzungs-Register. Kein Banner, kein noindex, hreflang de/en/x-default.
	test('Registriert: kein Banner, kein noindex, hreflang de/en/x-default, main lang=en', async ({
		page
	}) => {
		const response = await page.goto(`/en/layer/${LAYER_WITH_METHODOLOGY}`);
		expect(response?.status()).toBe(200);
		await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
		await expect(page.locator('main#main')).toHaveAttribute('lang', 'en');
		await expect(page.getByTestId('translation-disclaimer')).toHaveCount(0);
		await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute(
			'href',
			/\/en\/layer\/[a-z0-9-]+$/
		);
		await expect(page.locator('link[rel="alternate"][hreflang="de"]')).toHaveAttribute(
			'href',
			/\/layer\/[a-z0-9-]+$/
		);
		await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveCount(1);
	});

	test('Dataset- und Breadcrumb-JSON-LD folgen auf /en der Seiten-Locale (Block D1, inLanguage en-US)', async ({
		page
	}) => {
		await page.goto(`/en/layer/${LAYER_WITH_METHODOLOGY}`);
		const dataset = JSON.parse(
			(await page
				.locator('script[type="application/ld+json"][data-testid="layer-dataset-jsonld"]')
				.textContent()) ?? '{}'
		);
		expect(dataset.name).toBe('Noise pollution 2023');
		expect(dataset.inLanguage).toBe('en-US');
		expect(dataset.creator?.name).toMatch(/Senate Department/);
		expect(dataset.creator?.name).not.toMatch(/Senatsverwaltung/);

		const breadcrumb = JSON.parse(
			(await page
				.locator('script[type="application/ld+json"][data-testid="layer-breadcrumb-jsonld"]')
				.textContent()) ?? '{}'
		);
		expect(breadcrumb.itemListElement[0].name).toBe('Berlin');
		expect(breadcrumb.itemListElement[1].name).toBe('Data');
		expect(breadcrumb.itemListElement[2].name).toBe('Noise pollution 2023');
		expect(breadcrumb.itemListElement[2].item).toMatch(
			new RegExp(`/en/layer/${LAYER_WITH_METHODOLOGY}$`)
		);
	});

	test('Coverage-Lücken + „Was wir NICHT zeigen"-Überschriften UND Inhalte englisch, kein lang="de"', async ({
		page
	}) => {
		// i18n Block C2: `coverageGaps`/`omissions` sind jetzt selbst
		// lokalisiert (Messages) -- kein lang="de" mehr, echter EN-Text.
		await page.goto(`/en/layer/${LAYER_WITH_METHODOLOGY}`);
		const coverageGaps = page.getByTestId('layer-detail-coverage-gaps');
		await expect(coverageGaps.locator('h2')).toHaveText('Coverage gaps');
		await expect(coverageGaps.locator('ul')).not.toHaveAttribute('lang', 'de');
		await expect(coverageGaps.locator('ul')).toContainText(
			'Model values, no city-wide network of monitoring stations.'
		);

		const omissions = page.getByTestId('layer-detail-omissions');
		await expect(omissions.locator('h2')).toHaveText("What we don't show");
		await expect(omissions.locator('ul')).not.toHaveAttribute('lang', 'de');
		await expect(omissions.locator('ul')).toContainText(
			'No breakdown by source (road, rail, air traffic) at this aggregate level.'
		);
	});

	test('Verwandte Layer: englischer Name, Klick führt auf /en/layer/…', async ({ page }) => {
		await page.goto(`/en/layer/${LAYER_WITH_METHODOLOGY}`);
		const related = page.getByTestId('layer-detail-related');
		await expect(related.locator('h2')).toHaveText('Related layers');
		const link = related.getByRole('link', { name: /Air pollution 2023/ });
		await expect(link).toBeVisible();
		await link.click();
		await expect(page).toHaveURL(/\/en\/layer\/luft-2023/);
	});

	test('Methodik-Aside + Inspector-Link führen auf /en/methodik bzw. /en/explore', async ({
		page
	}) => {
		await page.goto(`/en/layer/${LAYER_WITH_METHODOLOGY}`);
		await page.getByTestId('layer-detail-methodik-link').getByRole('link').click();
		await expect(page).toHaveURL(/\/en\/methodik/);

		await page.goto(`/en/layer/${LAYER_WITH_METHODOLOGY}`);
		const inspectorLink = page.getByTestId('layer-detail-inspector-link');
		await expect(inspectorLink).toContainText('View layer on the map');
		await inspectorLink.click();
		await expect(page).toHaveURL(new RegExp(`/en/explore\\?layers=${LAYER_WITH_METHODOLOGY}`));
	});

	test('Leerzustand ohne Methodik: englischer Hinweis, EN-Mailto-Label, Mail-Body bleibt deutsch', async ({
		page
	}) => {
		const response = await page.goto(`/en/layer/${LAYER_WITHOUT_METHODOLOGY}`);
		expect(response?.status()).toBe(200);
		const empty = page.getByTestId('layer-detail-methodology-empty');
		await expect(empty).toContainText('not fully documented yet');
		await expect(empty.getByRole('link', { name: 'Open methodology' })).toHaveAttribute(
			'href',
			/\/en\/methodik/
		);

		const mailto = page.getByTestId('error-feedback-mailto');
		await expect(mailto).toContainText('Error in this entry');
		const href = await mailto.getAttribute('href');
		expect(href).toMatch(/^mailto:/);
		// Review-Fund #20: Mail-Betreff bleibt deutsch mit dem DE-Layer-Namen
		// (`deLayerName`), nicht dem lokalisierten Anzeige-Namen.
		expect(href).toContain(encodeURIComponent('Fehler im Eintrag: Museen'));
	});

	test('Hitze-CTA zeigt englischen Text mit /en/hitze-Href', async ({ page }) => {
		await page.goto(`/en/layer/${HITZE_LAYER}`);
		const cta = page.getByTestId('layer-detail-hitze-link');
		await expect(cta).toContainText('Heat Navigator');
		await cta.click();
		await expect(page).toHaveURL(/\/en\/hitze/);
	});

	test('FAQ englisch ohne lang="de", Layer-Name englisch, FAQPage-JSON-LD englisch (Block C3)', async ({
		page
	}) => {
		await page.goto(`/en/layer/${LAYER_WITH_METHODOLOGY}`);
		const faq = page.getByTestId('faq-section');
		const enQuestions = await faq.locator('[data-faq-question]').allTextContents();
		expect(enQuestions.length).toBeGreaterThan(0);
		for (const q of enQuestions) expect(q).not.toMatch(DE_QUESTION_START);
		await expect(faq.locator('[lang="de"]')).toHaveCount(0);
		await expect(faq).not.toContainText('Lärm');
		const ld = JSON.parse(
			(await page.locator('script[data-testid="faq-jsonld"]').textContent()) ?? '{}'
		);
		for (const e of ld.mainEntity as { name: string }[]) {
			expect(e.name).not.toMatch(DE_QUESTION_START);
		}
	});

	test('DE-Kontrolle: /layer/[slug] bleibt unverändert deutsch', async ({ page }) => {
		const response = await page.goto(`/layer/${LAYER_WITH_METHODOLOGY}`);
		expect(response?.status()).toBe(200);
		const deQuestions = await page
			.getByTestId('faq-section')
			.locator('[data-faq-question]')
			.allTextContents();
		expect(deQuestions.some((q) => DE_QUESTION_START.test(q))).toBe(true);
		await expect(page.getByTestId('faq-section').locator('[lang]')).toHaveCount(0);
		await expect(page.locator('html')).toHaveAttribute('lang', 'de');
		await expect(page).toHaveTitle(/Lärmbelastung 2023 - Berlin in Daten - navigator\.berlin/);

		const sourceCard = page.getByTestId('layer-detail-source-card');
		await expect(sourceCard).toContainText('Quelle');
		await expect(sourceCard).toContainText('Anbieter');
		await expect(sourceCard).toContainText('Lizenz');
		await expect(sourceCard).toContainText('Datenstand');

		const lead = page.getByTestId('layer-detail-lead');
		await expect(lead).not.toHaveAttribute('lang', 'de');

		// i18n Block C2: DE-Parität für den Methodik-Block -- Berechnung bleibt
		// wörtlich der deutsche Spec-Text, kein Message-Umweg verändert ihn.
		const methodology = page.getByTestId('layer-detail-methodology');
		await expect(methodology).toContainText('Gesamtverkehrslärm aus Straßen-');
		await expect(methodology).toContainText(
			'Senatsverwaltung für Mobilität, Verkehr, Klimaschutz und Umwelt'
		);

		await page.getByTestId('layer-detail-methodik-link').getByRole('link').click();
		await expect(page).toHaveURL(/\/methodik/);
		expect(page.url()).not.toMatch(/\/en\//);
	});

	// i18n Block C2: der OSM-Composite-Suffix (`AUTHORITY_SUFFIX_OSM_ODBL`)
	// bleibt auf DE bei der Bindestrich-Schreibweise "OpenStreetMap-Contributors"
	// -- Regressionsschutz dafür, dass die neue Locale-Faehigkeit des Suffix
	// (Review-Fund) die DE-Ausgabe nicht verändert hat.
	// `trinkbrunnen` statt `stolpersteine`: `stolpersteine` ist ein Build-only-
	// Layer ohne öffentliche `/layer/<slug>`-Seite (404, siehe
	// `get-layer-detail.ts`-Kommentar), `trinkbrunnen` hat denselben
	// OSM-Suffix und eine echte Detailseite.
	test('DE-Kontrolle: OSM-Composite-Authority zeigt "OpenStreetMap-Contributors" (Bindestrich)', async ({
		page
	}) => {
		const response = await page.goto('/layer/trinkbrunnen');
		expect(response?.status()).toBe(200);
		const methodology = page.getByTestId('layer-detail-methodology');
		await expect(methodology).toContainText('OpenStreetMap-Contributors (ODbL 1.0)');
	});
});
