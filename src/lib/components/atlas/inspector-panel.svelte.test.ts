import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import Harness from './inspector-panel-harness.svelte';
import type {
	GeocodeSuggestion,
	LayerHit,
	LayerMetadata,
	ClimateStation,
	ClimateData
} from '$lib/data';

const address: GeocodeSuggestion = {
	id: 'way-1',
	displayName: 'Boxhagener Straße 12, 10245 Berlin',
	lat: 52.5111,
	lng: 13.4544,
	type: 'house',
	addresstype: 'house',
	bezirk: 'Friedrichshain-Kreuzberg',
	postcode: '10245'
};

function meta(slug: string, bundle: LayerMetadata['bundleGroup']): LayerMetadata {
	return {
		slug,
		filename: `${slug}.geojson`,
		sourceUrl: 'https://daten.odis-berlin.de',
		fetchedAt: '2025-06-01T00:00:00Z',
		license: 'dl-de/zero-2-0',
		sha256: 'x',
		bundleGroup: bundle,
		zoomThresholds: { min: 9, max: 18 },
		geometryType: 'Polygon',
		featureCount: 1
	};
}

function hit(slug: string, value: unknown = 'x', extra: Partial<LayerHit> = {}): LayerHit {
	return {
		layer: slug,
		value,
		source: 'https://daten.odis-berlin.de',
		updatedAt: '2025-06-01T00:00:00Z',
		license: 'dl-de/zero-2-0',
		...extra
	};
}

const fullLayerMeta = [
	meta('bezirke', 'A: Boundaries'),
	meta('mietspiegel-wohnlage', 'B: Wohn-Daten'),
	meta('laerm-den', 'C: Umwelt'),
	meta('stolpersteine', 'D: Memorial')
];

