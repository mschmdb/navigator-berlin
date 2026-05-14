import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import DataStandBanner from './data-stand-banner.svelte';
import type { LayerHit } from '$lib/data';

const baseHit: LayerHit = {
	layer: 'mietspiegel-wohnlage',
	value: 'gut',
	source: 'https://fbinter.stadt-berlin.de/wfs/mietspiegel',
	updatedAt: '2025-06-15T12:00:00Z',
	license: 'dl-de/zero-2-0'
};

describe('data-stand-banner.svelte (Story 1.18 Compact)', () => {
	it('Kompakt-Format: "YYYY-MM · source · lizenz" ohne Stand:/Quelle:-Präfix', async () => {
		render(DataStandBanner, { hit: baseHit });
		const txt = (await page.getByTestId('banner-text').element()).textContent ?? '';
		expect(txt).toMatch(/2025-06/);
		expect(txt).toMatch(/FIS/);
		expect(txt).toMatch(/dl-de\/zero/);
		expect(txt).not.toMatch(/Stand:/);
		expect(txt).not.toMatch(/Quelle:/);
	});

	it('Schriftgröße 10px (text-[10px])', async () => {
		render(DataStandBanner, { hit: baseHit });
		const el = (await page.getByTestId('data-stand-banner').element()) as HTMLElement;
		expect(el.className).toMatch(/text-\[10px\]/);
		expect(el.className).toMatch(/font-mono/);
		expect(el.className).toMatch(/text-ink-subtle/);
	});

	it('Info-Icon mit Source-URL als title', async () => {
		render(DataStandBanner, { hit: baseHit });
		const info = (await page.getByTestId('banner-source-info').element()) as HTMLElement;
		expect(info.getAttribute('title')).toContain('fbinter.stadt-berlin.de');
		expect(info.getAttribute('aria-label')).toContain('fbinter.stadt-berlin.de');
	});

	it('GDI-Quelle wird zu "gdi"', async () => {
		render(DataStandBanner, {
			hit: { ...baseHit, source: 'https://gdi.berlin.de/services/wfs/x' }
		});
		const txt = (await page.getByTestId('banner-text').element()).textContent ?? '';
		expect(txt).toMatch(/gdi/);
	});

	it('ODIS-Quelle wird zu "ODIS"', async () => {
		render(DataStandBanner, {
			hit: { ...baseHit, source: 'https://daten.odis-berlin.de/x.geojson' }
		});
		const txt = (await page.getByTestId('banner-text').element()).textContent ?? '';
		expect(txt).toMatch(/ODIS/);
	});

	it('Outdated-Pille bei >5 Jahre altem Datum', async () => {
		const oldHit: LayerHit = { ...baseHit, updatedAt: '2019-01-01T00:00:00Z' };
		render(DataStandBanner, { hit: oldHit });
		await expect.element(page.getByTestId('banner-outdated')).toBeInTheDocument();
	});

	it('Outdated-Pille hat Tooltip mit genauem Datum', async () => {
		const oldHit: LayerHit = { ...baseHit, updatedAt: '2018-08-20T00:00:00Z' };
		render(DataStandBanner, { hit: oldHit });
		const pille = (await page.getByTestId('banner-outdated').element()) as HTMLElement;
		expect(pille.getAttribute('title')).toBe('Datenstand: 2018-08-20T00:00:00Z');
	});

	it('CC BY 4.0 wird zu "CC BY"', async () => {
		render(DataStandBanner, { hit: { ...baseHit, license: 'CC BY 4.0' } });
		const txt = (await page.getByTestId('banner-text').element()).textContent ?? '';
		expect(txt).toMatch(/CC BY/);
	});

	it('Trenner sind Punkte (·) zwischen Feldern', async () => {
		render(DataStandBanner, { hit: baseHit });
		const txt = (await page.getByTestId('banner-text').element()).textContent ?? '';
		expect(txt).toMatch(/·/);
	});
});
