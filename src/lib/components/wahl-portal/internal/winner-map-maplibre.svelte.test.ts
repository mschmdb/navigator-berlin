import { describe, expect, it, vi } from 'vitest';
import type { FeatureCollection } from 'geojson';
import { WinnerMapController } from './winner-map-maplibre.svelte.js';
import { fillColorExpression, jahrPropKeys, wechselOutlineExpression } from './winner-map-expressions.js';
import type { GebietFeatureCollection } from './winner-map-data.js';

/**
 * Fake-MapLibre-Naht (Muster `kiez-finder-panel.svelte.test.ts`): zeichnet
 * `setPaintProperty`/`setFilter`/`addLayer`/`on`-Aufrufe auf, statt die echte
 * Bibliothek zu laden. Deckt Review-Fund VG-2 (kein Test beobachtet, dass ein
 * Jahr-Schritt tatsächlich `setPaintProperty`/`setFilter` auslöst) und
 * VG-1/EC-1 (`clearActiveJahr` beim Ebenen-Wechsel weg von kiez/bezirk) ab.
 */
function fakeMapFactory() {
	const paintCalls: Array<{ layer: string; prop: string; value: unknown }> = [];
	const filterCalls: Array<{ layer: string; filter: unknown }> = [];
	const layers: Record<string, Record<string, unknown>> = {};
	const sources: Record<string, unknown> = {};
	const handlers: Record<string, (...args: unknown[]) => void> = {};

	class FakeMap {
		constructor() {}
		on(event: string, layerOrHandler: unknown, handler?: unknown) {
			if (typeof handler === 'function') {
				handlers[`${event}:${String(layerOrHandler)}`] = handler as (...args: unknown[]) => void;
			} else {
				handlers[event] = layerOrHandler as (...args: unknown[]) => void;
			}
		}
		addSource(id: string, source: Record<string, unknown>) {
			sources[id] = source;
		}
		addLayer(layer: Record<string, unknown>) {
			layers[layer.id as string] = layer;
		}
		setPaintProperty(layer: string, prop: string, value: unknown) {
			paintCalls.push({ layer, prop, value });
		}
		setFilter(layer: string, filter: unknown) {
			filterCalls.push({ layer, filter });
		}
		getSource(id: string) {
			return sources[id] ? { setData: vi.fn() } : undefined;
		}
		hasImage() {
			return false;
		}
		addImage() {}
		fitBounds() {}
		resize() {}
		remove() {}
		getCanvas() {
			return { style: { cursor: '' } };
		}
	}

	return {
		paintCalls,
		filterCalls,
		layers,
		handlers,
		factory: () => Promise.resolve(FakeMap as unknown as never)
	};
}

function polygon() {
	return {
		type: 'Polygon' as const,
		coordinates: [
			[
				[0, 0],
				[0, 1],
				[1, 1],
				[0, 0]
			]
		]
	};
}

function bakedFc(jahr: number): GebietFeatureCollection {
	const keys = jahrPropKeys(jahr);
	const fc: FeatureCollection = {
		type: 'FeatureCollection',
		features: [
			{
				type: 'Feature',
				geometry: polygon(),
				properties: {
					gebiet_slug: 'a',
					gebiet_name: 'Alpha',
					[keys.farbe]: '#123456',
					[keys.partei]: 'SPD',
					[keys.anteil]: 0.42,
					[keys.hw]: 1,
					[keys.wechsel]: 1
				}
			}
		]
	};
	return fc as unknown as GebietFeatureCollection;
}

/** Fires the recorded `load` handler and waits for the pending `#initMap` promise chain. */
async function mountAndLoad(
	ctl: WinnerMapController,
	fake: ReturnType<typeof fakeMapFactory>,
	fc: GebietFeatureCollection
) {
	ctl.container = document.createElement('div');
	ctl.ensureMap(fc);
	// #initMap ist async (await this.#mapFactory()); Mikrotasks abwarten,
	// bevor der `load`-Handler existiert.
	await Promise.resolve();
	await Promise.resolve();
	fake.handlers['load']?.();
}

