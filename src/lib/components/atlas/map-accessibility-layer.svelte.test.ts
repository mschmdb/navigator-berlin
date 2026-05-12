import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import MapAccessibilityLayer from './map-accessibility-layer.svelte';
import type { LayerMetadata } from '$lib/data/types.js';

const bezirkeLayer: LayerMetadata = {
	slug: 'bezirke',
	filename: 'bezirke.geojson',
	sourceUrl: 'https://example/bezirke',
	fetchedAt: '2026-04-01T00:00:00Z',
	license: 'dl-de/by-2-0',
	sha256: 'x',
	bundleGroup: 'A: Boundaries',
	zoomThresholds: { min: 9, max: 19 },
	geometryType: 'MultiPolygon',
	featureCount: 12
};

const laermLayer: LayerMetadata = {
	slug: 'laerm-den',
	filename: 'laerm.geojson',
	sourceUrl: 'https://example/laerm',
	fetchedAt: '2022-06-01T00:00:00Z',
	license: 'dl-de/by-2-0',
	sha256: 'y',
	bundleGroup: 'C: Umwelt',
	zoomThresholds: { min: 12, max: 19 },
	geometryType: 'Polygon',
	featureCount: 100
};

type Handler = () => void;

function createFakeMap(features: unknown[]) {
	const listeners = new Map<string, Set<Handler>>();
	const query = vi.fn(() => features);
	return {
		listeners,
		query,
		fire(evt: string) {
			listeners.get(evt)?.forEach((h) => h());
		},
		queryRenderedFeatures: query,
		on(evt: string, h: Handler) {
			if (!listeners.has(evt)) listeners.set(evt, new Set());
			listeners.get(evt)!.add(h);
			return this;
		},
		off(evt: string, h: Handler) {
			listeners.get(evt)?.delete(h);
			return this;
		}
	};
}

