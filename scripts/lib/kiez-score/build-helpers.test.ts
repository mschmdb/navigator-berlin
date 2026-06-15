import { describe, expect, it } from 'vitest';
import type { Feature } from 'geojson';
import {
	buildNearestPointValueHits,
	buildPoiDensityCounts,
	type BuildLayerSpec,
	type PoiIndex
} from './build-helpers.js';

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
					geometry: {
						type: 'Polygon',
						coordinates: [
							[
								[0, 0],
								[0, 1],
								[1, 1],
								[0, 0]
							]
						]
					},
					properties: { pet14h: 99 }
				}
			]
		};
		expect(buildNearestPointValueHits(52.52, 13.4, [polyLayer])).toEqual([]);
	});
});

describe('buildPoiDensityCounts', () => {
	const index: PoiIndex = {
		kita: [
			[13.4, 52.5], // 0 m
			[13.4, 52.503], // ~333 m
			[13.4, 52.51] // ~1112 m (außerhalb 600m)
		]
	};

	it('zählt Punkte im Radius + Distanz zum nächsten', () => {
		const out = buildPoiDensityCounts(52.5, 13.4, index, [{ slug: 'kita', radiusM: 600 }]);
		expect(out.kita.count).toBe(2);
		expect(out.kita.nearestM).toBe(0);
	});

	it('Radius pro Layer konfigurierbar (größerer Radius zählt mehr)', () => {
		const out = buildPoiDensityCounts(52.5, 13.4, index, [{ slug: 'kita', radiusM: 1500 }]);
		expect(out.kita.count).toBe(3);
	});

	it('Layer ohne Centroids → kein Eintrag', () => {
		const out = buildPoiDensityCounts(52.5, 13.4, index, [{ slug: 'fehlt', radiusM: 600 }]);
		expect(out.fehlt).toBeUndefined();
	});

	it('Performance: 3000 Punkte × 542 LOR-Abfragen < 1500ms', () => {
		const big: PoiIndex = {
			x: Array.from({ length: 3000 }, (_, i) => [
				13.3 + (i % 200) * 0.001,
				52.4 + (i % 150) * 0.001
			])
		};
		const start = performance.now();
		for (let i = 0; i < 542; i++) {
			buildPoiDensityCounts(52.5, 13.4, big, [{ slug: 'x', radiusM: 500 }]);
		}
		expect(performance.now() - start).toBeLessThan(1500);
	});
});
