import { describe, expect, it } from 'vitest';
import type { FeatureCollection } from 'geojson';
import { WinnerMapController, NEVER_FILTER } from './winner-map-maplibre.svelte.js';
import {
	fillColorExpression,
	fillOpacityExpression,
	fillPatternExpression,
	genericParteiFillOpacityExpression,
	jahrPropKeys,
	parteiFillOpacityExpression,
	wechselOutlineExpression
} from './winner-map-expressions.js';
import { genericFillOpacityExpression, type GebietFeatureCollection } from './winner-map-data.js';

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
	const setDataCalls: unknown[] = [];
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
			return sources[id] ? { setData: (data: unknown) => setDataCalls.push(data) } : undefined;
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
		setDataCalls,
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

	describe('Story 9 (Partei-Modus): partei-relative Rampe + Wechsel-Outline immer aus', () => {
		it('Erst-Init-Paint mit gesetzter Partei-Rampe nutzt parteiFillOpacityExpression und NEVER_FILTER', async () => {
			const fake = fakeMapFactory();
			const ctl = new WinnerMapController({
				getFc: () => bakedFc(2023),
				getActiveJahr: () => 2023,
				getParteiRamp: () => ({ min: 0.1, max: 0.5 }),
				mapFactory: fake.factory
			});
			await mountAndLoad(ctl, fake, bakedFc(2023));

			const paint = fake.layers['winners-fill']?.paint as Record<string, unknown>;
			expect(paint['fill-opacity']).toEqual(parteiFillOpacityExpression(2023, 0.1, 0.5));
			expect(fake.layers['winners-wechsel-outline']?.filter).toEqual(NEVER_FILTER);
		});

		it('setActiveJahr im Partei-Modus setzt die Rampen-Opacity und hält den Outline-Filter auf NEVER_FILTER', async () => {
			const fake = fakeMapFactory();
			const ctl = new WinnerMapController({
				getFc: () => bakedFc(2023),
				getActiveJahr: () => 2023,
				getParteiRamp: () => ({ min: 0.1, max: 0.5 }),
				mapFactory: fake.factory
			});
			await mountAndLoad(ctl, fake, bakedFc(2023));

			ctl.setActiveJahr(2016);

			const fillOpacityCall = fake.paintCalls.filter(
				(c) => c.layer === 'winners-fill' && c.prop === 'fill-opacity'
			);
			expect(fillOpacityCall.at(-1)?.value).toEqual(parteiFillOpacityExpression(2016, 0.1, 0.5));

			const filterCall = fake.filterCalls.at(-1);
			expect(filterCall).toEqual({ layer: 'winners-wechsel-outline', filter: NEVER_FILTER });
		});

		it('Review-Fund #1(a): setActiveJahr auf DEMSELBEN Jahr wechselt korrekt zwischen Partei-Rampe und Sieger-Rampe zurück (kiez/bezirk-Pfad)', async () => {
			const fake = fakeMapFactory();
			let currentRamp: { min: number; max: number } | null = { min: 0.1, max: 0.5 };
			const ctl = new WinnerMapController({
				getFc: () => bakedFc(2023),
				getActiveJahr: () => 2023,
				getParteiRamp: () => currentRamp,
				mapFactory: fake.factory
			});
			await mountAndLoad(ctl, fake, bakedFc(2023));

			ctl.setActiveJahr(2023);
			let fillOpacityCall = fake.paintCalls
				.filter((c) => c.layer === 'winners-fill' && c.prop === 'fill-opacity')
				.at(-1);
			expect(fillOpacityCall?.value).toEqual(parteiFillOpacityExpression(2023, 0.1, 0.5));
			expect(fake.filterCalls.at(-1)).toEqual({
				layer: 'winners-wechsel-outline',
				filter: NEVER_FILTER
			});

			// Rückwechsel zu "Gewinner" (Rampe null), OHNE Jahr-/Ebenen-Wechsel --
			// genau das Szenario, das die fehlende `parteiRamp`-Effect-Dependency
			// in winner-map.svelte nicht neu gepainted hat (Review-Fund #1).
			currentRamp = null;
			ctl.setActiveJahr(2023);
			fillOpacityCall = fake.paintCalls
				.filter((c) => c.layer === 'winners-fill' && c.prop === 'fill-opacity')
				.at(-1);
			expect(fillOpacityCall?.value).toEqual(fillOpacityExpression(2023));
			expect(fake.filterCalls.at(-1)).toEqual({
				layer: 'winners-wechsel-outline',
				filter: wechselOutlineExpression(2023)
			});
		});

		it('genericer Erst-Init-Pfad (Stimmbezirk, kein aktives Jahr) nutzt genericParteiFillOpacityExpression, wenn eine Rampe gesetzt ist', async () => {
			const genericFc: GebietFeatureCollection = {
				type: 'FeatureCollection',
				features: [
					{
						type: 'Feature',
						geometry: polygon(),
						properties: { gebiet_slug: 'a', farbe: '#123456', anteil: 0.3, has_winner: 1 }
					}
				]
			} as unknown as GebietFeatureCollection;
			const fake = fakeMapFactory();
			const ctl = new WinnerMapController({
				getFc: () => genericFc,
				getParteiRamp: () => ({ min: 0.1, max: 0.5 }),
				mapFactory: fake.factory
			});
			await mountAndLoad(ctl, fake, genericFc);

			const paint = fake.layers['winners-fill']?.paint as Record<string, unknown>;
			expect(paint['fill-opacity']).toEqual(genericParteiFillOpacityExpression(0.1, 0.5));
		});

		it('Rückwechsel Partei -> Gewinner (Stimmbezirk): setData zeigt wieder die Sieger-FC UND fill-opacity zeigt wieder die generische Sieger-Rampe (Live-Bug-Report)', async () => {
			const gewinnerFc: GebietFeatureCollection = {
				type: 'FeatureCollection',
				features: [
					{
						type: 'Feature',
						geometry: polygon(),
						properties: { gebiet_slug: 'a', farbe: '#a50c1a', anteil: 0.4, has_winner: 1 }
					},
					{
						type: 'Feature',
						geometry: polygon(),
						properties: { gebiet_slug: 'b', farbe: '#1a1a1a', anteil: 0.3, has_winner: 1 }
					}
				]
			} as unknown as GebietFeatureCollection;
			const spdFc: GebietFeatureCollection = {
				type: 'FeatureCollection',
				features: [
					{
						type: 'Feature',
						geometry: polygon(),
						properties: { gebiet_slug: 'a', farbe: '#a50c1a', anteil: 0.089, has_winner: 1 }
					},
					{
						type: 'Feature',
						geometry: polygon(),
						properties: { gebiet_slug: 'b', farbe: '#a50c1a', anteil: 0.349, has_winner: 1 }
					}
				]
			} as unknown as GebietFeatureCollection;

			let currentFc = gewinnerFc;
			let currentRamp: { min: number; max: number } | null = null;
			const fake = fakeMapFactory();
			const ctl = new WinnerMapController({
				getFc: () => currentFc,
				getParteiRamp: () => currentRamp,
				mapFactory: fake.factory
			});
			await mountAndLoad(ctl, fake, gewinnerFc);

			// Tab-Wechsel zu SPD: setData(spdFc) + setGenericRamp(spanne).
			currentFc = spdFc;
			currentRamp = { min: 0.089, max: 0.349 };
			ctl.ensureMap(currentFc);
			ctl.setGenericRamp(currentRamp);
			expect(fake.setDataCalls.at(-1)).toEqual(spdFc);
			expect(fake.paintCalls.at(-1)).toEqual({
				layer: 'winners-fill',
				prop: 'fill-opacity',
				value: genericParteiFillOpacityExpression(0.089, 0.349)
			});

			// Rückwechsel zu Gewinner: setData(gewinnerFc) + setGenericRamp(null).
			currentFc = gewinnerFc;
			currentRamp = null;
			ctl.ensureMap(currentFc);
			ctl.setGenericRamp(currentRamp);

			expect(fake.setDataCalls.at(-1)).toEqual(gewinnerFc);
			const lastOpacityCall = fake.paintCalls.at(-1);
			expect(lastOpacityCall).toEqual({
				layer: 'winners-fill',
				prop: 'fill-opacity',
				value: genericFillOpacityExpression()
			});
			// fill-color bleibt die datengetriebene ['get','farbe']-Expression --
			// nie ein hartcodierter Einzelfarb-Wert (Boundary Multi-Farb-Sieger-Ansicht).
			const fillColorCalls = fake.paintCalls.filter((c) => c.prop === 'fill-color');
			expect(fillColorCalls).toHaveLength(0);
			expect(fake.layers['winners-fill']?.paint).toMatchObject({ 'fill-color': ['get', 'farbe'] });
		});

		it('setGenericRamp repaintet fill-opacity mit der partei-relativen generischen Rampe (Stimmbezirk-Tab-Wechsel)', async () => {
			const genericFc: GebietFeatureCollection = {
				type: 'FeatureCollection',
				features: [
					{
						type: 'Feature',
						geometry: polygon(),
						properties: { gebiet_slug: 'a', farbe: '#123456', anteil: 0.3, has_winner: 1 }
					}
				]
			} as unknown as GebietFeatureCollection;
			const fake = fakeMapFactory();
			const ctl = new WinnerMapController({ getFc: () => genericFc, mapFactory: fake.factory });
			await mountAndLoad(ctl, fake, genericFc);

			ctl.setGenericRamp({ min: 0.2, max: 0.6 });
			const call = fake.paintCalls.at(-1);
			expect(call).toEqual({
				layer: 'winners-fill',
				prop: 'fill-opacity',
				value: genericParteiFillOpacityExpression(0.2, 0.6)
			});

			ctl.setGenericRamp(null);
			const resetCall = fake.paintCalls.at(-1);
			expect(resetCall?.prop).toBe('fill-opacity');
		});

		it('Muster-Modus im Partei-Tab (kiez/bezirk, Jahr aktiv): fill-pattern nutzt die jahr-gebundene Expression wie im Gewinner-Modus', async () => {
			const fake = fakeMapFactory();
			const ctl = new WinnerMapController({
				getFc: () => bakedFc(2023),
				getActiveJahr: () => 2023,
				getParteiRamp: () => ({ min: 0.1, max: 0.5 }),
				mapFactory: fake.factory
			});
			await mountAndLoad(ctl, fake, bakedFc(2023));

			ctl.setPatternsEnabled(true, ['Die Linke']);

			const patternCall = fake.paintCalls
				.filter((c) => c.layer === 'winners-fill' && c.prop === 'fill-pattern')
				.at(-1);
			expect(patternCall?.value).toEqual(
				fillPatternExpression(2023, 'wahl-partei-pattern-neutral')
			);
		});

		it('Muster-Modus im Partei-Tab (Stimmbezirk, generischer Pfad): fill-pattern liest den generischen pattern_image_id-Key', async () => {
			const genericFc: GebietFeatureCollection = {
				type: 'FeatureCollection',
				features: [
					{
						type: 'Feature',
						geometry: polygon(),
						properties: {
							gebiet_slug: 'a',
							farbe: '#8c2057',
							anteil: 0.3,
							has_winner: 1,
							pattern_image_id: 'wahl-partei-pattern-die-linke'
						}
					}
				]
			} as unknown as GebietFeatureCollection;
			const fake = fakeMapFactory();
			const ctl = new WinnerMapController({
				getFc: () => genericFc,
				getParteiRamp: () => ({ min: 0.1, max: 0.5 }),
				mapFactory: fake.factory
			});
			await mountAndLoad(ctl, fake, genericFc);

			ctl.setPatternsEnabled(true, ['Die Linke']);

			const patternCall = fake.paintCalls
				.filter((c) => c.layer === 'winners-fill' && c.prop === 'fill-pattern')
				.at(-1);
			expect(patternCall?.value).toEqual([
				'coalesce',
				['get', 'pattern_image_id'],
				'wahl-partei-pattern-neutral'
			]);
		});
	});
});