describe('MapAccessibilityLayer', () => {
	it('rendert nichts wenn map = null', async () => {
		render(MapAccessibilityLayer, { props: { map: null, layers: [bezirkeLayer] } });
		const list = page.getByTestId('map-a11y-feature-list');
		await expect.element(list).not.toBeInTheDocument();
		const empty = page.getByText(/Keine sichtbaren Features/);
		await expect.element(empty).toBeInTheDocument();
	});

	it('rendert Heading mit ARIA-Beschreibung', async () => {
		const map = createFakeMap([]);
		render(MapAccessibilityLayer, { props: { map, layers: [bezirkeLayer] } });
		const heading = page.getByText('Sichtbare Orte und Grenzen auf der Karte');
		await expect.element(heading).toBeInTheDocument();
	});

	it('rendert <ul role="list"> mit <button>-Einträgen pro Feature', async () => {
		const map = createFakeMap([
			{
				id: 'f1',
				layer: { id: 'bezirke' },
				geometry: {
					type: 'MultiPolygon',
					coordinates: [[[[13.4, 52.5], [13.5, 52.5], [13.5, 52.6], [13.4, 52.5]]]]
				},
				properties: { name: 'Mitte', einwohner: 380000 }
			},
			{
				id: 'f2',
				layer: { id: 'laerm-den' },
				geometry: {
					type: 'Polygon',
					coordinates: [[[13.41, 52.51], [13.42, 52.51], [13.42, 52.52], [13.41, 52.51]]]
				},
				properties: { value: 65 }
			}
		]);
		render(MapAccessibilityLayer, {
			props: { map, layers: [bezirkeLayer, laermLayer] }
		});
		const list = page.getByTestId('map-a11y-feature-list');
		await expect.element(list).toBeInTheDocument();
		const ul = (await list.element()) as HTMLUListElement;
		expect(ul.getAttribute('role')).toBe('list');
		expect(ul.getAttribute('aria-labelledby')).toBe('map-a11y-layer-heading');
		const buttons = page.getByTestId('map-a11y-feature-button');
		await expect.element(buttons.first()).toBeInTheDocument();
		const all = (await Promise.all([
			(await buttons.nth(0).element()) as HTMLButtonElement,
			(await buttons.nth(1).element()) as HTMLButtonElement
		]));
		expect(all[0].textContent).toMatch(/Mitte/);
		expect(all[1].textContent).toMatch(/Lärmkarte/);
	});

	it('Klick auf Button ruft onSelectFeature mit AccessibleFeature', async () => {
		const map = createFakeMap([
			{
				id: 'bezirk-mitte',
				layer: { id: 'bezirke' },
				geometry: {
					type: 'MultiPolygon',
					coordinates: [[[[13.4, 52.5], [13.5, 52.5], [13.5, 52.6], [13.4, 52.5]]]]
				},
				properties: { name: 'Mitte', einwohner: 380000 }
			}
		]);
		const onSelect = vi.fn();
		render(MapAccessibilityLayer, {
			props: { map, layers: [bezirkeLayer], onSelectFeature: onSelect }
		});
		const btn = page.getByTestId('map-a11y-feature-button');
		await btn.click();
		expect(onSelect).toHaveBeenCalledTimes(1);
		const arg = onSelect.mock.calls[0]![0] as { layerSlug: string; description: string };
		expect(arg.layerSlug).toBe('bezirke');
		expect(arg.description).toMatch(/Mitte/);
	});

	it('aria-current="true" für selectedFeatureId-Match', async () => {
		const map = createFakeMap([
			{
				id: 'bezirk-mitte',
				layer: { id: 'bezirke' },
				geometry: {
					type: 'MultiPolygon',
					coordinates: [[[[13.4, 52.5]]]]
				},
				properties: { name: 'Mitte' }
			}
		]);
		render(MapAccessibilityLayer, {
			props: {
				map,
				layers: [bezirkeLayer],
				selectedFeatureId: 'bezirke:bezirk-mitte'
			}
		});
		const btn = (await page
			.getByTestId('map-a11y-feature-button')
			.element()) as HTMLButtonElement;
		expect(btn.getAttribute('aria-current')).toBe('true');
	});

	it('Re-Query bei moveend-Event', async () => {
		const map = createFakeMap([]);
		render(MapAccessibilityLayer, { props: { map, layers: [bezirkeLayer] } });
		const initialCalls = map.query.mock.calls.length;
		map.fire('moveend');
		expect(map.query.mock.calls.length).toBeGreaterThan(initialCalls);
	});

	it('Default sr-only (versteckt)', async () => {
		const map = createFakeMap([]);
		const { container } = render(MapAccessibilityLayer, {
			props: { map, layers: [bezirkeLayer] }
		});
		const root = container.firstElementChild as HTMLElement;
		expect(root.className).toMatch(/sr-only/);
		expect(root.className).toMatch(/focus-within:not-sr-only/);
	});

	it('Limit maxItems begrenzt Liste, zeigt Overflow-Count', async () => {
		const features = Array.from({ length: 8 }, (_, i) => ({
			id: `f-${i}`,
			layer: { id: 'bezirke' },
			geometry: { type: 'MultiPolygon', coordinates: [[[[13.4, 52.5]]]] },
			properties: { name: `Bezirk ${i}` }
		}));
		const map = createFakeMap(features);
		render(MapAccessibilityLayer, {
			props: { map, layers: [bezirkeLayer], maxItems: 3 }
		});
		const buttons = page.getByTestId('map-a11y-feature-button');
		await expect.element(buttons.first()).toBeInTheDocument();
		const list = (await page.getByTestId('map-a11y-feature-list').element()) as HTMLElement;
		expect(list.querySelectorAll('button').length).toBe(3);
		const overflowMsg = page.getByText(/und 5 weitere/);
		await expect.element(overflowMsg).toBeInTheDocument();
	});

	it('Dedupes Features mit identischer synthetischer ID', async () => {
		const features = [
			{
				id: 'f1',
				layer: { id: 'bezirke' },
				geometry: { type: 'MultiPolygon', coordinates: [[[[13.4, 52.5]]]] },
				properties: { name: 'Mitte' }
			},
			{
				id: 'f1',
				layer: { id: 'bezirke' },
				geometry: { type: 'MultiPolygon', coordinates: [[[[13.4, 52.5]]]] },
				properties: { name: 'Mitte' }
			}
		];
		const map = createFakeMap(features);
		render(MapAccessibilityLayer, { props: { map, layers: [bezirkeLayer] } });
		await expect.element(page.getByTestId('map-a11y-feature-button').first()).toBeInTheDocument();
		const list = (await page.getByTestId('map-a11y-feature-list').element()) as HTMLElement;
		expect(list.querySelectorAll('button').length).toBe(1);
	});

	it('Unbekannte layer.id wird übersprungen', async () => {
		const features = [
			{
				id: 'f1',
				layer: { id: 'unknown' },
				geometry: { type: 'Point', coordinates: [13.4, 52.5] },
				properties: {}
			}
		];
		const map = createFakeMap(features);
		render(MapAccessibilityLayer, { props: { map, layers: [bezirkeLayer] } });
		const empty = page.getByText(/Keine sichtbaren Features/);
		await expect.element(empty).toBeInTheDocument();
	});
});
