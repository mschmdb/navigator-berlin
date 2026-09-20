import { describe, expect, it } from 'vitest';
import type { Feature, FeatureCollection, Polygon } from 'geojson';
import { computeBounds, buildProjection, pathD } from './geo-svg.js';

function polygonFeature(coords: [number, number][]): Feature<Polygon> {
	return {
		type: 'Feature',
		properties: {},
		geometry: { type: 'Polygon', coordinates: [coords] }
	};
}

function fc(features: Feature[]): FeatureCollection {
	return { type: 'FeatureCollection', features };
}

describe('computeBounds', () => {
	it('berechnet die Bounding-Box über alle Features/Ringe/Punkte', () => {
		const collection = fc([
			polygonFeature([
				[13.0, 52.4],
				[13.0, 52.5],
				[13.1, 52.5],
				[13.0, 52.4]
			]),
			polygonFeature([
				[13.5, 52.3],
				[13.5, 52.6],
				[13.6, 52.6],
				[13.5, 52.3]
			])
		]);
		expect(computeBounds(collection)).toEqual({
			minLng: 13.0,
			minLat: 52.3,
			maxLng: 13.6,
			maxLat: 52.6
		});
	});

	it('wirft nicht bei einer leeren FeatureCollection, liefert eine degenerierte Box', () => {
		expect(() => computeBounds(fc([]))).not.toThrow();
	});
});

describe('buildProjection Seitenverhältnis (Live-Bug-Report 20.09.: Achse kollabierte auf einen Strich)', () => {
	// Reale Berlin-Bounding-Box (OSM-Näherung): Lng 13,088-13,761 (0,673°),
	// Lat 52,338-52,675 (0,337°) -- rohe Grad-Spanne ist ~2:1 breit zu hoch,
	// Web-Mercator staucht die Lng-Achse an dieser Breite (Sekans-Faktor
	// ~1,63) zusätzlich, das winkeltreue Ergebnis liegt bei ~0,8 (höher als
	// die rohe Grad-Spanne vermuten lässt, aber klar unter 1 -- niemals nahe
	// 0 (Achsen-Kollaps) oder nahe unendlich (Achsen-Vertauschung)).
	const BERLIN_BOUNDS = { minLng: 13.088, minLat: 52.338, maxLng: 13.761, maxLat: 52.675 };

	it('behält das reale Seitenverhältnis der Bounds bei (Berlin-Bounding-Box)', () => {
		const projection = buildProjection(BERLIN_BOUNDS, { width: 220, height: 220, padding: 4 })!;

		const [xTopLeft, yTopLeft] = projection.project(BERLIN_BOUNDS.minLng, BERLIN_BOUNDS.maxLat);
		const [xBottomRight, yBottomRight] = projection.project(
			BERLIN_BOUNDS.maxLng,
			BERLIN_BOUNDS.minLat
		);
		const projectedWidth = xBottomRight - xTopLeft;
		const projectedHeight = yBottomRight - yTopLeft;

		expect(projectedWidth).toBeGreaterThan(0);
		expect(projectedHeight).toBeGreaterThan(0);
		const ratio = projectedHeight / projectedWidth;
		expect(ratio).toBeGreaterThan(0.4);
		expect(ratio).toBeLessThan(0.9);
	});

	it('kollabiert NICHT auf eine horizontale Linie (Regression: Grad/Radiant-Einheiten-Mix zwischen x und y)', () => {
		const projection = buildProjection(BERLIN_BOUNDS, { width: 220, height: 220, padding: 4 })!;
		const [, yTop] = projection.project(13.4, BERLIN_BOUNDS.maxLat);
		const [, yBottom] = projection.project(13.4, BERLIN_BOUNDS.minLat);
		// Bei kollabierter y-Achse läge die gesamte Höhen-Spanne im Sub-Pixel-
		// Bereich; hier muss sie einen nennenswerten Anteil der viewBox nutzen.
		expect(yBottom - yTop).toBeGreaterThan(50);
	});
});

