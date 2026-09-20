import { describe, expect, it } from 'vitest';
import type { FeatureCollection } from 'geojson';
import { TrendsMapController } from './trends-kapitel-maplibre.svelte.js';
import { bakeTrendsProperties, trendPropKeys, VOLATILITAET_FARBE_KEY } from './trends-map-expressions.js';
import type { TrendsGebietInput } from './trends-map-data.js';
import { fakeMapFactory } from './fake-maplibre-test-util.js';

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

function fc(): FeatureCollection {
	return {
		type: 'FeatureCollection',
		features: [{ type: 'Feature', geometry: polygon(), properties: {} }]
	};
}

function bakedFc(gebiete: ReadonlyMap<string, TrendsGebietInput>) {
	return bakeTrendsProperties(fc(), ['a'], ['Alpha'], gebiete, ['SPD', 'GRÜNE']);
}

async function flush() {
	await Promise.resolve();
	await Promise.resolve();
	await Promise.resolve();
}

describe('TrendsMapController', () => {
	it('initialisiert die Karte einmal mit der aktiven Toggle/Chip-Expression', async () => {
		const fake = fakeMapFactory();
		const gebiete = new Map<string, TrendsGebietInput>([
			['a', { kiez_slug: 'a', volatilitaet: 0.08, trends: [{ partei: 'GRÜNE', slope: 0.015 }] }]
		]);
		const baked = bakedFc(gebiete);
		const ctl = new TrendsMapController({
			getFc: () => baked,
			getToggle: () => 'volatilitaet',
			getAktivePartei: () => 'SPD',
			mapFactory: fake.factory
		});
		ctl.container = document.createElement('div');
		ctl.ensureMap(baked);
		await flush();
		fake.handlers['load']?.();

		expect(ctl.ready).toBe(true);
		expect(fake.layers['trends-fill'].paint).toMatchObject({
			'fill-color': ['get', VOLATILITAET_FARBE_KEY]
		});
	});

	it('AC: Toggle-/Chip-Wechsel ist NUR setPaintProperty, kein setData, kein Re-Init', async () => {
		const fake = fakeMapFactory();
		const gebiete = new Map<string, TrendsGebietInput>([
			['a', { kiez_slug: 'a', volatilitaet: 0.08, trends: [{ partei: 'GRÜNE', slope: 0.015 }] }]
		]);
		const baked = bakedFc(gebiete);
		let toggle: 'trend' | 'volatilitaet' = 'volatilitaet';
		let partei = 'SPD';
		const ctl = new TrendsMapController({
			getFc: () => baked,
			getToggle: () => toggle,
			getAktivePartei: () => partei,
			mapFactory: fake.factory
		});
		ctl.container = document.createElement('div');
		ctl.ensureMap(baked);
		await flush();
		fake.handlers['load']?.();
		expect(ctl.ready).toBe(true);

		fake.paintCalls.length = 0;
		toggle = 'trend';
		partei = 'GRÜNE';
		ctl.repaint();

		expect(fake.setDataCalls).toHaveLength(0);
		const colorCall = fake.paintCalls.find((c) => c.prop === 'fill-color');
		expect(colorCall?.value).toEqual(['get', trendPropKeys('GRÜNE').farbe]);
	});

	it('ensureMap mit neuer FC nach ready, GLEICHER Container: nur setData (Reihen-Wechsel-Refresh, Review Triage Log #15)', async () => {
		const fake = fakeMapFactory();
		const gebiete1 = new Map<string, TrendsGebietInput>([
			['a', { kiez_slug: 'a', volatilitaet: 0.02, trends: [] }]
		]);
		const baked1 = bakedFc(gebiete1);
		const ctl = new TrendsMapController({
			getFc: () => baked1,
			getToggle: () => 'volatilitaet',
			getAktivePartei: () => 'SPD',
			mapFactory: fake.factory
		});
		ctl.container = document.createElement('div');
		ctl.ensureMap(baked1);
		await flush();
		fake.handlers['load']?.();
		expect(ctl.ready).toBe(true);
		expect(fake.constructCount).toBe(1);

		const gebiete2 = new Map<string, TrendsGebietInput>([
			['a', { kiez_slug: 'a', volatilitaet: 0.3, trends: [] }]
		]);
		const baked2 = bakedFc(gebiete2);
		ctl.ensureMap(baked2);

		expect(fake.setDataCalls).toContainEqual(baked2);
		expect(fake.constructCount).toBe(1);
	});

	it('Remount-Guard: ein neuer Container (Reihen-Wechsel-Loading-Zyklus) verwirft die alte Map und initialisiert neu, statt setData ins Leere zu schicken (Review Triage Log #13)', async () => {
		const fake = fakeMapFactory();
		const gebiete = new Map<string, TrendsGebietInput>([
			['a', { kiez_slug: 'a', volatilitaet: 0.08, trends: [] }]
		]);
		const baked = bakedFc(gebiete);
		const ctl = new TrendsMapController({
			getFc: () => baked,
			getToggle: () => 'volatilitaet',
			getAktivePartei: () => 'SPD',
			mapFactory: fake.factory
		});
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

	it('destroy() räumt die Instanz auf', async () => {
		const fake = fakeMapFactory();
		const baked = bakedFc(new Map());
		const ctl = new TrendsMapController({
			getFc: () => baked,
			getToggle: () => 'volatilitaet',
			getAktivePartei: () => 'SPD',
			mapFactory: fake.factory
		});
		ctl.container = document.createElement('div');
		ctl.ensureMap(baked);
		await flush();
		fake.handlers['load']?.();
		ctl.destroy();
		expect(ctl.ready).toBe(false);
	});
});