describe('inspector-panel.svelte', () => {
	it('rendert nicht wenn inspectorOpen=false', async () => {
		render(Harness, { open: false, address, hits: [] });
		await expect.element(page.getByTestId('inspector-panel')).not.toBeInTheDocument();
	});

	it('rendert nicht wenn keine Adresse selektiert', async () => {
		render(Harness, { open: true, address: null, hits: [] });
		await expect.element(page.getByTestId('inspector-panel')).not.toBeInTheDocument();
	});

	it('zeigt Adresse im Header', async () => {
		render(Harness, { open: true, address, hits: [], layerMeta: fullLayerMeta });
		const h = (await page.getByTestId('inspector-address').element()) as HTMLElement;
		expect(h.textContent?.trim()).toBe(address.displayName);
	});

	it('rendert alle 5 Sektionen in fester Reihenfolge', async () => {
		render(Harness, {
			open: true,
			address,
			hits: [
				hit('bezirke', 'Friedrichshain-Kreuzberg'),
				hit('mietspiegel-wohnlage', 'gut'),
				hit('laerm-den', 65),
				hit('stolpersteine', { person: 'Anna Müller' })
			],
			layerMeta: fullLayerMeta
		});
		await expect.element(page.getByTestId('section-boundaries')).toBeInTheDocument();
		await expect.element(page.getByTestId('section-wohn')).toBeInTheDocument();
		await expect.element(page.getByTestId('section-umwelt')).toBeInTheDocument();
		await expect.element(page.getByTestId('section-memorial')).toBeInTheDocument();
		await expect.element(page.getByTestId('section-klima')).toBeInTheDocument();
	});

	it('Klima-Sektion zeigt Lade-Hinweis wenn keine Station/Series', async () => {
		render(Harness, { open: true, address, hits: [], layerMeta: fullLayerMeta });
		const placeholder = (await page.getByTestId('section-klima-empty').element()) as HTMLElement;
		expect(placeholder.textContent).toMatch(/Klima-Daten/);
	});

	it('Klima-Sektion rendert Stations-Hinweis und 3 Sparklines bei valider Series', async () => {
		const station: ClimateStation = {
			id: '00433',
			name: 'Berlin-Tempelhof',
			coordinates: [13.4019, 52.4675],
			firstYear: 1919
		};
		const series: ClimateData = {
			stationId: '00433',
			name: 'Berlin-Tempelhof',
			coordinates: [13.4019, 52.4675],
			elevation: 48,
			firstYear: 1919,
			summerDays: [
				{ year: 1950, count: 10 },
				{ year: 2024, count: 22 }
			],
			frostDays: [
				{ year: 1950, count: 80 },
				{ year: 2024, count: 35 }
			],
			hotDays: [
				{ year: 1950, count: 2 },
				{ year: 2024, count: 8 }
			]
		};
		render(Harness, {
			open: true,
			address,
			hits: [],
			layerMeta: fullLayerMeta,
			nearestStation: station,
			climateSeries: series
		});
		const hint = (await page.getByTestId('klima-station-hint').element()) as HTMLElement;
		expect(hint.textContent).toContain('Berlin-Tempelhof');
		expect(hint.textContent).toContain('1919');
		const grid = (await page.getByTestId('klima-sparkline-grid').element()) as HTMLElement;
		const sparklines = grid.querySelectorAll('[data-testid="climate-sparkline"]');
		expect(sparklines.length).toBe(3);
		await expect.element(page.getByTestId('klima-long-view-slot')).not.toBeInTheDocument();
	});

	it('Klima-Sektion zeigt LongView NUR bei Station Dahlem (00403)', async () => {
		const station: ClimateStation = {
			id: '00403',
			name: 'Berlin-Dahlem',
			coordinates: [13.301, 52.4517],
			firstYear: 1719
		};
		const series: ClimateData = {
			stationId: '00403',
			name: 'Berlin-Dahlem',
			coordinates: [13.301, 52.4517],
			elevation: 51,
			firstYear: 1719,
			summerDays: [{ year: 2024, count: 22 }],
			frostDays: [{ year: 2024, count: 35 }],
			hotDays: [{ year: 2024, count: 8 }],
			annualMeanTemp: Array.from({ length: 200 }, (_, i) => ({
				year: 1820 + i,
				temp: 8 + i * 0.01
			}))
		};
		render(Harness, {
			open: true,
			address,
			hits: [],
			layerMeta: fullLayerMeta,
			nearestStation: station,
			climateSeries: series
		});
		await expect.element(page.getByTestId('klima-long-view-slot')).toBeInTheDocument();
	});

	it('aria-live="polite" + aria-label gesetzt', async () => {
		render(Harness, { open: true, address, hits: [], layerMeta: fullLayerMeta });
		const panel = (await page.getByTestId('inspector-panel').element()) as HTMLElement;
		expect(panel.getAttribute('aria-live')).toBe('polite');
		expect(panel.getAttribute('aria-label')).toContain(address.displayName);
	});

	it('Close-Button schließt Panel (inspectorOpen=false)', async () => {
		render(Harness, { open: true, address, hits: [], layerMeta: fullLayerMeta });
		await page.getByTestId('inspector-close').click();
		await expect.element(page.getByTestId('inspector-panel')).not.toBeInTheDocument();
	});

	it('Permalink-Button im Footer ruft clipboard.writeText', async () => {
		const writeText = vi.fn(async () => {});
		Object.defineProperty(window.navigator, 'clipboard', {
			value: { writeText },
			configurable: true
		});
		render(Harness, { open: true, address, hits: [], layerMeta: fullLayerMeta });
		await page.getByTestId('permalink-button').click();
		expect(writeText).toHaveBeenCalledTimes(1);
	});

	it('LayerHitRow erhält no-coverage-State weiter', async () => {
		render(Harness, {
			open: true,
			address,
			hits: [hit('bezirke', null, { reason: 'no-coverage' })],
			layerMeta: fullLayerMeta
		});
		const row = (await page.getByTestId('layer-hit-row').element()) as HTMLElement;
		expect(row.getAttribute('data-state')).toBe('no-coverage');
	});

	it('Mount-Id stabil bei Re-Selection (kein Re-Mount)', async () => {
		const harness = render(Harness, {
			open: true,
			address,
			hits: [hit('bezirke', 'Mitte')],
			layerMeta: fullLayerMeta
		});
		const before = ((await page.getByTestId('inspector-panel').element()) as HTMLElement).getAttribute(
			'data-mount-id'
		);
		harness.rerender({
			open: true,
			address: { ...address, displayName: 'Andere Straße 5, 10243 Berlin' },
			hits: [hit('bezirke', 'Friedrichshain'), hit('mietspiegel-wohnlage', 'mittel')],
			layerMeta: fullLayerMeta
		});
		const after = ((await page.getByTestId('inspector-panel').element()) as HTMLElement).getAttribute(
			'data-mount-id'
		);
		expect(after).toBe(before);
		const newHeader = (await page.getByTestId('inspector-address').element()) as HTMLElement;
		expect(newHeader.textContent).toMatch(/Andere Straße 5/);
	});
});
