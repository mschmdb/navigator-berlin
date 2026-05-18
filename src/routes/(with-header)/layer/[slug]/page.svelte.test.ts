import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import Page from './+page.svelte';
import type { LayerDetail } from '$lib/data/get-layer-detail.js';
import type { LayerMetadata } from '$lib/data';
import type { LayerMethodology } from '$lib/data/layer-methodology.js';

function makeMeta(slug: string, overrides: Partial<LayerMetadata> = {}): LayerMetadata {
	return {
		slug,
		filename: `${slug}.geojson`,
		sourceUrl: 'https://gdi.berlin.de/wfs/ua',
		fetchedAt: '2026-05-12T10:00:00.000Z',
		sourceUpdatedAt: '2024-01-01T00:00:00.000Z',
		license: 'dl-de/zero-2-0',
		sha256: 'a'.repeat(64),
		bundleGroup: 'C: Umwelt',
		zoomThresholds: { min: 9, max: 18 },
		geometryType: 'Polygon',
		featureCount: 542,
		...overrides
	};
}

function methodology(): LayerMethodology {
	return {
		calculation:
			'Modellierte Lärm-Gesamtbelastung pro LOR-Planungsraum aus dem Umweltatlas 2023.',
		coverageGaps: ['Modellwerte, keine flächendeckenden Mess-Stationen.'],
		omissions: ['Keine Trennung nach Quelle (Straße, Schiene, Flug).'],
		relatedLayers: ['luft-2023'],
		aggregationLevel: 'lor-planungsraum',
		updateFrequency: 'alle 5 Jahre',
		authority: 'Senatsverwaltung für Mobilität, Verkehr, Klimaschutz und Umwelt'
	};
}

function detail(
	slug = 'laerm-2023',
	overrides: Partial<LayerDetail> = {}
): LayerDetail {
	return {
		slug,
		lang: 'de',
		layerName: 'Lärmbelastung (Umweltatlas 2023)',
		explain: {
			short: 'Lärmbelastung im Stadtteil',
			long: 'Kategorisierte Lärm-Gesamtbelastung pro Planungsraum aus dem Berliner Umweltatlas 2023.',
			valueScaleExplain: 'niedrig bis sehr hoch'
		},
		meta: makeMeta(slug),
		methodology: methodology(),
		...overrides
	};
}

