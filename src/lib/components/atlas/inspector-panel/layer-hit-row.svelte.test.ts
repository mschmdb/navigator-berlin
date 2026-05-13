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

	it('Mailto-Link enthält slug und displayName', async () => {
		render(LayerHitRow, {
			hit: recentHit,
			layerName: 'Mietspiegel-Wohnlage',
			addressDisplayName: 'Boxhagener Straße 12'
		});
		const link = (await page.getByTestId('report-error').element()) as HTMLAnchorElement;
		expect(link.href).toMatch(/^mailto:hallo@navigator\.berlin/);
		expect(link.href).toMatch(/mietspiegel-wohnlage/);
		expect(decodeURIComponent(link.href)).toMatch(/Boxhagener Straße 12/);
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
});
