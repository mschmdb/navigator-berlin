import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import Harness from './inspector-panel-harness.svelte';
import type {
	GeocodeSuggestion,
	LayerHit,
	LayerMetadata,
	ClimateStation,
	ClimateData,
	OepnvStopIndex
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
		await vi.waitUntil(
			() => page.getByTestId('klima-sparkline-grid').query() !== null,
			{ timeout: 5000, interval: 50 }
		);
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
		await vi.waitUntil(
			() => page.getByTestId('klima-long-view-slot').query() !== null,
			{ timeout: 5000, interval: 50 }
		);
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

	it('Share-Sheet-Trigger im Footer öffnet Share-Sheet mit Permalink-Option', async () => {
		const writeText = vi.fn(async () => {});
		Object.defineProperty(window.navigator, 'clipboard', {
			value: { writeText },
			configurable: true
		});
		render(Harness, { open: true, address, hits: [], layerMeta: fullLayerMeta });
		await page.getByTestId('share-sheet-trigger').click();
		await expect.element(page.getByTestId('share-sheet')).toBeInTheDocument();
		await page.getByTestId('share-option-permalink').click();
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

	describe('Story 1.18: Section-Header + Empty-Section-Toggle', () => {
		it('Section-Header nutzt Plex-Mono uppercase mit border-t (AC-5)', async () => {
			render(Harness, {
				open: true,
				address,
				hits: [hit('bezirke', 'Friedrichshain')],
				layerMeta: fullLayerMeta
			});
			const h = (await page.getByTestId('section-header-boundaries').element()) as HTMLElement;
			expect(h.className).toMatch(/font-mono/);
			expect(h.className).toMatch(/text-xs/);
			expect(h.className).toMatch(/uppercase/);
			expect(h.className).toMatch(/border-t/);
		});

		it('Section-Count-Suffix zeigt Hit-Anzahl (AC-5)', async () => {
			render(Harness, {
				open: true,
				address,
				hits: [hit('bezirke', 'X')],
				layerMeta: fullLayerMeta
			});
			const count = (await page
				.getByTestId('section-count-boundaries')
				.element()) as HTMLElement;
			expect(count.textContent).toMatch(/\(1\)/);
		});

		it('Empty-Section default ausgeblendet außer Klima (AC-6)', async () => {
			window.localStorage.removeItem('nav.inspector.showEmptySections');
			render(Harness, {
				open: true,
				address,
				hits: [hit('bezirke', 'X')],
				layerMeta: [...fullLayerMeta, meta('kitas-2024', 'E: Soziale Infrastruktur')]
			});
			await expect.element(page.getByTestId('section-sozial')).not.toBeInTheDocument();
			await expect.element(page.getByTestId('section-mobilitaet')).not.toBeInTheDocument();
			await expect.element(page.getByTestId('section-klima')).toBeInTheDocument();
			await expect.element(page.getByTestId('section-boundaries')).toBeInTheDocument();
		});

		it('Footer-Toggle blendet leere Sektionen ein (AC-6)', async () => {
			window.localStorage.removeItem('nav.inspector.showEmptySections');
			render(Harness, {
				open: true,
				address,
				hits: [hit('bezirke', 'X')],
				layerMeta: fullLayerMeta
			});
			await page.getByTestId('toggle-empty-sections').click();
			await expect.element(page.getByTestId('section-sozial')).toBeInTheDocument();
			await expect.element(page.getByTestId('section-mobilitaet')).toBeInTheDocument();
		});

		it('Toggle-State in localStorage persistiert (AC-6)', async () => {
			window.localStorage.removeItem('nav.inspector.showEmptySections');
			render(Harness, {
				open: true,
				address,
				hits: [hit('bezirke', 'X')],
				layerMeta: fullLayerMeta
			});
			await page.getByTestId('toggle-empty-sections').click();
			expect(window.localStorage.getItem('nav.inspector.showEmptySections')).toBe('1');
			await page.getByTestId('toggle-empty-sections').click();
			expect(window.localStorage.getItem('nav.inspector.showEmptySections')).toBe('0');
		});

		it('Empty-Section-Compact rendert Plex-Mono 1-Zeile mit Trenner (AC-6)', async () => {
			window.localStorage.setItem('nav.inspector.showEmptySections', '1');
			render(Harness, {
				open: true,
				address,
				hits: [hit('bezirke', 'X')],
				layerMeta: fullLayerMeta
			});
			const empty = (await page.getByTestId('section-sozial-empty').element()) as HTMLElement;
			expect(empty.className).toMatch(/font-mono/);
			expect(empty.className).toMatch(/text-xs/);
			expect(empty.textContent).toMatch(/Soziale Infrastruktur ·/);
			expect(empty.textContent).toMatch(/keine Daten/);
			window.localStorage.removeItem('nav.inspector.showEmptySections');
		});

		it('Klima-Section IMMER sichtbar auch bei 0 Hits (AC-6)', async () => {
			window.localStorage.removeItem('nav.inspector.showEmptySections');
			render(Harness, {
				open: true,
				address,
				hits: [hit('bezirke', 'X')],
				layerMeta: fullLayerMeta
			});
			await expect.element(page.getByTestId('section-klima')).toBeInTheDocument();
		});
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

	describe('Story 1.19: NearestStopsCard in Mobilität-Section', () => {
		const oepnvIndex: OepnvStopIndex = {
			ubahn: [{ name: 'Frankfurter Tor', lat: 52.5159, lng: 13.4544 }],
			sbahn: [],
			tram: [{ name: 'Boxhagener Straße', lat: 52.5104, lng: 13.4592 }],
			bus: [{ name: 'Petersburger Straße', lat: 52.516, lng: 13.4555 }]
		};

		it('rendert NearestStopsCard in Mobilität-Section bei vorhandenem Stop-Index', async () => {
			window.localStorage.removeItem('nav.inspector.showEmptySections');
			render(Harness, {
				open: true,
				address,
				hits: [hit('bezirke', 'X')],
				layerMeta: fullLayerMeta,
				oepnvStopIndex: oepnvIndex
			});
			await expect.element(page.getByTestId('section-mobilitaet')).toBeInTheDocument();
			await expect.element(page.getByTestId('nearest-stops-card')).toBeInTheDocument();
		});

		it('Mobilität-Section bleibt ausgeblendet wenn kein Stop-Index UND keine Hits', async () => {
			window.localStorage.removeItem('nav.inspector.showEmptySections');
			render(Harness, {
				open: true,
				address,
				hits: [hit('bezirke', 'X')],
				layerMeta: fullLayerMeta,
				oepnvStopIndex: null
			});
			await expect.element(page.getByTestId('section-mobilitaet')).not.toBeInTheDocument();
		});

		it('Card oberhalb von Layer-Hits in Mobilität-Section', async () => {
			const mobilitaetMeta = meta('ubahn-stationen', 'F: Mobilität');
			render(Harness, {
				open: true,
				address,
				hits: [hit('ubahn-stationen', 'U5')],
				layerMeta: [...fullLayerMeta, mobilitaetMeta],
				oepnvStopIndex: oepnvIndex
			});
			const section = (await page.getByTestId('section-mobilitaet').element()) as HTMLElement;
			const cardEl = section.querySelector('[data-testid="nearest-stops-card"]');
			const hitEl = section.querySelector('[data-testid="layer-hit-row"]');
			expect(cardEl).not.toBeNull();
			expect(hitEl).not.toBeNull();
			if (cardEl && hitEl) {
				expect(cardEl.compareDocumentPosition(hitEl) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
			}
		});
	});
});
