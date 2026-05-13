import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import Page from './+page.svelte';
import type { LayerDetail } from '$lib/data/get-layer-detail.js';
import type { LayerMetadata } from '$lib/data';

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

function detail(slug = 'laerm-2023'): LayerDetail {
	return {
		slug,
		lang: 'de',
		layerName: 'Lärmbelastung (Umweltatlas 2023)',
		explain: {
			short: 'Lärmbelastung im Stadtteil',
			long: 'Kategorisierte Lärm-Gesamtbelastung pro Planungsraum aus dem Berliner Umweltatlas 2023.',
			valueScaleExplain: 'niedrig bis sehr hoch'
		},
		meta: makeMeta(slug)
	};
}

describe('layer-detail +page.svelte', () => {
	it('rendert layerName als h1', async () => {
		render(Page, { data: { detail: detail() } });
		const h1 = (await page.getByTestId('layer-detail-name').element()) as HTMLElement;
		expect(h1.tagName).toBe('H1');
		expect(h1.textContent).toMatch(/Lärmbelastung/);
	});

	it('rendert long-Explain als Lead', async () => {
		render(Page, { data: { detail: detail() } });
		const lead = (await page.getByTestId('layer-detail-lead').element()) as HTMLElement;
		expect(lead.textContent).toMatch(/Lärm-Gesamtbelastung/);
	});

	it('rendert Source-Card mit Source-Link', async () => {
		render(Page, { data: { detail: detail() } });
		const link = (await page
			.getByTestId('layer-detail-source-link')
			.element()) as HTMLAnchorElement;
		expect(link.href).toBe('https://gdi.berlin.de/wfs/ua');
		expect(link.target).toBe('_blank');
	});

	it('rendert License-Label', async () => {
		render(Page, { data: { detail: detail() } });
		const lic = (await page.getByTestId('layer-detail-license').element()) as HTMLElement;
		expect(lic.textContent).toMatch(/dl-de\/zero/);
	});

	it('rendert Inspector-Link mit Layer-URL-State', async () => {
		render(Page, { data: { detail: detail('wohnlagen-2024') } });
		const link = (await page
			.getByTestId('layer-detail-inspector-link')
			.element()) as HTMLAnchorElement;
		expect(link.getAttribute('href')).toMatch(/\/\?layers=wohnlagen-2024/);
	});

	it('rendert Scale-Section bei vorhandenem valueScaleExplain', async () => {
		render(Page, { data: { detail: detail() } });
		const scale = (await page.getByTestId('layer-detail-scale').element()) as HTMLElement;
		expect(scale.textContent).toMatch(/niedrig bis sehr hoch/);
	});

	it('rendert keine Scale-Section ohne valueScaleExplain + ohne unit', async () => {
		const d = { ...detail(), explain: { short: 'foo', long: 'bar' } };
		render(Page, { data: { detail: d } });
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
		render(Page, { data: { detail: d } });
		await expect.element(page.getByTestId('layer-detail-editorial')).toBeInTheDocument();
		await expect.element(page.getByTestId('editorial-disclaimer')).toBeInTheDocument();
	});

	it('rendert keinen Disclaimer-Bereich ohne editorial-Config', async () => {
		render(Page, { data: { detail: detail() } });
		await expect.element(page.getByTestId('layer-detail-editorial')).not.toBeInTheDocument();
	});

	it('rendert Bundle-Group oberhalb h1', async () => {
		render(Page, { data: { detail: detail() } });
		const article = (await page.getByTestId('layer-detail-page').element()) as HTMLElement;
		expect(article.textContent).toMatch(/C: Umwelt/);
	});
});