describe('layer-detail +page.svelte', () => {
	it('rendert layerName als h1', async () => {
		render(Page, { data: { detail: detail(), faq: [] } });
		const h1 = (await page.getByTestId('layer-detail-name').element()) as HTMLElement;
		expect(h1.tagName).toBe('H1');
		expect(h1.textContent).toMatch(/Lärmbelastung/);
	});

	it('rendert long-Explain als Lead', async () => {
		render(Page, { data: { detail: detail(), faq: [] } });
		const lead = (await page.getByTestId('layer-detail-lead').element()) as HTMLElement;
		expect(lead.textContent).toMatch(/Lärm-Gesamtbelastung/);
	});

	it('rendert Source-Card mit Source-Link', async () => {
		render(Page, { data: { detail: detail(), faq: [] } });
		const link = (await page
			.getByTestId('layer-detail-source-link')
			.element()) as HTMLAnchorElement;
		expect(link.href).toBe('https://gdi.berlin.de/wfs/ua');
		expect(link.target).toBe('_blank');
	});

	it('rendert License-Label', async () => {
		render(Page, { data: { detail: detail(), faq: [] } });
		const lic = (await page.getByTestId('layer-detail-license').element()) as HTMLElement;
		expect(lic.textContent).toMatch(/dl-de\/zero/);
	});

	it('rendert Inspector-Link mit Layer-URL-State', async () => {
		render(Page, { data: { detail: detail('wohnlagen-2024'), faq: [] } });
		const link = (await page
			.getByTestId('layer-detail-inspector-link')
			.element()) as HTMLAnchorElement;
		expect(link.getAttribute('href')).toMatch(/\/explore\?layers=wohnlagen-2024/);
	});

	it('rendert Scale-Section bei vorhandenem valueScaleExplain', async () => {
		render(Page, { data: { detail: detail(), faq: [] } });
		const scale = (await page.getByTestId('layer-detail-scale').element()) as HTMLElement;
		expect(scale.textContent).toMatch(/niedrig bis sehr hoch/);
	});

	it('rendert keine Scale-Section ohne valueScaleExplain + ohne unit', async () => {
		const d = { ...detail(), explain: { short: 'foo', long: 'bar' } };
		render(Page, { data: { detail: d, faq: [] } });
		await expect.element(page.getByTestId('layer-detail-scale')).not.toBeInTheDocument();
	});

	it('rendert Editorial-Disclaimer wenn editorial-Config gesetzt', async () => {
		const d: LayerDetail = {
			...detail('wohnlagen-2024'),
			editorial: {
				slug: 'wohnlagen-2024',
				disclaimerVariants: ['legal'],
				primarySourceUrl: 'https://mietspiegel.berlin.de/',
				feedbackMailto: true
			}
		};
		render(Page, { data: { detail: d, faq: [] } });
		await expect.element(page.getByTestId('layer-detail-editorial')).toBeInTheDocument();
		await expect.element(page.getByTestId('editorial-disclaimer')).toBeInTheDocument();
	});

	it('rendert keinen Disclaimer-Bereich ohne editorial-Config', async () => {
		render(Page, { data: { detail: detail(), faq: [] } });
		await expect.element(page.getByTestId('layer-detail-editorial')).not.toBeInTheDocument();
	});

	it('rendert Bundle-Group oberhalb h1', async () => {
		render(Page, { data: { detail: detail(), faq: [] } });
		const article = (await page.getByTestId('layer-detail-page').element()) as HTMLElement;
		expect(article.textContent).toMatch(/C: Umwelt/);
	});

	it('rendert Methodology-Section „Berechnung"', async () => {
		render(Page, { data: { detail: detail(), faq: [] } });
		const sec = (await page.getByTestId('layer-detail-methodology').element()) as HTMLElement;
		expect(sec.textContent).toMatch(/Berechnung/);
		expect(sec.textContent).not.toMatch(/Wie berechnet/);
		expect(sec.textContent).toMatch(/Modellierte Lärm-Gesamtbelastung/);
	});

	it('rendert Coverage-Gaps-Section nur wenn coverageGaps gefüllt', async () => {
		render(Page, { data: { detail: detail(), faq: [] } });
		const sec = (await page
			.getByTestId('layer-detail-coverage-gaps')
			.element()) as HTMLElement;
		expect(sec.textContent).toMatch(/Modellwerte/);
	});

	it('rendert Omissions-Section nur wenn omissions gefüllt', async () => {
		render(Page, { data: { detail: detail(), faq: [] } });
		const sec = (await page.getByTestId('layer-detail-omissions').element()) as HTMLElement;
		expect(sec.textContent).toMatch(/Trennung nach Quelle/);
	});

	it('rendert Related-Layers-Section mit Auto-Link', async () => {
		render(Page, { data: { detail: detail(), faq: [] } });
		const sec = (await page.getByTestId('layer-detail-related').element()) as HTMLElement;
		const link = sec.querySelector('a[href="/layer/luft-2023"]');
		expect(link, 'Auto-Link zu /layer/luft-2023').not.toBeNull();
		expect(link?.textContent).toMatch(/Luft/);
	});

	it('rendert Methodik-Banner mit Link auf /methodik', async () => {
		render(Page, { data: { detail: detail(), faq: [] } });
		const banner = (await page
			.getByTestId('layer-detail-methodik-link')
			.element()) as HTMLElement;
		const link = banner.querySelector('a');
		expect(link?.getAttribute('href')).toMatch(/^\/methodik/);
	});

	it('blendet Sections mit leerem Inhalt aus (kein Coverage-Gaps wenn fehlt)', async () => {
		const d = detail('laerm-2023', {
			methodology: { ...methodology(), coverageGaps: undefined, omissions: undefined }
		});
		render(Page, { data: { detail: d, faq: [] } });
		await expect
			.element(page.getByTestId('layer-detail-coverage-gaps'))
			.not.toBeInTheDocument();
		await expect
			.element(page.getByTestId('layer-detail-omissions'))
			.not.toBeInTheDocument();
	});

	it('rendert Dataset-JSON-LD mit license-URL + creator + distribution.contentUrl', async () => {
		render(Page, { data: { detail: detail(), faq: [] } });
		const script = document.querySelector(
			'script[type="application/ld+json"][data-testid="layer-dataset-jsonld"]'
		);
		expect(script).not.toBeNull();
		const parsed = JSON.parse(script?.textContent ?? '{}');
		expect(parsed['@type']).toBe('Dataset');
		expect(parsed.name).toMatch(/Lärmbelastung/);
		expect(parsed.license).toBe('https://www.govdata.de/dl-de/zero-2-0');
		expect(parsed.creator?.['@type']).toBe('Organization');
		expect(parsed.creator?.name).toMatch(/Senatsverwaltung/);
		expect(parsed.distribution?.contentUrl).toMatch(/\/layers\/laerm-2023\.geojson$/);
		expect(parsed.inLanguage).toBe('de-DE');
	});

	it('Dataset-JSON-LD nutzt navigator.berlin als creator-Fallback wenn authority fehlt', async () => {
		const d = detail('laerm-2023', {
			methodology: { ...methodology(), authority: undefined }
		});
		render(Page, { data: { detail: d, faq: [] } });
		const script = document.querySelector(
			'script[type="application/ld+json"][data-testid="layer-dataset-jsonld"]'
		);
		const parsed = JSON.parse(script?.textContent ?? '{}');
		expect(parsed.creator?.name).toBe('navigator.berlin');
	});

	it('zeigt „Methodik in Vorbereitung"-Banner wenn methodology null', async () => {
		const d = detail('laerm-2023', { methodology: null });
		render(Page, { data: { detail: d, faq: [] } });
		const banner = (await page
			.getByTestId('layer-detail-methodology-empty')
			.element()) as HTMLElement;
		expect(banner.textContent).toMatch(/Methodik in Vorbereitung/);
		expect(banner.querySelector('a[href*="methodik"]')).not.toBeNull();
		expect(banner.querySelector('[data-testid="error-feedback-mailto"]')).not.toBeNull();
	});
});
