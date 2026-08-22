import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import KiezFinderPanel from './kiez-finder-panel.svelte';
import type { FinderBaseData } from './internal/kiez-finder-data.js';

function baseData(): FinderBaseData {
	return {
		plrFc: {
			type: 'FeatureCollection',
			features: [
				{
					type: 'Feature',
					properties: { PLR_ID: '01100101', PLR_NAME: 'Stülerstraße' },
					geometry: {
						type: 'Polygon',
						coordinates: [
							[
								[13.3, 52.5],
								[13.31, 52.5],
								[13.31, 52.51],
								[13.3, 52.51],
								[13.3, 52.5]
							]
						]
					}
				},
				{
					type: 'Feature',
					properties: { PLR_ID: '01100102', PLR_NAME: 'Großer Tiergarten' },
					geometry: {
						type: 'Polygon',
						coordinates: [
							[
								[13.32, 52.5],
								[13.33, 52.5],
								[13.33, 52.51],
								[13.32, 52.51],
								[13.32, 52.5]
							]
						]
					}
				}
			]
		},
		plrIds: ['01100101', '01100102'],
		metrics: {
			m_ruhe_luft: new Map([
				['01100101', 0.9],
				['01100102', 0.2]
			])
		}
	};
}

function fakeMap() {
	const layers = new Set<string>();
	const sources = new Set<string>();
	const paints: Record<string, unknown> = {};
	return {
		calls: { paints },
		api: {
			getSource: (id: string) => (sources.has(id) ? {} : undefined),
			addSource: (id: string) => sources.add(id),
			removeSource: (id: string) => sources.delete(id),
			getLayer: (id: string) => (layers.has(id) ? {} : undefined),
			addLayer: (spec: Record<string, unknown>) => layers.add(String(spec.id)),
			removeLayer: (id: string) => layers.delete(id),
			moveLayer: () => {},
			setPaintProperty: (id: string, prop: string, value: unknown) => {
				paints[`${id}:${prop}`] = value;
			}
		}
	};
}

async function renderPanel(overrides: Record<string, unknown> = {}) {
	const map = fakeMap();
	const onClose = vi.fn();
	const result = render(KiezFinderPanel, {
		map: map.api,
		loadData: async () => baseData(),
		onClose,
		...overrides
	});
	await vi.waitFor(async () => {
		await expect.element(page.getByTestId('finder-panel')).toBeInTheDocument();
	});
	return { map, onClose, result };
}

describe('kiez-finder-panel', () => {
	it('rendert als gedockte Section mit Überschrift und beschrifteten Slidern', async () => {
		await renderPanel();
		const panel = (await page.getByTestId('finder-panel').element()) as HTMLElement;
		// Gedockt im Inspector-Slot: kein Dialog, kein Drag-Handle mehr.
		expect(panel.getAttribute('role')).toBeNull();
		expect(panel.querySelector('[data-testid="finder-drag-handle"]')).toBeNull();
		expect(panel.querySelector('h2')?.textContent).toContain('Kiez-Finder');
		const sliders = panel.querySelectorAll('input[type="range"]');
		expect(sliders.length).toBeGreaterThanOrEqual(9);
		for (const slider of sliders) {
			expect((slider as HTMLElement).getAttribute('aria-label')).toBeTruthy();
		}
	});

	it('färbt die Karte live beim Slider-Move und zeigt Top-Ergebnisse', async () => {
		const { map } = await renderPanel();
		const slider = (await page.getByTestId('finder-slider-ruheLuft').element()) as HTMLInputElement;
		slider.value = '2';
		slider.dispatchEvent(new Event('input', { bubbles: true }));
		await vi.waitFor(async () => {
			await expect.element(page.getByTestId('finder-top-list')).toBeInTheDocument();
		});
		const list = (await page.getByTestId('finder-top-list').element()) as HTMLElement;
		expect(list.textContent).toContain('Stülerstraße');
		// Zweiter Move: der Layer existiert, jetzt MUSS der schnelle
		// setPaintProperty-Pfad greifen (Live-Mechanik der Spec).
		slider.value = '1';
		slider.dispatchEvent(new Event('input', { bubbles: true }));
		await vi.waitFor(() => {
			expect(Object.keys(map.calls.paints).some((k) => k.includes('fill-color'))).toBe(true);
		});
	});

	it('Reset stellt neutral und entfernt die Top-Liste', async () => {
		await renderPanel();
		const slider = (await page.getByTestId('finder-slider-ruheLuft').element()) as HTMLInputElement;
		slider.value = '2';
		slider.dispatchEvent(new Event('input', { bubbles: true }));
		const reset = (await page.getByTestId('finder-reset').element()) as HTMLButtonElement;
		reset.click();
		await vi.waitFor(async () => {
			await expect.element(page.getByTestId('finder-top-list')).not.toBeInTheDocument();
		});
		expect(slider.value).toBe('0');
	});

	it('Schließen-Button ruft onClose', async () => {
		const { onClose } = await renderPanel();
		const close = (await page.getByTestId('finder-close').element()) as HTMLButtonElement;
		close.click();
		expect(onClose).toHaveBeenCalled();
	});

	it('Unmount crasht nicht, wenn die Map schon zerstört ist', async () => {
		const { map, result } = await renderPanel();
		const slider = (await page.getByTestId('finder-slider-ruheLuft').element()) as HTMLInputElement;
		slider.value = '2';
		slider.dispatchEvent(new Event('input', { bubbles: true }));
		await vi.waitFor(async () => {
			await expect.element(page.getByTestId('finder-top-list')).toBeInTheDocument();
		});
		// Seiten-Wechsel: MapLibre ist bereits removed, jeder Zugriff wirft.
		let aufgerufen = false;
		map.api.getLayer = () => {
			aufgerufen = true;
			throw new TypeError("Cannot read properties of undefined (reading 'getLayer')");
		};
		await result.unmount();
		expect(aufgerufen).toBe(true);
	});

	it('trägt die redaktionelle Fußnote und die Quelle', async () => {
		await renderPanel();
		const panel = (await page.getByTestId('finder-panel').element()) as HTMLElement;
		expect(panel.textContent).toContain('keine Bewertung von Nachbarschaften');
		expect(panel.textContent).toContain('offenen Daten');
	});
});
