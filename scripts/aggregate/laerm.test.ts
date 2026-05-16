import { describe, it, expect } from 'vitest';
import type { Feature, Polygon } from 'geojson';
import { computeLaermAggregate } from './laerm.js';

function plrPolygon(props: Record<string, unknown>, lon: number, lat: number): Feature<Polygon> {
	return {
		type: 'Feature',
		properties: props,
		geometry: {
			type: 'Polygon',
			coordinates: [
				[
					[lon, lat],
					[lon + 0.1, lat],
					[lon + 0.1, lat + 0.1],
					[lon, lat + 0.1],
					[lon, lat]
				]
			]
		}
	};
}

const bezirk: Feature<Polygon> = {
	type: 'Feature',
	properties: { slug: 'mitte' },
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

describe('computeLaermAggregate (T4.3)', () => {
	it('aggregates ordinal category from PLR features within polygon', () => {
		const features = [
			plrPolygon({ kategorie: 'hoch' }, 1, 1),
			plrPolygon({ kategorie: 'hoch' }, 2, 2),
			plrPolygon({ kategorie: 'mittel' }, 3, 3),
			plrPolygon({ kategorie: 'niedrig' }, 20, 20) // outside bezirk
		];
		const result = computeLaermAggregate(
			{ features, sourceUpdatedAt: '2023-01-01T00:00:00.000Z' },
			bezirk
		);
		expect(result.dominantCategory?.value).toBe('hoch');
		expect(result.dominantCategory?.layer).toBe('laerm-2023');
		expect(result.categoryDistribution?.value.hoch).toBeCloseTo(2 / 3);
		expect(result.categoryDistribution?.value.mittel).toBeCloseTo(1 / 3);
		expect('niedrig' in result.categoryDistribution!.value).toBe(false);
	});

	it('returns null fields when no features within polygon', () => {
		const features = [plrPolygon({ kategorie: 'hoch' }, 50, 50)];
		const result = computeLaermAggregate(
			{ features, sourceUpdatedAt: '2023-01-01T00:00:00.000Z' },
			bezirk
		);
		expect(result.dominantCategory).toBeNull();
		expect(result.categoryDistribution).toBeNull();
	});

	it('attaches sourceUpdatedAt provenance to each non-null value', () => {
		const features = [plrPolygon({ kategorie: 'mittel' }, 5, 5)];
		const result = computeLaermAggregate(
			{ features, sourceUpdatedAt: '2023-06-15T12:00:00.000Z' },
			bezirk
		);
		expect(result.dominantCategory?.sourceUpdatedAt).toBe('2023-06-15T12:00:00.000Z');
		expect(result.categoryDistribution?.sourceUpdatedAt).toBe('2023-06-15T12:00:00.000Z');
	});
});