describe('buildProjection', () => {
	it('projiziert die Bounds-Ecken auf den Padding-Rand der viewBox (breite Bounds, x ist die bindende Achse)', () => {
		// Lng-Spanne (1°) bleibt in Mercator-Radiant klar über der Lat-Spanne
		// (0,1°) -- x ist damit bewusst die bindende (den Padding-Rand
		// berührende) Achse, unabhängig vom echten Seitenverhältnis der Fläche.
		const bounds = { minLng: 13.0, minLat: 52.45, maxLng: 14.0, maxLat: 52.55 };
		const projection = buildProjection(bounds, { width: 200, height: 200, padding: 4 })!;
		const [xMin] = projection.project(bounds.minLng, bounds.minLat);
		expect(xMin).toBeCloseTo(4, 1);
		// Norden (maxLat) liegt oben (kleineres y) -- Web-Mercator-y-Achse invertiert.
		const [, yAtMaxLat] = projection.project(13.5, bounds.maxLat);
		const [, yAtMinLat] = projection.project(13.5, bounds.minLat);
		expect(yAtMaxLat).toBeLessThan(yAtMinLat);
	});

	it('ist deterministisch: gleiche Eingabe liefert exakt dieselben Koordinaten', () => {
		const bounds = { minLng: 13.0, minLat: 52.4, maxLng: 13.2, maxLat: 52.6 };
		const p1 = buildProjection(bounds, { width: 300, height: 300 })!;
		const p2 = buildProjection(bounds, { width: 300, height: 300 })!;
		expect(p1.project(13.1, 52.5)).toEqual(p2.project(13.1, 52.5));
	});

	it('liefert null für eine punktförmige Bounding-Box (beide Achsen ohne Ausdehnung) statt eines Explosions-Scales (EC-11 Guard)', () => {
		const bounds = { minLng: 13.0, minLat: 52.5, maxLng: 13.0, maxLat: 52.5 };
		expect(buildProjection(bounds, { width: 100, height: 100 })).toBeNull();
	});

	it('liefert null für die degenerierte 0-Box einer leeren FeatureCollection (EC-11 Guard)', () => {
		const bounds = computeBounds(fc([]));
		expect(buildProjection(bounds, { width: 100, height: 100 })).toBeNull();
	});

	it('kollabiert NICHT auf null, wenn nur eine Achse eine minimale (aber reale) Spanne hat', () => {
		const bounds = { minLng: 13.0, minLat: 52.4, maxLng: 13.0, maxLat: 52.5 };
		expect(buildProjection(bounds, { width: 100, height: 100 })).not.toBeNull();
	});
});

describe('pathD', () => {
	it('erzeugt einen geschlossenen SVG-Pfad-String pro Ring', () => {
		const bounds = { minLng: 13.0, minLat: 52.4, maxLng: 13.1, maxLat: 52.5 };
		const projection = buildProjection(bounds, { width: 100, height: 100 })!;
		const feature = polygonFeature([
			[13.0, 52.4],
			[13.0, 52.5],
			[13.1, 52.5],
			[13.0, 52.4]
		]);
		const d = pathD(feature, projection);
		expect(d.startsWith('M')).toBe(true);
		expect(d.endsWith('Z')).toBe(true);
	});

	it('ist deterministisch für dieselbe Projektion/Feature-Kombination', () => {
		const bounds = { minLng: 13.0, minLat: 52.4, maxLng: 13.1, maxLat: 52.5 };
		const projection = buildProjection(bounds, { width: 100, height: 100 })!;
		const feature = polygonFeature([
			[13.0, 52.4],
			[13.0, 52.5],
			[13.1, 52.5],
			[13.0, 52.4]
		]);
		expect(pathD(feature, projection)).toBe(pathD(feature, projection));
	});

	it('rendert MultiPolygon als mehrere Teilpfade in einem d-String', () => {
		const bounds = { minLng: 13.0, minLat: 52.4, maxLng: 13.1, maxLat: 52.5 };
		const projection = buildProjection(bounds, { width: 100, height: 100 })!;
		const feature: Feature = {
			type: 'Feature',
			properties: {},
			geometry: {
				type: 'MultiPolygon',
				coordinates: [
					[
						[
							[13.0, 52.4],
							[13.0, 52.45],
							[13.05, 52.45],
							[13.0, 52.4]
						]
					],
					[
						[
							[13.05, 52.45],
							[13.05, 52.5],
							[13.1, 52.5],
							[13.05, 52.45]
						]
					]
				]
			}
		};
		const d = pathD(feature, projection);
		expect(d.match(/M/g)?.length).toBe(2);
	});
});
