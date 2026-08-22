import { describe, expect, it } from 'vitest';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { featureLabelPoints } from './feature-label-points.js';
import type { Feature, FeatureCollection, Polygon, MultiPolygon } from 'geojson';

function poly(coords: number[][], props: Record<string, unknown> = {}): Feature<Polygon> {
	return {
		type: 'Feature',
		properties: props,
		geometry: { type: 'Polygon', coordinates: [coords] }
	};
}

const square = poly(
	[
		[13.3, 52.5],
		[13.4, 52.5],
		[13.4, 52.6],
		[13.3, 52.6],
		[13.3, 52.5]
	],
	{ value: 62, name: 'Testkiez' }
);

// L-Form: Schwerpunkt der Bounding-Box läge außerhalb der Fläche.
const lShape = poly(
	[
		[0, 0],
		[4, 0],
		[4, 1],
		[1, 1],
		[1, 4],
		[0, 4],
		[0, 0]
	],
	{ value: 10 }
);

describe('featureLabelPoints', () => {
	it('liefert genau einen Punkt pro Feature und trägt die Properties weiter', () => {
		const fc: FeatureCollection = { type: 'FeatureCollection', features: [square] };
		const points = featureLabelPoints(fc);
		expect(points.features).toHaveLength(1);
		expect(points.features[0].geometry.type).toBe('Point');
		expect(points.features[0].properties).toEqual({ value: 62, name: 'Testkiez' });
	});

	it('legt den Punkt ins Innere der Fläche, auch bei konkaven Formen', () => {
		const fc: FeatureCollection = { type: 'FeatureCollection', features: [square, lShape] };
		for (const point of featureLabelPoints(fc).features) {
			const host = point.properties?.value === 62 ? square : lShape;
			expect(booleanPointInPolygon(point.geometry.coordinates as [number, number], host)).toBe(
				true
			);
		}
	});

	it('nutzt bei MultiPolygonen die größte Teilfläche', () => {
		const multi: Feature<MultiPolygon> = {
			type: 'Feature',
			properties: { value: 5 },
			geometry: {
				type: 'MultiPolygon',
				coordinates: [
					[
						[
							[0, 0],
							[0.1, 0],
							[0.1, 0.1],
							[0, 0.1],
							[0, 0]
						]
					],
					[
						[
							[10, 10],
							[12, 10],
							[12, 12],
							[10, 12],
							[10, 10]
						]
					]
				]
			}
		};
		const fc: FeatureCollection = { type: 'FeatureCollection', features: [multi] };
		const [point] = featureLabelPoints(fc).features;
		const [x, y] = point.geometry.coordinates;
		expect(x).toBeGreaterThan(9);
		expect(y).toBeGreaterThan(9);
	});

	it('überspringt Features ohne Polygon-Geometrie', () => {
		const fc: FeatureCollection = {
			type: 'FeatureCollection',
			features: [
				square,
				{ type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [0, 0] } }
			]
		};
		expect(featureLabelPoints(fc).features).toHaveLength(1);
	});
});
