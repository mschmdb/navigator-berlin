import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import MapHoverTooltip, {
	type HoverEvent,
	type HoverFeature,
	type MapHoverApi
} from './map-hover-tooltip.svelte';

function makeFakeMap(featuresByCall: HoverFeature[][] = []) {
	const handlers: Record<string, ((e: HoverEvent) => void)[]> = {};
	let callIdx = 0;
	const api: MapHoverApi = {
		on: (event, handler) => {
			(handlers[event] ??= []).push(handler);
		},
		off: (event, handler) => {
			handlers[event] = (handlers[event] ?? []).filter((h) => h !== handler);
		},
		queryRenderedFeatures: () => {
			const r = featuresByCall[Math.min(callIdx, featuresByCall.length - 1)] ?? [];
			callIdx++;
			return r;
		}
	};
	return {
		api,
		fire: (event: 'mousemove' | 'mouseleave', e: HoverEvent) => {
			for (const h of handlers[event] ?? []) h(e);
		}
	};
}

describe('map-hover-tooltip.svelte', () => {
	it('rendert nicht ohne Map', async () => {
		render(MapHoverTooltip, { map: null, activeLayerSlugs: ['laerm-2023'] });
		await expect.element(page.getByTestId('map-hover-tooltip')).not.toBeInTheDocument();
	});

	it('rendert nicht wenn activeLayerSlugs leer', async () => {
		const { api } = makeFakeMap();
		render(MapHoverTooltip, { map: api, activeLayerSlugs: [] });
		await expect.element(page.getByTestId('map-hover-tooltip')).not.toBeInTheDocument();
	});

	it('rendert nicht im mobile-Modus', async () => {
		const { api, fire } = makeFakeMap([
			[{ layer: { id: 'navigator-layer-laerm-2023' }, properties: { kategorie: 'hoch' } }]
		]);
		render(MapHoverTooltip, {
			map: api,
			activeLayerSlugs: ['laerm-2023'],
			isMobile: true
		});
		fire('mousemove', { point: { x: 100, y: 100 } });
		await expect.element(page.getByTestId('map-hover-tooltip')).not.toBeInTheDocument();
	});

	it('Mousemove über aktiven Layer zeigt Tooltip mit Wert + short-Explain', async () => {
		const { api, fire } = makeFakeMap([
			[{ layer: { id: 'navigator-layer-laerm-2023' }, properties: { kategorie: 'hoch' } }]
		]);
		render(MapHoverTooltip, { map: api, activeLayerSlugs: ['laerm-2023'] });
		fire('mousemove', { point: { x: 100, y: 100 } });
		await expect.element(page.getByTestId('map-hover-tooltip')).toBeInTheDocument();
		const v = (await page.getByTestId('hover-tooltip-value').element()) as HTMLElement;
		expect(v.textContent).toMatch(/hoch/);
		const ex = (await page.getByTestId('hover-tooltip-explain').element()) as HTMLElement;
		expect(ex.textContent).toMatch(/Lärmbelastung/);
	});

	it('Empty features → Tooltip versteckt sich (auch ohne mouseleave)', async () => {
		const { api, fire } = makeFakeMap([
			[{ layer: { id: 'navigator-layer-laerm-2023' }, properties: { kategorie: 'hoch' } }],
			[]
		]);
		render(MapHoverTooltip, { map: api, activeLayerSlugs: ['laerm-2023'] });
		fire('mousemove', { point: { x: 100, y: 100 } });
		await expect.element(page.getByTestId('map-hover-tooltip')).toBeInTheDocument();
		fire('mousemove', { point: { x: 200, y: 200 } });
		await expect.element(page.getByTestId('map-hover-tooltip')).not.toBeInTheDocument();
	});

	it('Mouseleave versteckt nach 300ms', async () => {
		vi.useFakeTimers();
		try {
			const { api, fire } = makeFakeMap([
				[{ layer: { id: 'navigator-layer-laerm-2023' }, properties: { kategorie: 'hoch' } }]
			]);
			render(MapHoverTooltip, { map: api, activeLayerSlugs: ['laerm-2023'] });
			fire('mousemove', { point: { x: 100, y: 100 } });
			await expect.element(page.getByTestId('map-hover-tooltip')).toBeInTheDocument();
			fire('mouseleave', { point: { x: 0, y: 0 } });
			vi.advanceTimersByTime(310);
			await expect.element(page.getByTestId('map-hover-tooltip')).not.toBeInTheDocument();
		} finally {
			vi.useRealTimers();
		}
	});

	it('Filtert layerIds via getLayer (Race-Schutz gegen missing-Layer-Throw)', async () => {
		// Wenn getLayer Falsy zurueckliefert, soll queryRenderedFeatures NICHT mit dem
		// fehlenden Layer aufgerufen werden — Story 1.15 Bugfix: Symbol-Layer pre-mount.
		const handlers: Record<string, ((e: HoverEvent) => void)[]> = {};
		let querySpy: { layers: string[] } | null = null as { layers: string[] } | null;
		const api: MapHoverApi = {
			on: (event, handler) => {
				(handlers[event] ??= []).push(handler);
			},
			off: (event, handler) => {
				handlers[event] = (handlers[event] ?? []).filter((h) => h !== handler);
			},
			queryRenderedFeatures: (_point, opts) => {
				querySpy = opts;
				return [];
			},
			getLayer: (id: string) => (id === 'navigator-layer-bezirke' ? { id } : undefined)
		};
		render(MapHoverTooltip, {
			map: api,
			activeLayerSlugs: ['bezirke', 'stolpersteine']
		});
		await new Promise((r) => setTimeout(r, 10));
		for (const h of handlers['mousemove'] ?? []) h({ point: { x: 1, y: 1 } });
		expect(querySpy?.layers).toEqual(['navigator-layer-bezirke']);
	});

	it('POI-Hit (kitas-2024) zeigt Title + "Mehr im Inspektor"-Hint (Story 1.15)', async () => {
		const { api, fire } = makeFakeMap([
			[
				{
					layer: { id: 'navigator-layer-kitas-2024' },
					properties: { name: 'Kita Sonnenschein' }
				}
			]
		]);
		render(MapHoverTooltip, { map: api, activeLayerSlugs: ['kitas-2024'] });
		await new Promise((r) => setTimeout(r, 10));
		fire('mousemove', { point: { x: 100, y: 100 } });
		await expect.element(page.getByTestId('map-hover-tooltip')).toBeInTheDocument();
		const tip = (await page.getByTestId('map-hover-tooltip').element()) as HTMLElement;
		expect(tip.dataset.variant).toBe('poi');
		const title = (await page.getByTestId('poi-popover-title').element()) as HTMLElement;
		expect(title.textContent).toMatch(/Kita Sonnenschein/);
		const hint = (await page.getByTestId('poi-popover-hint').element()) as HTMLElement;
		expect(hint.textContent).toMatch(/Inspektor/);
	});

	it('Stolperstein-POI ohne person zeigt "Stolperstein" — KEIN "Unbekannte Person"', async () => {
		const { api, fire } = makeFakeMap([
			[{ layer: { id: 'navigator-layer-stolpersteine' }, properties: {} }]
		]);
		render(MapHoverTooltip, { map: api, activeLayerSlugs: ['stolpersteine'] });
		await new Promise((r) => setTimeout(r, 10));
		fire('mousemove', { point: { x: 100, y: 100 } });
		await expect.element(page.getByTestId('map-hover-tooltip')).toBeInTheDocument();
		const title = (await page.getByTestId('poi-popover-title').element()) as HTMLElement;
		expect(title.textContent).toMatch(/^\s*Stolperstein\s*$/);
		expect(title.textContent).not.toMatch(/Unbekannte/i);
	});

	it('POI-Hit mit subtitle (Schule + Schulart) zeigt subtitle separat', async () => {
		const { api, fire } = makeFakeMap([
			[
				{
					layer: { id: 'navigator-layer-schulen-2024' },
					properties: { name: 'Grundschule am Park', schulart: 'Grundschule' }
				}
			]
		]);
		render(MapHoverTooltip, { map: api, activeLayerSlugs: ['schulen-2024'] });
		await new Promise((r) => setTimeout(r, 10));
		fire('mousemove', { point: { x: 100, y: 100 } });
		await expect.element(page.getByTestId('map-hover-tooltip')).toBeInTheDocument();
		const subtitle = (await page.getByTestId('poi-popover-subtitle').element()) as HTMLElement;
		expect(subtitle.textContent).toMatch(/Grundschule/);
	});

	it('Topmost-Feature wird gewählt bei mehreren Treffern', async () => {
		const { api, fire } = makeFakeMap([
			[
				{ layer: { id: 'navigator-layer-klima-pet-2022' }, properties: { pet14h: 38.5 } },
				{ layer: { id: 'navigator-layer-bezirke' }, properties: { Gemeinde_name: 'Mitte' } }
			]
		]);
		render(MapHoverTooltip, {
			map: api,
			activeLayerSlugs: ['bezirke', 'klima-pet-2022']
		});
		// Effect runs after mount → wait for handler registration via fire-retry
		await new Promise((r) => setTimeout(r, 10));
		fire('mousemove', { point: { x: 100, y: 100 } });
		await expect.element(page.getByTestId('map-hover-tooltip')).toBeInTheDocument();
		const tip = (await page.getByTestId('map-hover-tooltip').element()) as HTMLElement;
		expect(tip.dataset.slug).toBe('klima-pet-2022');
	});
});

