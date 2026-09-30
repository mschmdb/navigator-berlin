import type { FeatureCollection } from 'geojson';
import { describe, expect, it } from 'vitest';
import {
	bakeTrendsProperties,
	trendPropKeys,
	trendsFillColorExpression,
	trendsFillOpacityExpression,
	VOLATILITAET_FARBE_KEY,
	VOLATILITAET_HAT_DATEN_KEY
} from './trends-map-expressions.js';
import {
	TREND_NEUTRAL_FARBE,
	TREND_STEIGEND_DUNKEL,
	VOLATILITAET_FARBE_STUFE_1,
	VOLATILITAET_FARBE_STUFE_2_PLUS,
	VOLATILITAET_NEUTRAL_FARBE,
	type TrendsGebietInput
} from './trends-map-data.js';

function polygon() {
	return {
		type: 'Polygon' as const,
		coordinates: [
			[
				[13.3, 52.5],
				[13.3, 52.51],
				[13.31, 52.51],
				[13.3, 52.5]
			]
		]
	};
}

function fc(n: number): FeatureCollection {
	return {
		type: 'FeatureCollection',
		features: Array.from({ length: n }, () => ({
			type: 'Feature' as const,
			geometry: polygon(),
			properties: {}
		}))
	};
}

describe('bakeTrendsProperties', () => {
	const gebiete = new Map<string, TrendsGebietInput>([
		['a', { kiez_slug: 'a', volatilitaet: 0.08, trends: [{ partei: 'GRÜNE', slope: 0.015 }] }]
	]);

	it('backt Volatilität + jede übergebene Partei als flache Keys', () => {
		const baked = bakeTrendsProperties(fc(1), ['a'], ['Kiez A'], gebiete, ['SPD', 'GRÜNE']);
		const props = baked.features[0].properties;
		expect(props[VOLATILITAET_FARBE_KEY]).toBe(VOLATILITAET_FARBE_STUFE_1);
		expect(props[VOLATILITAET_HAT_DATEN_KEY]).toBe(1);
		const spdKeys = trendPropKeys('SPD');
		expect(props[spdKeys.hatDaten]).toBe(0);
		expect(props[spdKeys.farbe]).toBe(TREND_NEUTRAL_FARBE);
		const grueneKeys = trendPropKeys('GRÜNE');
		expect(props[grueneKeys.hatDaten]).toBe(1);
		expect(props[grueneKeys.farbe]).toBe(TREND_STEIGEND_DUNKEL);
	});

	it('Gebiet ohne Analytik-Eintrag bleibt neutral für alle Keys, kein Crash', () => {
		const baked = bakeTrendsProperties(fc(1), ['unbekannt'], ['?'], gebiete, ['SPD']);
		const props = baked.features[0].properties;
		expect(props[VOLATILITAET_HAT_DATEN_KEY]).toBe(0);
		expect(props[trendPropKeys('SPD').hatDaten]).toBe(0);
	});
});

describe('trendsFillColorExpression / trendsFillOpacityExpression', () => {
	it('liest den Volatilitäts-Key bei Toggle volatilitaet', () => {
		expect(trendsFillColorExpression('volatilitaet', 'SPD')).toEqual([
			'get',
			VOLATILITAET_FARBE_KEY
		]);
		expect(trendsFillOpacityExpression('volatilitaet', 'SPD', 0.9, 0.1)).toEqual([
			'case',
			['==', ['get', VOLATILITAET_HAT_DATEN_KEY], 1],
			0.9,
			0.1
		]);
	});

	it('liest den partei-spezifischen Key bei Toggle trend', () => {
		const keys = trendPropKeys('GRÜNE');
		expect(trendsFillColorExpression('trend', 'GRÜNE')).toEqual(['get', keys.farbe]);
		expect(trendsFillOpacityExpression('trend', 'GRÜNE', 0.9, 0.1)).toEqual([
			'case',
			['==', ['get', keys.hatDaten], 1],
			0.9,
			0.1
		]);
	});
});

describe('bakeTrendsProperties Volatilität nach Terzilen', () => {
	it('färbt drei Gebiete in drei Stufen (Live-Karte nutzt die gebackenen Properties)', () => {
		const gebiete = new Map<string, TrendsGebietInput>([
			['a', { kiez_slug: 'a', volatilitaet: 0.1, trends: [] }],
			['b', { kiez_slug: 'b', volatilitaet: 0.2, trends: [] }],
			['c', { kiez_slug: 'c', volatilitaet: 0.3, trends: [] }]
		]);
		const baked = bakeTrendsProperties(fc(3), ['a', 'b', 'c'], ['A', 'B', 'C'], gebiete, []);
		expect(baked.features.map((f) => f.properties[VOLATILITAET_FARBE_KEY])).toEqual([
			VOLATILITAET_NEUTRAL_FARBE,
			VOLATILITAET_FARBE_STUFE_1,
			VOLATILITAET_FARBE_STUFE_2_PLUS
		]);
	});

	it('Volatilität 0 (< 2 Legislaturen) zählt als keine Daten und nicht in die Terzile', () => {
		const gebiete = new Map<string, TrendsGebietInput>([
			['a', { kiez_slug: 'a', volatilitaet: 0, trends: [] }],
			['b', { kiez_slug: 'b', volatilitaet: 0.1, trends: [] }],
			['c', { kiez_slug: 'c', volatilitaet: 0.2, trends: [] }],
			['d', { kiez_slug: 'd', volatilitaet: 0.3, trends: [] }]
		]);
		const baked = bakeTrendsProperties(
			fc(4),
			['a', 'b', 'c', 'd'],
			['A', 'B', 'C', 'D'],
			gebiete,
			[]
		);
		expect(baked.features[0].properties[VOLATILITAET_HAT_DATEN_KEY]).toBe(0);
		expect(baked.features.slice(1).map((f) => f.properties[VOLATILITAET_FARBE_KEY])).toEqual([
			VOLATILITAET_NEUTRAL_FARBE,
			VOLATILITAET_FARBE_STUFE_1,
			VOLATILITAET_FARBE_STUFE_2_PLUS
		]);
	});
});
