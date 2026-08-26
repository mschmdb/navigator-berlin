import { page } from 'vitest/browser';
import { __setEmbeddedForTests } from '$lib/utils/plausible.js';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import KiezFinderPanel from './kiez-finder-panel.svelte';
import type { FinderBaseData } from './internal/kiez-finder-data.js';
import { FINDER_PARTIES } from '$lib/webmcp/internal/finder-schemas.js';
import { PARTEI_FARBEN } from '$lib/data/partei-farben.js';
import {
	requestAgentWeights,
	readFinderBridge,
	resetFinderBridgeForTests
} from '$lib/state/finder-bridge.svelte.js';

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
			// Passung steuert auch die Deckkraft: schwache Treffer verblassen.
			expect(Object.keys(map.calls.paints).some((k) => k.includes('fill-opacity'))).toBe(true);
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

	it('lädt die Partei-Anteile schon beim Slider-Move, nicht erst beim Chip-Klick', async () => {
		const loadShares = vi.fn(async () => [
			{ bzrId: '011001', partei: 'SPD', anteil: 0.3 } as const
		]);
		await renderPanel({ loadShares });
		const slider = (await page.getByTestId('finder-slider-partei').element()) as HTMLInputElement;
		slider.value = '2';
		slider.dispatchEvent(new Event('input', { bubbles: true }));
		await vi.waitFor(() => {
			expect(loadShares).toHaveBeenCalledWith('2025-btw-zweitstimme');
		});
	});

	it('meldet die genutzten Kriterien beim Unmount an Plausible', async () => {
		const events: Array<[string, unknown]> = [];
		(window as { plausible?: unknown }).plausible = (name: string, opts?: unknown) =>
			events.push([name, opts]);
		// Vitest-Browser-Tests laufen im iframe; der Embed-Guard (self !== top)
		// würde das Event schlucken. Top-Level-Kontext simulieren.
		__setEmbeddedForTests(false);
		try {
			const { result } = await renderPanel();
			const ruhe = (await page.getByTestId('finder-slider-ruheLuft').element()) as HTMLInputElement;
			ruhe.value = '2';
			ruhe.dispatchEvent(new Event('input', { bubbles: true }));
			const sbahn = (await page.getByTestId('finder-slider-sbahn').element()) as HTMLInputElement;
			sbahn.value = '1';
			sbahn.dispatchEvent(new Event('input', { bubbles: true }));
			await vi.waitFor(async () => {
				await expect.element(page.getByTestId('finder-top-list')).toBeInTheDocument();
			});
			await result.unmount();
			const finderEvents = events.filter(([name]) => name === 'Finder');
			expect(finderEvents).toHaveLength(1);
			const opts = finderEvents[0][1] as { props: Record<string, string | number> };
			expect(opts.props.action).toBe('nutzung');
			expect(opts.props.kriterien).toBe('ruheLuft+sbahn');
			expect(opts.props.anzahl).toBe(2);
		} finally {
			__setEmbeddedForTests(null);
			delete (window as { plausible?: unknown }).plausible;
		}
	});

	it('Neutral-Gewichte melden kein Nutzungs-Event', async () => {
		const events: string[] = [];
		(window as { plausible?: unknown }).plausible = (name: string) => events.push(name);
		// Ohne Override wäre der Embed-Guard aktiv und der Test trivial grün.
		__setEmbeddedForTests(false);
		try {
			const { result } = await renderPanel();
			await result.unmount();
			expect(events.filter((n) => n === 'Finder')).toHaveLength(0);
		} finally {
			__setEmbeddedForTests(null);
			delete (window as { plausible?: unknown }).plausible;
		}
	});

	it('trägt die redaktionelle Fußnote und die Quelle', async () => {
		await renderPanel();
		const panel = (await page.getByTestId('finder-panel').element()) as HTMLElement;
		expect(panel.textContent?.replace(/\s+/g, ' ')).toContain('bewertet weder Nachbarschaften');
		expect(panel.textContent).toContain('Zweitstimmen BTW 2025');
	});

	// Verklammert die Boundary-Duplikation: das WebMCP-Schema darf nur
	// Parteien anbieten, die das Panel auch kennt.
	it('FINDER_PARTIES entspricht der Panel-Parteiliste', () => {
		const panelParteien = Object.keys(PARTEI_FARBEN).filter(
			(p) => p !== 'Sonstige' && p !== 'CSU' && p !== 'FREIE WÄHLER'
		);
		expect([...FINDER_PARTIES].sort()).toEqual(panelParteien.sort());
	});

	// WebMCP-Kollaboration (Challenge 2026): Panel ↔ Bridge Round-Trip.
	it('Nutzer-Slider spiegelt Gewichte und Quelle user in die Bridge', async () => {
		resetFinderBridgeForTests();
		await renderPanel();
		const slider = (await page.getByTestId('finder-slider-ruheLuft').element()) as HTMLInputElement;
		slider.value = '2';
		slider.dispatchEvent(new Event('input', { bubbles: true }));
		await vi.waitFor(() => {
			const s = readFinderBridge();
			expect(s.weights.ruheLuft).toBe(2);
			expect(s.lastChangedBy).toBe('user');
		});
		resetFinderBridgeForTests();
	});

	it('wendet pending Agent-Gewichte an und liefert Top-Treffer in die Bridge', async () => {
		resetFinderBridgeForTests();
		await renderPanel();
		requestAgentWeights({ ruheLuft: 2 });
		await vi.waitFor(() => {
			const slider = document.querySelector(
				'[data-testid="finder-slider-ruheLuft"]'
			) as HTMLInputElement;
			expect(slider.value).toBe('2');
			expect(readFinderBridge().topMatches.length).toBeGreaterThan(0);
			expect(readFinderBridge().lastChangedBy).toBe('agent');
		});
		resetFinderBridgeForTests();
	});

	it('wendet eine Agent-Partei an: Select wechselt, Shares werden geladen', async () => {
		resetFinderBridgeForTests();
		const loadShares = vi.fn(async () => [] as never[]);
		await renderPanel({ loadShares });
		requestAgentWeights({ partei: 2 }, 'GRÜNE');
		await vi.waitFor(() => {
			expect(loadShares).toHaveBeenCalled();
			const slider = document.querySelector(
				'[data-testid="finder-slider-partei"]'
			) as HTMLInputElement;
			expect(slider.value).toBe('2');
			expect(readFinderBridge().party).toBe('GRÜNE');
		});
		resetFinderBridgeForTests();
	});

	// Bug 26.08. (Prod-Test): Agent-Gewichte kamen per Broadcast an, BEVOR
	// die Finder-Daten geladen waren; paint() brach ab und niemand malte
	// nach. Die Karte blieb weiß trotz gesetzter Regler.
	it('malt nach dem Daten-Load, wenn Agent-Gewichte schon warteten', async () => {
		resetFinderBridgeForTests();
		requestAgentWeights({ ruheLuft: 2 });
		const { map } = await renderPanel();
		await vi.waitFor(() => {
			expect(map.api.getLayer('navigator-finder-fill')).toBeTruthy();
			expect(readFinderBridge().topMatches.length).toBeGreaterThan(0);
		});
		resetFinderBridgeForTests();
	});

	// Prod-Race 26.08.: auf /explore mountet das Panel, bevor die
	// MapLibre-Instanz steht; Agent-Gewichte waren da, aber niemand malte,
	// als die Map später kam.
	it('malt, wenn die Map erst nach den Agent-Gewichten bereit wird', async () => {
		resetFinderBridgeForTests();
		requestAgentWeights({ ruheLuft: 2 });
		const map = fakeMap();
		const { result } = await renderPanel({ map: null });
		await result.rerender({ map: map.api });
		await vi.waitFor(() => {
			expect(map.api.getLayer('navigator-finder-fill')).toBeTruthy();
		});
		resetFinderBridgeForTests();
	});

	it('meldet Panel-Sichtbarkeit an die Bridge', async () => {
		resetFinderBridgeForTests();
		const { result } = await renderPanel();
		expect(readFinderBridge().panelActive).toBe(true);
		await result.unmount();
		expect(readFinderBridge().panelActive).toBe(false);
		resetFinderBridgeForTests();
	});
});
