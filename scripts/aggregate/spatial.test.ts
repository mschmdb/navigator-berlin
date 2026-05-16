import { describe, it, expect } from 'vitest';
import type { Feature, Polygon } from 'geojson';
import {
	pointInPolygon,
	pointsInPolygon,
	featureMean,
	shareAbove,
	dominantCategory,
	categoryDistribution,
	countPerKm2,
	countFeaturesInPolygon
} from './spatial.js';

const squarePolygon: Feature<Polygon> = {
	type: 'Feature',
	properties: {},
	geometry: {
		type: 'Polygon',
		coordinates: [
			[
				[0, 0],
				[10, 0],
				[10, 10],
				[0, 10],
				[0, 0]
			]
		]
	}
};

function point(lon: number, lat: number, props: Record<string, unknown> = {}): Feature {
	return {
		type: 'Feature',
		properties: props,
		geometry: { type: 'Point', coordinates: [lon, lat] }
	};
}

describe('spatial helpers (Story 2.0 T4.2)', () => {
	it('pointInPolygon: inside → true, outside → false', () => {
		expect(pointInPolygon([5, 5], squarePolygon)).toBe(true);
		expect(pointInPolygon([15, 5], squarePolygon)).toBe(false);
	});

	it('pointsInPolygon: keeps only inside features', () => {
		const features = [point(5, 5), point(15, 15), point(2, 2)];
		expect(pointsInPolygon(features, squarePolygon)).toHaveLength(2);
	});

	it('featureMean: arithmetic mean of numeric property', () => {
		const features = [point(0, 0, { v: 10 }), point(0, 0, { v: 20 }), point(0, 0, { v: 30 })];
		expect(featureMean(features, 'v')).toBe(20);
	});

	it('featureMean: ignores non-numeric values', () => {
		const features = [point(0, 0, { v: 10 }), point(0, 0, { v: 'nan' }), point(0, 0, {})];
		expect(featureMean(features, 'v')).toBe(10);
	});

	it('featureMean: null when no valid samples', () => {
		expect(featureMean([], 'v')).toBeNull();
		expect(featureMean([point(0, 0, { v: null })], 'v')).toBeNull();
	});

	it('shareAbove: fraction in [0,1]', () => {
		const features = [
			point(0, 0, { db: 70 }),
			point(0, 0, { db: 60 }),
			point(0, 0, { db: 80 }),
			point(0, 0, { db: 50 })
		];
		expect(shareAbove(features, 'db', 65)).toBe(0.5);
	});

	it('dominantCategory: most frequent string', () => {
		const features = [
			point(0, 0, { cat: 'A' }),
			point(0, 0, { cat: 'A' }),
			point(0, 0, { cat: 'B' })
		];
		expect(dominantCategory(features, 'cat')).toBe('A');
	});

	it('dominantCategory: null when no strings', () => {
		expect(dominantCategory([point(0, 0)], 'cat')).toBeNull();
	});

	it('categoryDistribution: normalized counts sum to 1', () => {
		const features = [
			point(0, 0, { cat: 'A' }),
			point(0, 0, { cat: 'A' }),
			point(0, 0, { cat: 'B' }),
			point(0, 0, { cat: 'C' })
		];
		const dist = categoryDistribution(features, 'cat');
		expect(dist.A).toBeCloseTo(0.5);
		expect(dist.B).toBeCloseTo(0.25);
		expect(dist.C).toBeCloseTo(0.25);
		const sum = Object.values(dist).reduce((a, b) => a + b, 0);
		expect(sum).toBeCloseTo(1);
	});

	it('countPerKm2: count divided by km²', () => {
		// 1 km² = 1_000_000 m². 5 features / 2 km² = 2.5/km²
		expect(countPerKm2(5, 2_000_000)).toBe(2.5);
	});

	it('countPerKm2: null for invalid area', () => {
		expect(countPerKm2(5, 0)).toBeNull();
		expect(countPerKm2(5, -1)).toBeNull();
	});

	it('countFeaturesInPolygon: aggregates point-density signal', () => {
		const features = [point(5, 5), point(8, 2), point(50, 50)];
		expect(countFeaturesInPolygon(features, squarePolygon)).toBe(2);
	});
});
