import { describe, expect, it } from 'vitest';
import { polygon } from '@turf/helpers';
import type { Feature } from 'geojson';
import { countPointsInPolygon, countAllPoints } from './count-points-in-polygon.js';

const square = polygon([
	[
		[13.0, 52.0],
		[13.1, 52.0],
		[13.1, 52.1],
		[13.0, 52.1],
		[13.0, 52.0]
	]
]);

function pt(lng: number, lat: number): Feature {
	return { type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [lng, lat] } };
}

describe('countPointsInPolygon', () => {
	it('zählt nur Punkte im Polygon', () => {
		const features = [pt(13.05, 52.05), pt(13.02, 52.08), pt(13.5, 52.5)];
		const r = countPointsInPolygon(features, square);
		expect(r.count).toBe(2);
	});

	it('berechnet densityPerKm2 aus turf-Fläche', () => {
		// Dichtes Szenario, damit Dichte (1 Dezimal) nicht auf 0.0 rundet.
		const dense = Array.from({ length: 200 }, (_, i) =>
			pt(13.0 + (i % 20) * 0.004, 52.0 + Math.floor(i / 20) * 0.009)
		);
		const r = countPointsInPolygon(dense, square);
		expect(r.count).toBeGreaterThan(100);
		expect(r.densityPerKm2).toBeGreaterThan(0);
	});

	it('sehr dünne Belegung rundet Dichte auf 0.0 (1-Dezimal-Konvention)', () => {
		expect(countPointsInPolygon([pt(13.05, 52.05)], square).densityPerKm2).toBe(0);
	});

	it('leerer Layer → count 0, density 0, kein Crash', () => {
		const r = countPointsInPolygon([], square);
		expect(r).toEqual({ count: 0, densityPerKm2: 0 });
	});

	it('ignoriert Nicht-Point-Geometrien', () => {
		const r = countPointsInPolygon([square as unknown as Feature, pt(13.05, 52.05)], square);
		expect(r.count).toBe(1);
	});

	it('Punkt außerhalb aller Polygone zählt nicht', () => {
		expect(countPointsInPolygon([pt(13.9, 52.9)], square).count).toBe(0);
	});
});

describe('countAllPoints', () => {
	it('Gesamt-Count über alle Point-Features (Berlin-Level)', () => {
		expect(countAllPoints([pt(13.05, 52.05), pt(13.9, 52.9), pt(11, 48)])).toBe(3);
	});
});