describe('map-hover-tooltip · Multi-Layer', () => {
	it('zeigt bei zwei aktiven Choroplethen beide Zeilen mit Layername + Wert', async () => {
		const { api, fire } = makeFakeMap([
			[
				{ layer: { id: 'navigator-layer-kiez-score-ruhe-luft' }, properties: { value: 62 } },
				{ layer: { id: 'navigator-layer-kiez-score-versorgung' }, properties: { value: 34 } }
			]
		]);
		render(MapHoverTooltip, {
			map: api,
			activeLayerSlugs: ['kiez-score-ruhe-luft', 'kiez-score-versorgung']
		});
		fire('mousemove', { point: { x: 10, y: 10 } });
		await expect.element(page.getByTestId('map-hover-tooltip')).toBeInTheDocument();
		const rows = (await page.getByTestId('map-hover-tooltip').element()).querySelectorAll(
			'[data-testid="hover-tooltip-row"]'
		);
		expect(rows).toHaveLength(2);
		expect(rows[0].textContent).toMatch(/Ruhe & Luft/);
		expect(rows[0].textContent).toMatch(/62/);
		expect(rows[1].textContent).toMatch(/Versorgung/);
		expect(rows[1].textContent).toMatch(/34/);
	});

	it('zeigt bei einem Layer weiterhin Wert + Erklärung (Bestand)', async () => {
		const { api, fire } = makeFakeMap([
			[{ layer: { id: 'navigator-layer-laerm-2023' }, properties: { kategorie: 'hoch' } }]
		]);
		render(MapHoverTooltip, { map: api, activeLayerSlugs: ['laerm-2023'] });
		fire('mousemove', { point: { x: 10, y: 10 } });
		await expect.element(page.getByTestId('map-hover-tooltip')).toBeInTheDocument();
		const v = (await page.getByTestId('hover-tooltip-value').element()) as HTMLElement;
		expect(v.textContent).toMatch(/hoch/);
	});
});

