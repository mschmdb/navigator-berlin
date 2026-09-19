import { describe, expect, it } from 'vitest';
import type { FeatureCollection } from 'geojson';
import {
	blendOverBasemap,
	buildWechselFeatureCollection,
	buildWechselTableRows,
	contrastRatio,
	farbeForWechselCount,
	WECHSEL_FARBE_STUFE_1,
	WECHSEL_FARBE_STUFE_2_PLUS,
	WECHSEL_FILL_OPACITY,
	WECHSEL_NEUTRAL_FARBE
} from './wechsel-map-data.js';

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

function fc(count: number): FeatureCollection {
	return {
		type: 'FeatureCollection',
		features: Array.from({ length: count }, () => ({
			type: 'Feature' as const,
			properties: {},
			geometry: polygon()
		}))
	};
}

describe('farbeForWechselCount', () => {
	it('0 neutral, 1 Stufe-1, 2+ Stufe-2', () => {
		expect(farbeForWechselCount(0)).toBe(WECHSEL_NEUTRAL_FARBE);
		expect(farbeForWechselCount(1)).toBe(WECHSEL_FARBE_STUFE_1);
		expect(farbeForWechselCount(2)).toBe(WECHSEL_FARBE_STUFE_2_PLUS);
		expect(farbeForWechselCount(5)).toBe(WECHSEL_FARBE_STUFE_2_PLUS);
	});
});

describe('buildWechselFeatureCollection', () => {
	it('joint Häufigkeit + Farbe je Gebiet, unbekannte Gebiete bleiben neutral (0)', () => {
		const baked = buildWechselFeatureCollection(
			fc(2),
			['a', 'b'],
			['Alpha', 'Bravo'],
			new Map([['a', 2]])
		);
		expect(baked.features[0].properties).toEqual({
			gebiet_slug: 'a',
			gebiet_name: 'Alpha',
			wechsel_count: 2,
			farbe: WECHSEL_FARBE_STUFE_2_PLUS
		});
		expect(baked.features[1].properties).toEqual({
			gebiet_slug: 'b',
			gebiet_name: 'Bravo',
			wechsel_count: 0,
			farbe: WECHSEL_NEUTRAL_FARBE
		});
	});
});

describe('WCAG 1.4.11: Kontrast der Wechsel-Farbstufen bei tatsächlicher Karten-Deckkraft', () => {
	it('Neutral<->Stufe-1 UND Stufe-1<->Stufe-2+ erreichen mindestens 3:1 im alpha-geblendeten Rendering', () => {
		const neutral = blendOverBasemap(WECHSEL_NEUTRAL_FARBE, WECHSEL_FILL_OPACITY);
		const stufe1 = blendOverBasemap(WECHSEL_FARBE_STUFE_1, WECHSEL_FILL_OPACITY);
		const stufe2 = blendOverBasemap(WECHSEL_FARBE_STUFE_2_PLUS, WECHSEL_FILL_OPACITY);

		expect(contrastRatio(neutral, stufe1)).toBeGreaterThanOrEqual(3);
		expect(contrastRatio(stufe1, stufe2)).toBeGreaterThanOrEqual(3);
	});
});

describe('buildWechselTableRows', () => {
	it('nur Gebiete mit >=1 Wechsel, sortiert Häufigkeit desc, dann alphabetisch', () => {
		const baked = buildWechselFeatureCollection(
			fc(3),
			['a', 'b', 'c'],
			['Charlie', 'Alpha', 'Bravo'],
			new Map([
				['a', 1],
				['b', 2]
			])
		);
		expect(buildWechselTableRows(baked)).toEqual([
			{ gebiet: 'Alpha', anzahl: 2 },
			{ gebiet: 'Charlie', anzahl: 1 }
		]);
	});
});
