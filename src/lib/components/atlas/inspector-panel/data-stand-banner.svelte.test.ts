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

describe('data-stand-banner.svelte', () => {
	it('rendert Stand, Quelle, Lizenz im Format', async () => {
		render(DataStandBanner, { hit: baseHit });
		const txt = (await page.getByTestId('banner-text').element()).textContent ?? '';
		expect(txt).toMatch(/Stand: 2025-06/);
		expect(txt).toMatch(/Quelle: FIS-Broker/);
		expect(txt).toMatch(/dl-de\/zero/);
	});

	it('zeigt keine Outdated-Pille bei aktuellem Datum', async () => {
		render(DataStandBanner, { hit: baseHit });
		await expect.element(page.getByTestId('banner-outdated')).not.toBeInTheDocument();
	});

	it('zeigt Outdated-Pille bei >5 Jahre altem Datum', async () => {
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

	it('ODIS-Quelle wird zu "ODIS Berlin"', async () => {
		render(DataStandBanner, {
			hit: { ...baseHit, source: 'https://daten.odis-berlin.de/x.geojson' }
		});
		const txt = (await page.getByTestId('banner-text').element()).textContent ?? '';
		expect(txt).toMatch(/Quelle: ODIS Berlin/);
	});

	it('DWD-Quelle wird zu "DWD"', async () => {
		render(DataStandBanner, {
			hit: { ...baseHit, source: 'https://opendata.dwd.de/cdc' }
		});
		const txt = (await page.getByTestId('banner-text').element()).textContent ?? '';
		expect(txt).toMatch(/Quelle: DWD/);
	});

	it('Overpass-Quelle wird zu "OpenStreetMap"', async () => {
		render(DataStandBanner, {
			hit: { ...baseHit, source: 'https://overpass-api.de/api' }
		});
		const txt = (await page.getByTestId('banner-text').element()).textContent ?? '';
		expect(txt).toMatch(/Quelle: OpenStreetMap/);
	});

	it('License CC BY 4.0 wird zu "CC BY"', async () => {
		render(DataStandBanner, { hit: { ...baseHit, license: 'CC BY 4.0' } });
		const txt = (await page.getByTestId('banner-text').element()).textContent ?? '';
		expect(txt).toMatch(/CC BY$/);
	});

	it('License ODbL 1.0 wird zu "ODbL"', async () => {
		render(DataStandBanner, { hit: { ...baseHit, license: 'ODbL 1.0' } });
		const txt = (await page.getByTestId('banner-text').element()).textContent ?? '';
		expect(txt).toMatch(/ODbL$/);
	});

	it('Font-Mono + ink-subtle Klassen', async () => {
		render(DataStandBanner, { hit: baseHit });
		const el = (await page.getByTestId('data-stand-banner').element()) as HTMLElement;
		expect(el.className).toMatch(/font-mono/);
		expect(el.className).toMatch(/text-ink-subtle/);
		expect(el.className).toMatch(/text-xs/);
	});
});
