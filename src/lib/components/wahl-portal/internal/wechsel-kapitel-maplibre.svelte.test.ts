import { describe, expect, it } from 'vitest';
import { WechselMapController } from './wechsel-kapitel-maplibre.svelte.js';
import {
	fakeMapFactory,
	fakeVisibleBoundsAfterFit,
	FAKE_ZOOM_AFTER_FIT
} from './fake-maplibre-test-util.js';
import { paddedMaxBounds } from './map-fit-constraints.js';
import type { WechselFeatureCollection } from './wechsel-map-data.js';

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

function fc(): WechselFeatureCollection {
	return {
		type: 'FeatureCollection',
		features: [
			{
				type: 'Feature',
				geometry: polygon(),
				properties: {
					gebiet_slug: 'a',
					gebiet_name: 'Alpha',
					wechsel_count: 1,
					farbe: '#7568C0'
				}
			}
		]
	};
}

async function flush() {
	await Promise.resolve();
	await Promise.resolve();
	await Promise.resolve();
}

describe('WechselMapController', () => {
	it('initialisiert die Karte einmal mit der gebackenen FeatureCollection', async () => {
		const fake = fakeMapFactory();
		const baked = fc();
		const ctl = new WechselMapController({ getFc: () => baked, mapFactory: fake.factory });
		ctl.container = document.createElement('div');
		ctl.ensureMap(baked);
		await flush();
		fake.handlers['load']?.();

		expect(ctl.ready).toBe(true);
		expect(fake.layers['wechsel-fill']).toBeDefined();
	});

	it('Review Triage Log #1: resize läuft synchron vor fitBounds, fitZoom stammt von NACH dem Fit, setMaxBounds bekommt die gepufferten SICHTBAREN Bounds (nicht die Daten-Bbox)', async () => {
		const fake = fakeMapFactory();
		const baked = fc();
		const ctl = new WechselMapController({ getFc: () => baked, mapFactory: fake.factory });
		ctl.container = document.createElement('div');
		ctl.ensureMap(baked);
		await flush();
		fake.handlers['load']?.();

		expect(ctl.ready).toBe(true);
		expect(fake.fitBoundsCalls).toHaveLength(1);
		// Reihenfolge: resize (synchron vor dem Fit) -> fitBounds -> setMaxBounds -> setMinZoom.
		const order = fake.callOrder;
		expect(order.indexOf('resize')).toBeGreaterThanOrEqual(0);
		expect(order.indexOf('resize')).toBeLessThan(order.indexOf('fitBounds'));
		expect(order.indexOf('fitBounds')).toBeLessThan(order.indexOf('setMaxBounds'));
		expect(order.indexOf('setMaxBounds')).toBeLessThan(order.indexOf('setMinZoom'));
		// fitZoom stammt von NACH dem Fit (Fake-Zoom wechselt erst bei fitBounds).
		expect(fake.setMinZoomCalls).toEqual([FAKE_ZOOM_AFTER_FIT]);
		// setMaxBounds bekommt die gepufferten SICHTBAREN Bounds (Fake-getBounds
		// nach dem Fit), nicht die rohe Daten-Bbox des Polygon-Fixtures ([0,0]..[1,1]).
		const dataBbox: [[number, number], [number, number]] = [
			[0, 0],
			[1, 1]
		];
		expect(fake.setMaxBoundsCalls[0]).toEqual(paddedMaxBounds(fakeVisibleBoundsAfterFit(dataBbox)));
		expect(fake.setMaxBoundsCalls[0]).not.toEqual(paddedMaxBounds(dataBbox));
	});

	it('Review Triage Log #2: getFc() liefert beim load-Handler eine leere FeatureCollection -- kein fitBounds/setMaxBounds/setMinZoom, kein Crash', async () => {
		const fake = fakeMapFactory();
		let current: WechselFeatureCollection | null = fc();
		const ctl = new WechselMapController({ getFc: () => current, mapFactory: fake.factory });
		ctl.container = document.createElement('div');
		ctl.ensureMap(current);
		await flush();

		// FC wird leer, BEVOR der load-Handler feuert -- turf.bbox([]) liefert
		// Infinity, ohne Empty-Guard würden fitBounds/setMaxBounds/setMinZoom mit
		// Infinity/NaN aufgerufen.
		current = { type: 'FeatureCollection', features: [] };
		expect(() => fake.handlers['load']?.()).not.toThrow();

		expect(fake.fitBoundsCalls).toHaveLength(0);
		expect(fake.setMaxBoundsCalls).toHaveLength(0);
		expect(fake.setMinZoomCalls).toHaveLength(0);
		expect(ctl.ready).toBe(true);
		expect(fake.layers['wechsel-fill']).toBeDefined();
	});

	it('Review Triage Log #3: Factory-/Import-Reject räumt den Init-Zustand auf, ein erneuter ensureMap()-Aufruf initialisiert danach normal', async () => {
		const fake = fakeMapFactory();
		let attempt = 0;
		const flakyFactory = async () => {
			attempt++;
			if (attempt === 1) throw new Error('boom (Test: Factory-/Import-Reject)');
			return fake.factory();
		};
		const baked = fc();
		const ctl = new WechselMapController({ getFc: () => baked, mapFactory: flakyFactory });
		ctl.container = document.createElement('div');

		ctl.ensureMap(baked);
		await flush();
		expect(ctl.ready).toBe(false);
		expect(fake.constructCount).toBe(0);

		// Ohne den try/catch-Patch bliebe der Init-Zustand hängen und dieser
		// zweite Aufruf würde nie erneut initialisieren (Review Triage Log #3).
		ctl.ensureMap(baked);
		await flush();
		fake.handlers['load']?.();

		expect(ctl.ready).toBe(true);
		expect(fake.constructCount).toBe(1);
	});

	it('destroy() räumt die Instanz auf', async () => {
		const fake = fakeMapFactory();
		const baked = fc();
		const ctl = new WechselMapController({ getFc: () => baked, mapFactory: fake.factory });
		ctl.container = document.createElement('div');
		ctl.ensureMap(baked);
		await flush();
		fake.handlers['load']?.();
		ctl.destroy();
		expect(ctl.ready).toBe(false);
	});

	it('Review Triage Log #4: ein neuer Container (Reihen-Wechsel-Loading-Zyklus) verwirft die alte Map und initialisiert neu, statt setData ins Leere zu schicken', async () => {
		const fake = fakeMapFactory();
		const baked = fc();
		const ctl = new WechselMapController({ getFc: () => baked, mapFactory: fake.factory });
		ctl.container = document.createElement('div');
		ctl.ensureMap(baked);
		await flush();
		fake.handlers['load']?.();
		expect(ctl.ready).toBe(true);
		expect(fake.constructCount).toBe(1);

		// Reihen-Wechsel-Loading-Zyklus: der Container-Div wird neu gemountet.
		ctl.container = document.createElement('div');
		ctl.ensureMap(baked);
		await flush();
		expect(fake.removeCalls.length).toBe(1);

		fake.handlers['load']?.();
		expect(fake.constructCount).toBe(2);
		expect(ctl.ready).toBe(true);
	});
});