describe('WinnerMapController (Fake-Map-Naht)', () => {
	it('Erst-Init-Paint mit aktivem Jahr liest bereits die w_<jahr>_*-Keys', async () => {
		const fake = fakeMapFactory();
		const ctl = new WinnerMapController({
			getFc: () => bakedFc(2023),
			getActiveJahr: () => 2023,
			mapFactory: fake.factory
		});
		await mountAndLoad(ctl, fake, bakedFc(2023));

		const paint = fake.layers['winners-fill']?.paint as Record<string, unknown>;
		expect(paint['fill-color']).toEqual(fillColorExpression(2023));
		expect(fake.layers['winners-wechsel-outline']?.filter).toEqual(wechselOutlineExpression(2023));
	});

	it('setActiveJahr ruft setPaintProperty/setFilter mit den w_<jahr>_*-Keys des neuen Jahres', async () => {
		const fake = fakeMapFactory();
		const ctl = new WinnerMapController({
			getFc: () => bakedFc(2023),
			getActiveJahr: () => 2023,
			mapFactory: fake.factory
		});
		await mountAndLoad(ctl, fake, bakedFc(2023));

		ctl.setActiveJahr(2016);

		const fillColorCall = fake.paintCalls.find(
			(c) => c.layer === 'winners-fill' && c.prop === 'fill-color'
		);
		expect(fillColorCall?.value).toEqual(fillColorExpression(2016));

		const fillOpacityCall = fake.paintCalls.find(
			(c) => c.layer === 'winners-fill' && c.prop === 'fill-opacity'
		);
		expect(fillOpacityCall).toBeDefined();

		const filterCall = fake.filterCalls.at(-1);
		expect(filterCall).toEqual({
			layer: 'winners-wechsel-outline',
			filter: wechselOutlineExpression(2016)
		});
	});

	it('clearActiveJahr setzt Paint/Filter auf die generischen Properties zurück (Ebenen-Wechsel weg von kiez/bezirk)', async () => {
		const fake = fakeMapFactory();
		const ctl = new WinnerMapController({
			getFc: () => bakedFc(2023),
			getActiveJahr: () => 2023,
			mapFactory: fake.factory
		});
		await mountAndLoad(ctl, fake, bakedFc(2023));

		ctl.clearActiveJahr();

		const fillColorCall = fake.paintCalls.filter(
			(c) => c.layer === 'winners-fill' && c.prop === 'fill-color'
		);
		expect(fillColorCall.at(-1)?.value).toEqual(['get', 'farbe']);

		const filterCall = fake.filterCalls.at(-1);
		expect(filterCall?.layer).toBe('winners-wechsel-outline');
		expect(filterCall?.filter).toEqual(['==', ['literal', 1], 0]);
	});

	it('clearActiveJahr ist ein No-Op, wenn nie ein Jahr aktiv war (Stimmbezirks-Default)', async () => {
		const fake = fakeMapFactory();
		const ctl = new WinnerMapController({
			getFc: () => bakedFc(2023),
			mapFactory: fake.factory
		});
		await mountAndLoad(ctl, fake, bakedFc(2023));

		ctl.clearActiveJahr();
		expect(fake.paintCalls).toHaveLength(0);
		expect(fake.filterCalls).toHaveLength(0);
	});

	it('mousemove im Baked-Modus liefert Partei/Anteil/Wechsel über winnerForJahrJs', async () => {
		const fake = fakeMapFactory();
		const ctl = new WinnerMapController({
			getFc: () => bakedFc(2023),
			getActiveJahr: () => 2023,
			mapFactory: fake.factory
		});
		await mountAndLoad(ctl, fake, bakedFc(2023));

		const keys = jahrPropKeys(2023);
		fake.handlers['mousemove:winners-fill']?.({
			features: [
				{
					properties: {
						gebiet_name: 'Alpha',
						[keys.farbe]: '#123456',
						[keys.partei]: 'SPD',
						[keys.anteil]: 0.42,
						[keys.hw]: 1,
						[keys.wechsel]: 1
					}
				}
			],
			point: { x: 5, y: 7 }
		});

		expect(ctl.tooltipVisible).toBe(true);
		expect(ctl.tooltipData).toEqual({
			gebietName: 'Alpha',
			partei: 'SPD',
			anteil: 0.42,
			hasWinner: true,
			wechsel: true
		});
	});
});
