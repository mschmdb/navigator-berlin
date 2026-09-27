import { expect, test } from '@playwright/test';

// i18n Block B4b (spec-i18n-b4b-layer-rahmen.md): Rahmen der Layer-Detailseite
// auf Englisch. Layer-Explain-Fließtext (`explain.*`) und Methodik-Inhalte
// (`methodology.*`) bleiben deutsch (Boundary, Block C) -- die Section-Chrome
// (Überschriften, Labels, Links) ist übersetzt. `/layer` ist NICHT im
// Übersetzungs-Register (Registrierung erst nach Block C), `/en/layer/…`
// bleibt deshalb noindex mit Fallback-Disclaimer (siehe `i18n-routing.e2e.ts`).

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
		// Skala-Wert bleibt deutsch (Boundary, Block C), trägt lang="de".
		await expect(scale.locator('dd[lang="de"]')).toContainText('niedrig (gut) bis sehr hoch');

		const methodology = page.getByTestId('layer-detail-methodology');
		await expect(methodology).toContainText('Calculation');
		await expect(methodology).toContainText('Aggregation');
		await expect(methodology).toContainText('Maintenance');
		await expect(methodology.locator('p[lang="de"]')).toContainText(
			/Modellierte Lärm-Gesamtbelastung/
		);

		const lead = page.getByTestId('layer-detail-lead');
		await expect(lead).toHaveAttribute('lang', 'de');
		await expect(lead).toContainText(/Kategorisierte Lärm-Gesamtbelastung/);
	});

	test('Dataset- und Breadcrumb-JSON-LD bleiben auf /en vollständig deutsch (Boundary inLanguage de-DE)', async ({
		page
	}) => {
		await page.goto(`/en/layer/${LAYER_WITH_METHODOLOGY}`);
		const dataset = JSON.parse(
			(await page
				.locator('script[type="application/ld+json"][data-testid="layer-dataset-jsonld"]')
				.textContent()) ?? '{}'
		);
		expect(dataset.name).toBe('Lärmbelastung 2023');
		expect(dataset.inLanguage).toBe('de-DE');

		const breadcrumb = JSON.parse(
			(await page
				.locator('script[type="application/ld+json"][data-testid="layer-breadcrumb-jsonld"]')
				.textContent()) ?? '{}'
		);
		expect(breadcrumb.itemListElement[0].name).toBe('Berlin');
		expect(breadcrumb.itemListElement[1].name).toBe('Daten');
		expect(breadcrumb.itemListElement[2].name).toBe('Lärmbelastung 2023');
	});

	test('Coverage-Lücken + „Was wir NICHT zeigen"-Überschriften englisch, Inhalte bleiben deutsch mit lang="de"', async ({
		page
	}) => {
		await page.goto(`/en/layer/${LAYER_WITH_METHODOLOGY}`);
		const coverageGaps = page.getByTestId('layer-detail-coverage-gaps');
		await expect(coverageGaps.locator('h2')).toHaveText('Coverage gaps');
		await expect(coverageGaps.locator('ul')).toHaveAttribute('lang', 'de');

		const omissions = page.getByTestId('layer-detail-omissions');
		await expect(omissions.locator('h2')).toHaveText("What we don't show");
		await expect(omissions.locator('ul')).toHaveAttribute('lang', 'de');
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

	test('DE-Kontrolle: /layer/[slug] bleibt unverändert deutsch', async ({ page }) => {
		const response = await page.goto(`/layer/${LAYER_WITH_METHODOLOGY}`);
		expect(response?.status()).toBe(200);
		await expect(page.locator('html')).toHaveAttribute('lang', 'de');
		await expect(page).toHaveTitle(/Lärmbelastung 2023 - Berlin in Daten - navigator\.berlin/);

		const sourceCard = page.getByTestId('layer-detail-source-card');
		await expect(sourceCard).toContainText('Quelle');
		await expect(sourceCard).toContainText('Anbieter');
		await expect(sourceCard).toContainText('Lizenz');
		await expect(sourceCard).toContainText('Datenstand');

		const lead = page.getByTestId('layer-detail-lead');
		await expect(lead).not.toHaveAttribute('lang', 'de');

		await page.getByTestId('layer-detail-methodik-link').getByRole('link').click();
		await expect(page).toHaveURL(/\/methodik/);
		expect(page.url()).not.toMatch(/\/en\//);
	});
});
