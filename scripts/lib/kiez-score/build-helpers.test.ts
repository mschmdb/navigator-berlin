import { describe, expect, it } from 'vitest';
import type { Feature } from 'geojson';
import { buildNearestPointValueHits, type BuildLayerSpec } from './build-helpers.js';

function pt(lng: number, lat: number, pet14h: number): Feature {
	return {
		type: 'Feature',
		geometry: { type: 'Point', coordinates: [lng, lat] },
		properties: { pet14h }
	};
}

describe('buildNearestPointValueHits', () => {
	const layer: BuildLayerSpec = {
		slug: 'klima-pet-2022',
		features: [pt(13.4, 52.52, 30), pt(13.41, 52.52, 40), pt(13.5, 52.6, 35)]
	};

	it('liefert Properties des nächsten Punktes als Hit', () => {
		const hits = buildNearestPointValueHits(52.52, 13.4, [layer]);
		expect(hits).toHaveLength(1);
		expect(hits[0].layer).toBe('klima-pet-2022');
		expect((hits[0].value as { pet14h: number }).pet14h).toBe(30);
	});

	it('wählt bei anderer Position den anderen nahen Punkt', () => {
		const hits = buildNearestPointValueHits(52.52, 13.409, [layer]);
		expect((hits[0].value as { pet14h: number }).pet14h).toBe(40);
	});

	it('leerer Layer erzeugt keinen Hit, kein Crash', () => {
		expect(buildNearestPointValueHits(52.52, 13.4, [{ slug: 'x', features: [] }])).toEqual([]);
	});

	it('ignoriert Nicht-Punkt-Geometrien', () => {
		const polyLayer: BuildLayerSpec = {
			slug: 'klima-pet-2022',
			features: [
				{
					type: 'Feature',
					geometry: { type: 'Polygon', coordinates: [[[0, 0], [0, 1], [1, 1], [0, 0]]] },
					properties: { pet14h: 99 }
				}
			]
		};
		expect(buildNearestPointValueHits(52.52, 13.4, [polyLayer])).toEqual([]);
	});
});