describe('map-hover-tooltip · Overflow langer Werte', () => {
	it('lange Werte bleiben innerhalb der Tooltip-Box (kein horizontaler Überlauf)', async () => {
		const { api, fire } = makeFakeMap([
			[
				{
					layer: { id: 'navigator-layer-wohnlagen-2024' },
					properties: { wol: 'mittel', strasse: 'Hohenfriedbergstraße', hnr: '12' }
				},
				{
					layer: { id: 'navigator-layer-milieuschutz-erhaltungsmiete' },
					properties: { gebietsname: 'Schöneberger Insel', bezirk: 'Tempelhof-Schöneberg' }
				}
			]
		]);
		render(MapHoverTooltip, {
			map: api,
			activeLayerSlugs: ['wohnlagen-2024', 'milieuschutz-erhaltungsmiete']
		});
		fire('mousemove', { point: { x: 10, y: 10 } });
		await expect.element(page.getByTestId('map-hover-tooltip')).toBeInTheDocument();
		const tip = (await page.getByTestId('map-hover-tooltip').element()) as HTMLElement;
		// Tailwind lädt in Browser-Tests nicht, deshalb Klassen-Assertions:
		// nowrap drückte lange Ortsnamen aus der Box (Bug 22.08.), Werte müssen
		// am Wortende umbrechen dürfen.
		for (const el of tip.querySelectorAll('dd')) {
			expect((el as HTMLElement).className).not.toMatch(/whitespace-nowrap/);
			expect((el as HTMLElement).className).toMatch(/break-words/);
			expect((el as HTMLElement).className).toMatch(/min-w-0/);
		}
	});
});
