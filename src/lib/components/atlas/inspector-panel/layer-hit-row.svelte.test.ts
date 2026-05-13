import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import LayerHitRow from './layer-hit-row.svelte';
import type { LayerHit } from '$lib/data';

const recentHit: LayerHit = {
	layer: 'mietspiegel-wohnlage',
	value: 'gut',
	source: 'https://fbinter.stadt-berlin.de/wfs',
	updatedAt: '2025-06-01T00:00:00Z',
	license: 'dl-de/zero-2-0'
};

describe('layer-hit-row.svelte', () => {
	it('rendert external-link für wohnlagen-2024 (Mietspiegel-Rechner)', async () => {
		render(LayerHitRow, {
			hit: {
				layer: 'wohnlagen-2024',
				value: { wol_mode: 'mittel', plr_name: 'Karlshorst', count_mittel: 12 },
				source: 'https://gdi.berlin.de/services/wfs/wohnlagenadr2024',
				updatedAt: '2024-06-10T00:00:00Z',
				license: 'dl-de/by-2-0'
			},
			layerName: 'Mietspiegel-Wohnlage 2024'
		});
		const link = (await page.getByTestId('external-link').element()) as HTMLAnchorElement;
		expect(link.href).toBe('https://mietspiegel.berlin.de/');
		expect(link.getAttribute('target')).toBe('_blank');
		expect(link.getAttribute('rel')).toMatch(/noopener/);
		expect(link.textContent).toMatch(/Mietspiegel-Rechner/);
	});

	it('rendert keinen external-link für Layer ohne LAYER_EXTERNAL_LINK-Eintrag', async () => {
		render(LayerHitRow, { hit: recentHit, layerName: 'Mietspiegel-Wohnlage' });
		await expect.element(page.getByTestId('external-link')).not.toBeInTheDocument();
	});

	it('versteckt external-link bei no-coverage', async () => {
		render(LayerHitRow, {
			hit: {
				layer: 'wohnlagen-2024',
				value: null,
				reason: 'no-coverage',
				source: 'https://gdi.berlin.de/services/wfs/wohnlagenadr2024',
				updatedAt: '2024-06-10T00:00:00Z',
				license: 'dl-de/by-2-0'
			},
			layerName: 'Mietspiegel-Wohnlage 2024'
		});
		await expect.element(page.getByTestId('external-link')).not.toBeInTheDocument();
	});

	it('rendert with-value State default', async () => {
		render(LayerHitRow, { hit: recentHit, layerName: 'Mietspiegel-Wohnlage' });
		const row = (await page.getByTestId('layer-hit-row').element()) as HTMLElement;
		expect(row.getAttribute('data-state')).toBe('with-value');
		expect(row.getAttribute('aria-label')).toMatch(/Mietspiegel-Wohnlage: gut/);
	});

	it('role="group" gesetzt', async () => {
		render(LayerHitRow, { hit: recentHit, layerName: 'Mietspiegel-Wohnlage' });
		const row = (await page.getByTestId('layer-hit-row').element()) as HTMLElement;
		expect(row.getAttribute('role')).toBe('group');
	});

	it('No-Coverage-Reason → data-state="no-coverage" + Italic-Text', async () => {
		render(LayerHitRow, {
			hit: { ...recentHit, value: null, reason: 'no-coverage' },
			layerName: 'Mietspiegel-Wohnlage'
		});
		const row = (await page.getByTestId('layer-hit-row').element()) as HTMLElement;
		expect(row.getAttribute('data-state')).toBe('no-coverage');
		await expect.element(page.getByTestId('value-no-coverage')).toBeInTheDocument();
	});

	it('Seasonal-Reason → "Mai–Oktober aktiv"-Hinweis', async () => {
		render(LayerHitRow, {
			hit: { ...recentHit, layer: 'trinkbrunnen', value: null, reason: 'seasonal' },
			layerName: 'Trinkbrunnen'
		});
		const row = (await page.getByTestId('layer-hit-row').element()) as HTMLElement;
		expect(row.getAttribute('data-state')).toBe('seasonal');
		await expect.element(page.getByTestId('value-seasonal')).toBeInTheDocument();
	});

	it('Outdated (>5 Jahre) → data-state="outdated" + Pille', async () => {
		render(LayerHitRow, {
			hit: { ...recentHit, updatedAt: '2019-01-01T00:00:00Z' },
			layerName: 'Mietspiegel-Wohnlage'
		});
		const row = (await page.getByTestId('layer-hit-row').element()) as HTMLElement;
		expect(row.getAttribute('data-state')).toBe('outdated');
		await expect.element(page.getByTestId('outdated-pill')).toBeInTheDocument();
	});

	it('Numeric Wert nutzt Mono + tabular-nums', async () => {
		render(LayerHitRow, {
			hit: { ...recentHit, layer: 'laerm-den', value: 65 },
			layerName: 'Lärm Tag/Abend/Nacht'
		});
		const val = (await page.getByTestId('value').element()) as HTMLElement;
		expect(val.className).toMatch(/font-mono/);
		expect(val.className).toMatch(/tabular-nums/);
		expect(val.textContent?.trim()).toBe('65 dB');
	});

	it('Kategorischer Wert nutzt Sans + Semibold', async () => {
		render(LayerHitRow, { hit: recentHit, layerName: 'Mietspiegel-Wohnlage' });
		const val = (await page.getByTestId('value').element()) as HTMLElement;
		expect(val.className).toMatch(/font-semibold/);
		expect(val.className).not.toMatch(/font-mono/);
	});

	it('rendert Layer-Explain-Text aus LAYER_EXPLAIN_DE', async () => {
		render(LayerHitRow, { hit: recentHit, layerName: 'Mietspiegel-Wohnlage' });
		const explain = (await page.getByTestId('explain').element()) as HTMLElement;
		expect(explain.textContent).toMatch(/Wohnlagen-Bewertung/);
	});

	it('DataStandBanner ist eingebettet', async () => {
		render(LayerHitRow, { hit: recentHit, layerName: 'Mietspiegel-Wohnlage' });
		await expect.element(page.getByTestId('data-stand-banner')).toBeInTheDocument();
	});

	it('Inspector-Row enthält KEINEN Mailto-Link (Footer-Page deferred)', async () => {
		render(LayerHitRow, { hit: recentHit, layerName: 'Mietspiegel-Wohnlage' });
		await expect.element(page.getByTestId('error-feedback-mailto')).not.toBeInTheDocument();
		await expect.element(page.getByTestId('report-error')).not.toBeInTheDocument();
	});

	it('Learn-more-Link nutzt lang-Prefix', async () => {
		render(LayerHitRow, {
			hit: recentHit,
			layerName: 'Mietspiegel-Wohnlage',
			lang: 'en'
		});
		const link = (await page.getByTestId('learn-more').element()) as HTMLAnchorElement;
		expect(link.getAttribute('href')).toBe('/en/layer/mietspiegel-wohnlage');
	});

	it('Editorial: legal-Disclaimer für mietspiegel-wohnlage sichtbar', async () => {
		render(LayerHitRow, { hit: recentHit, layerName: 'Mietspiegel-Wohnlage' });
		const d = (await page.getByTestId('editorial-disclaimer').element()) as HTMLElement;
		expect(d.getAttribute('data-variant')).toBe('legal');
		expect(d.textContent).toMatch(/rechtliche Aussage/);
	});

	it('Editorial: bodenrichtwerte-Layer zeigt legal-Disclaimer', async () => {
		render(LayerHitRow, {
			hit: { ...recentHit, layer: 'bodenrichtwerte', value: 4500 },
			layerName: 'Bodenrichtwerte'
		});
		const d = (await page.getByTestId('editorial-disclaimer').element()) as HTMLElement;
		expect(d.getAttribute('data-variant')).toBe('legal');
	});

	it('Editorial: trinkbrunnen INSEASON zeigt aktiv-Pille, KEINEN seasonal-Disclaimer', async () => {
		render(LayerHitRow, {
			hit: { ...recentHit, layer: 'trinkbrunnen', value: { name: 'Brunnen 1' } },
			layerName: 'Trinkbrunnen'
		});
		await expect.element(page.getByTestId('seasonal-pill-active')).toBeInTheDocument();
		await expect.element(page.getByTestId('editorial-disclaimer')).not.toBeInTheDocument();
	});

	it('Editorial: trinkbrunnen OUTOFSEASON zeigt warning-Pille + seasonal-Disclaimer', async () => {
		render(LayerHitRow, {
			hit: { ...recentHit, layer: 'trinkbrunnen', value: null, reason: 'seasonal' },
			layerName: 'Trinkbrunnen'
		});
		await expect.element(page.getByTestId('seasonal-pill-outofseason')).toBeInTheDocument();
		const d = (await page.getByTestId('editorial-disclaimer').element()) as HTMLElement;
		expect(d.getAttribute('data-variant')).toBe('seasonal');
	});

	it('Editorial: stolpersteine-Hit rendert StolpersteinDetail', async () => {
		render(LayerHitRow, {
			hit: {
				...recentHit,
				layer: 'stolpersteine',
				value: { person: 'Rosa Beispiel', inscription: 'Hier wohnte Rosa' }
			},
			layerName: 'Stolpersteine'
		});
		await expect.element(page.getByTestId('stolperstein-detail')).toBeInTheDocument();
		const h = (await page.getByTestId('stolperstein-person').element()) as HTMLElement;
		expect(h.textContent).toMatch(/Rosa Beispiel/);
	});

	it('Editorial: stolpersteine-Hit zeigt source-Disclaimer', async () => {
		render(LayerHitRow, {
			hit: {
				...recentHit,
				layer: 'stolpersteine',
				value: { person: 'Rosa', inscription: 'x' }
			},
			layerName: 'Stolpersteine'
		});
		const d = (await page.getByTestId('editorial-disclaimer').element()) as HTMLElement;
		expect(d.getAttribute('data-variant')).toBe('source');
	});

	it('Editorial: Layer ohne Config zeigt KEINEN Disclaimer', async () => {
		render(LayerHitRow, {
			hit: { ...recentHit, layer: 'gebaeudealter', value: 'vor 1949' },
			layerName: 'Gebäudealter'
		});
		await expect.element(page.getByTestId('editorial-disclaimer')).not.toBeInTheDocument();
	});

	it('Editorial: Disclaimer rendert Source-Link wenn primarySourceUrl in Config', async () => {
		render(LayerHitRow, { hit: recentHit, layerName: 'Mietspiegel-Wohnlage' });
		const link = (await page.getByTestId('disclaimer-source-link').element()) as HTMLAnchorElement;
		expect(link.href).toMatch(/^https:\/\//);
	});
});
