import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import Harness from './compare-panel-harness.svelte';
import type { GeocodeSuggestion, LayerHit, LayerMetadata } from '$lib/data';

const addressA: GeocodeSuggestion = {
	id: 'a',
	displayName: 'Karl-Marx-Allee 1, Berlin',
	lat: 52.519,
	lng: 13.422,
	type: 'address',
	addresstype: 'building'
};

const addressB: GeocodeSuggestion = {
	id: 'b',
	displayName: 'Sonnenallee 100, Berlin',
	lat: 52.49,
	lng: 13.45,
	type: 'address',
	addresstype: 'building'
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

function hit(slug: string, value: unknown): LayerHit {
	return {
		layer: slug,
		value,
		source: 'https://daten.odis-berlin.de',
		updatedAt: '2025-06-01T00:00:00Z',
		license: 'dl-de/zero-2-0'
	};
}

const fullLayerMeta = [
	meta('bezirke', 'A: Boundaries'),
	meta('mietspiegel-wohnlage', 'B: Wohn-Daten'),
	meta('bodenrichtwerte', 'B: Wohn-Daten'),
	meta('laerm-den', 'C: Umwelt'),
	meta('stolpersteine', 'D: Memorial')
];

describe('compare-panel.svelte', () => {
	it('rendert nicht wenn compareMode=false', async () => {
		render(Harness, { compareMode: false, selectedAddress: addressA });
		await expect.element(page.getByTestId('compare-panel')).not.toBeInTheDocument();
	});

	it('rendert nicht ohne selectedAddress', async () => {
		render(Harness, { compareMode: true, selectedAddress: null });
		await expect.element(page.getByTestId('compare-panel')).not.toBeInTheDocument();
	});

	it('rendert Adress-A im Header', async () => {
		render(Harness, { compareMode: true, selectedAddress: addressA });
		const a = (await page.getByTestId('compare-address-a').element()) as HTMLElement;
		expect(a.textContent).toMatch(/Karl-Marx-Allee 1/);
	});

	it('zeigt B-Picker wenn keine comparisonAddress', async () => {
		render(Harness, { compareMode: true, selectedAddress: addressA });
		await expect.element(page.getByTestId('compare-b-picker')).toBeInTheDocument();
		await expect.element(page.getByTestId('compare-address-b')).toBeInTheDocument();
	});

	it('Bookmark-Picker-Button öffnet onOpenBookmarkPicker-Callback', async () => {
		const onOpen = vi.fn();
		render(Harness, {
			compareMode: true,
			selectedAddress: addressA,
			onOpenBookmarkPicker: onOpen
		});
		await page.getByTestId('compare-pick-bookmarks').click();
		expect(onOpen).toHaveBeenCalledTimes(1);
	});

	it('zeigt Loading-Skeleton wenn comparisonLoading=true', async () => {
		render(Harness, {
			compareMode: true,
			selectedAddress: addressA,
			comparisonAddress: addressB,
			comparisonLoading: true
		});
		await expect.element(page.getByTestId('compare-loading')).toBeInTheDocument();
		await expect.element(page.getByTestId('compare-table')).not.toBeInTheDocument();
	});

	it('zeigt Tabelle mit Caption + thead + Sections nach Loading', async () => {
		render(Harness, {
			compareMode: true,
			selectedAddress: addressA,
			comparisonAddress: addressB,
			selectedLayerHits: [hit('bezirke', 'Mitte'), hit('laerm-den', 55)],
			comparisonLayerHits: [hit('bezirke', 'Neukölln'), hit('laerm-den', 70)],
			layerMeta: fullLayerMeta
		});
		const table = (await page.getByTestId('compare-table').element()) as HTMLTableElement;
		const caption = table.querySelector('caption');
		expect(caption?.textContent).toMatch(/Vergleich:/);
		expect(caption?.textContent).toMatch(/Karl-Marx-Allee 1/);
		expect(caption?.textContent).toMatch(/Sonnenallee/);
		expect(table.querySelectorAll('thead th')).toHaveLength(3);
	});

	it('rendert Stolpersteine-Disclaimer wenn Memorial-Section vorhanden', async () => {
		render(Harness, {
			compareMode: true,
			selectedAddress: addressA,
			comparisonAddress: addressB,
			selectedLayerHits: [hit('stolpersteine', 3)],
			comparisonLayerHits: [hit('stolpersteine', 8)],
			layerMeta: fullLayerMeta
		});
		await expect
			.element(page.getByTestId('compare-disclaimer-compare-stolperstein'))
			.toBeInTheDocument();
	});

	it('rendert Mietspiegel-Disclaimer + Bodenrichtwerte-Disclaimer in Wohn-Section', async () => {
		render(Harness, {
			compareMode: true,
			selectedAddress: addressA,
			comparisonAddress: addressB,
			selectedLayerHits: [
				hit('mietspiegel-wohnlage', { wol_mode: 'gut' }),
				hit('bodenrichtwerte', { richtwert: 5500 })
			],
			comparisonLayerHits: [
				hit('mietspiegel-wohnlage', { wol_mode: 'mittel' }),
				hit('bodenrichtwerte', { richtwert: 8000 })
			],
			layerMeta: fullLayerMeta
		});
		await expect
			.element(page.getByTestId('compare-disclaimer-compare-mietspiegel'))
			.toBeInTheDocument();
		await expect
			.element(page.getByTestId('compare-disclaimer-compare-bodenrichtwerte'))
			.toBeInTheDocument();
	});

	it('Footer rendert compare-stigma-disclaimer', async () => {
		render(Harness, {
			compareMode: true,
			selectedAddress: addressA,
			comparisonAddress: addressB,
			selectedLayerHits: [hit('bezirke', 'Mitte')],
			comparisonLayerHits: [hit('bezirke', 'Pankow')],
			layerMeta: fullLayerMeta
		});
		const footer = (await page.getByTestId('compare-footer').element()) as HTMLElement;
		expect(footer.textContent).toMatch(/statistische Mittel|Aggregierte Daten/);
	});

	it('Mobile-Tab-Switcher mit role=tablist + aria-selected', async () => {
		render(Harness, {
			compareMode: true,
			selectedAddress: addressA,
			comparisonAddress: addressB,
			selectedLayerHits: [hit('bezirke', 'Mitte')],
			comparisonLayerHits: [hit('bezirke', 'Pankow')],
			layerMeta: fullLayerMeta
		});
		const tablist = (await page.getByTestId('compare-mobile-tabs').element()) as HTMLElement;
		expect(tablist.getAttribute('role')).toBe('tablist');
		const tabA = (await page.getByTestId('compare-tab-a').element()) as HTMLElement;
		expect(tabA.getAttribute('aria-selected')).toBe('true');
		await page.getByTestId('compare-tab-b').click();
		const tabB = (await page.getByTestId('compare-tab-b').element()) as HTMLElement;
		expect(tabB.getAttribute('aria-selected')).toBe('true');
	});

	it('Exit-Button verlässt Compare-Modus', async () => {
		render(Harness, {
			compareMode: true,
			selectedAddress: addressA,
			comparisonAddress: addressB,
			selectedLayerHits: [hit('bezirke', 'Mitte')],
			comparisonLayerHits: [hit('bezirke', 'Pankow')],
			layerMeta: fullLayerMeta
		});
		await page.getByTestId('compare-exit').click();
		await expect.element(page.getByTestId('compare-panel')).not.toBeInTheDocument();
	});

	it('zeigt Empty-Message wenn keine vergleichbaren Layer-Daten', async () => {
		render(Harness, {
			compareMode: true,
			selectedAddress: addressA,
			comparisonAddress: addressB,
			selectedLayerHits: [],
			comparisonLayerHits: [],
			layerMeta: fullLayerMeta
		});
		await expect.element(page.getByTestId('compare-empty')).toBeInTheDocument();
	});
});
