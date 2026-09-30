import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import MethodikDatenTabelle from './methodik-daten-tabelle.svelte';
import type { LayerMetadata } from '$lib/data';

function meta(slug: string, overrides: Partial<LayerMetadata> = {}): LayerMetadata {
	return {
		slug,
		filename: `${slug}.geojson`,
		sourceUrl: 'https://gdi.berlin.de/wfs/x',
		fetchedAt: '2026-05-12T00:00:00.000Z',
		sourceUpdatedAt: '2024-06-01T00:00:00.000Z',
		license: 'dl-de/zero-2-0',
		sha256: 'a'.repeat(64),
		bundleGroup: 'C: Umwelt',
		zoomThresholds: { min: 9, max: 18 },
		geometryType: 'Polygon',
		featureCount: 100,
		...overrides
	};
}

describe('methodik-daten-tabelle.svelte', () => {
	it('rendert table mit caption + th scope=col', async () => {
		render(MethodikDatenTabelle, { layers: [meta('laerm-2023')] });
		const table = (await page.getByTestId('methodik-daten-table').element()) as HTMLTableElement;
		expect(table.tagName).toBe('TABLE');
		expect(table.querySelector('caption')?.textContent).toMatch(/Daten/);
		const headers = table.querySelectorAll('th[scope="col"]');
		expect(headers.length).toBeGreaterThanOrEqual(4);
	});

	it('listet alle übergebenen Layer als Rows', async () => {
		render(MethodikDatenTabelle, {
			layers: [meta('laerm-2023'), meta('luft-2023'), meta('bioklima-2023')]
		});
		const rows = document.querySelectorAll('[data-testid="methodik-daten-table"] tbody tr');
		expect(rows.length).toBe(3);
	});

	it('Layer-Name verlinkt auf /layer/{slug}', async () => {
		render(MethodikDatenTabelle, { layers: [meta('wohnlagen-2024')] });
		const link = document.querySelector(
			'[data-testid="methodik-daten-table"] a[href="/layer/wohnlagen-2024"]'
		);
		expect(link).not.toBeNull();
	});

	it('zeigt sourceUpdatedAt formatiert (Year-Month)', async () => {
		render(MethodikDatenTabelle, { layers: [meta('laerm-2023')] });
		const cells = document.querySelectorAll('[data-testid="methodik-daten-table"] td');
		const text = Array.from(cells)
			.map((c) => c.textContent ?? '')
			.join(' ');
		expect(text).toMatch(/2024/);
	});

	it('default sortiert alphabetisch nach Display-Name', async () => {
		render(MethodikDatenTabelle, {
			layers: [meta('luft-2023'), meta('bezirke', { bundleGroup: 'A: Boundaries' })]
		});
		const rows = document.querySelectorAll('[data-testid="methodik-daten-table"] tbody tr');
		const firstSlug = rows[0]?.getAttribute('data-slug');
		const secondSlug = rows[1]?.getAttribute('data-slug');
		expect(firstSlug).toBe('bezirke');
		expect(secondSlug).toBe('luft-2023');
	});

	it('zeigt License-Spalte', async () => {
		render(MethodikDatenTabelle, { layers: [meta('laerm-2023')] });
		const text = (await page.getByTestId('methodik-daten-table').element()).textContent ?? '';
		expect(text).toMatch(/dl-de\/zero/);
	});
});

describe('methodik-daten-tabelle.svelte · Locale (i18n C4a)', () => {
	afterEach(() => {
		overwriteGetLocale(() => 'de');
	});

	it('DE: Kopf, Caption und Bundle-Rohwert unverändert', async () => {
		render(MethodikDatenTabelle, { layers: [meta('laerm-2023')] });
		const table = (await page.getByTestId('methodik-daten-table').element()) as HTMLTableElement;
		expect(table.querySelector('caption')?.textContent?.trim()).toBe(
			'Daten-Stand-Tabelle aller aktiven Layer'
		);
		const heads = [...table.querySelectorAll('th')].map((th) => th.textContent?.trim());
		expect(heads).toEqual(['Layer', 'Bundle', 'Stand', 'Lizenz']);
		expect(table.querySelector('tbody tr td:nth-child(2)')?.textContent?.trim()).toBe('C: Umwelt');
	});

	it('EN: Kopf, Caption, Bundle-Label und Layer-Link unter /en', async () => {
		overwriteGetLocale(() => 'en');
		render(MethodikDatenTabelle, { layers: [meta('laerm-2023')] });
		const table = (await page.getByTestId('methodik-daten-table').element()) as HTMLTableElement;
		expect(table.querySelector('caption')?.textContent?.trim()).toBe(
			'Data status table of all active layers'
		);
		const heads = [...table.querySelectorAll('th')].map((th) => th.textContent?.trim());
		expect(heads).toEqual(['Layer', 'Bundle', 'Last updated', 'Licence']);
		expect(table.querySelector('tbody tr td:nth-child(2)')?.textContent?.trim()).toBe(
			'C · Environment'
		);
		expect(table.querySelector('tbody a')?.getAttribute('href')).toBe('/en/layer/laerm-2023');
		expect(table.querySelector('tbody a')?.textContent?.trim()).toBe('Noise pollution 2023');
	});
});
