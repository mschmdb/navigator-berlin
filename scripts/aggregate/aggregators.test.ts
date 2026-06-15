import { describe, it, expect } from 'vitest';
import type { Feature, Polygon } from 'geojson';
import { computeLuftAggregate } from './luft.js';
import { computeGruenAggregate } from './gruen.js';
import { computeKlimaAggregate } from './klima.js';
import { computeWohnenAggregate } from './wohnen.js';
import { computeOepnvAggregate } from './oepnv.js';
import { computeBildungAggregate } from './bildung.js';
import { computeHeritageAggregate } from './heritage.js';

const T0 = '2024-01-01T00:00:00.000Z';

function pt(lon: number, lat: number, props: Record<string, unknown> = {}): Feature {
	return {
		type: 'Feature',
		properties: props,
		geometry: { type: 'Point', coordinates: [lon, lat] }
	};
}

function polyAt(lon: number, lat: number, props: Record<string, unknown> = {}): Feature<Polygon> {
	return {
		type: 'Feature',
		properties: props,
		geometry: {
			type: 'Polygon',
			coordinates: [
				[
					[lon, lat],
					[lon + 0.05, lat],
					[lon + 0.05, lat + 0.05],
					[lon, lat + 0.05],
					[lon, lat]
				]
			]
		}
	};
}

const target: Feature<Polygon> = {
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
const AREA_M2 = 4_000_000; // 4 km² (Beispiel)

describe('luft aggregate (T4.4)', () => {
	it('aggregates ordinal kategorie', () => {
		const features = [polyAt(1, 1, { kategorie: 'mittel' }), polyAt(2, 2, { kategorie: 'hoch' })];
		const r = computeLuftAggregate({ features, sourceUpdatedAt: T0 }, target);
		expect(r.dominantCategory?.layer).toBe('luft-2023');
		expect(Object.keys(r.categoryDistribution!.value).sort()).toEqual(['hoch', 'mittel']);
	});
});

describe('gruen aggregate (T4.5)', () => {
	it('combines versorgung kategorie + counts for anlagen + spielplätze', () => {
		const r = computeGruenAggregate(
			{
				versorgungFeatures: [
					polyAt(1, 1, { kategorie: 'gut' }),
					polyAt(2, 2, { kategorie: 'gut' })
				],
				versorgungSourceUpdatedAt: T0,
				gruenanlagenFeatures: [pt(3, 3), pt(4, 4), pt(50, 50)],
				gruenanlagenSourceUpdatedAt: T0,
				spielplaetzeFeatures: [pt(5, 5)],
				spielplaetzeSourceUpdatedAt: T0
			},
			target
		);
		expect(r.dominantVersorgung?.value).toBe('gut');
		expect(r.gruenanlagenCount?.value).toBe(2);
		expect(r.spielplaetzeCount?.value).toBe(1);
	});
});

describe('klima aggregate (T4.6)', () => {
	it('computes mean PET + share above 38°C', () => {
		const features = [
			polyAt(1, 1, { pet14h: 30 }),
			polyAt(2, 2, { pet14h: 40 }),
			polyAt(3, 3, { pet14h: 50 })
		];
		const r = computeKlimaAggregate({ features, sourceUpdatedAt: T0 }, target);
		expect(r.meanPet?.value).toBeCloseTo(40);
		expect(r.shareSehrHeiss?.value).toBeCloseTo(2 / 3);
	});

	it('returns null when no features inside', () => {
		const features = [polyAt(50, 50, { pet14h: 40 })];
		const r = computeKlimaAggregate({ features, sourceUpdatedAt: T0 }, target);
		expect(r.meanPet).toBeNull();
		expect(r.shareSehrHeiss).toBeNull();
	});
});

describe('wohnen aggregate (T4.7)', () => {
	it('combines wohnlage + mss distributions (mss uses si_v textual status)', () => {
		const r = computeWohnenAggregate(
			{
				wohnlagenFeatures: [pt(1, 1, { wol: 2 }), pt(2, 2, { wol: 2 }), pt(3, 3, { wol: 3 })],
				wohnlagenSourceUpdatedAt: T0,
				mssFeatures: [polyAt(1, 1, { si_v: 'mittel' })],
				mssSourceUpdatedAt: T0
			},
			target
		);
		expect(r.dominantWohnlage?.value).toBe('2');
		expect(r.wohnlageDistribution?.value['2']).toBeCloseTo(2 / 3);
		expect(r.dominantMss?.value).toBe('mittel');
	});
});

describe('oepnv aggregate (T4.8)', () => {
	it('counts stops per type + density per km²', () => {
		const r = computeOepnvAggregate(
			{
				ubahnFeatures: [pt(1, 1)],
				ubahnSourceUpdatedAt: T0,
				sbahnFeatures: [pt(2, 2)],
				sbahnSourceUpdatedAt: T0,
				tramFeatures: [pt(3, 3), pt(50, 50)],
				tramSourceUpdatedAt: T0,
				busFeatures: [pt(4, 4)],
				busSourceUpdatedAt: T0
			},
			target,
			AREA_M2
		);
		expect(r.uBahnCount?.value).toBe(1);
		expect(r.tramCount?.value).toBe(1);
		// 4 stops / 4 km² = 1/km²
		expect(r.stopsPerKm2?.value).toBeCloseTo(1);
	});
});

describe('bildung aggregate (T4.9)', () => {
	it('counts kitas + schulen per km²', () => {
		const r = computeBildungAggregate(
			{
				kitasFeatures: [pt(1, 1), pt(2, 2), pt(50, 50)],
				kitasSourceUpdatedAt: T0,
				schulenFeatures: [pt(3, 3)],
				schulenSourceUpdatedAt: T0
			},
			target,
			AREA_M2
		);
		// 2 kitas / 4 km² = 0.5
		expect(r.kitasPerKm2?.value).toBeCloseTo(0.5);
		expect(r.schulenPerKm2?.value).toBeCloseTo(0.25);
	});
});

describe('heritage aggregate (T4.10)', () => {
	it('counts denkmal + stolpersteine per km²', () => {
		const r = computeHeritageAggregate(
			{
				denkmalFeatures: [pt(1, 1), pt(2, 2)],
				denkmalSourceUpdatedAt: T0,
				stolpersteineFeatures: [pt(3, 3), pt(4, 4), pt(5, 5), pt(50, 50)],
				stolpersteineSourceUpdatedAt: T0
			},
			target,
			AREA_M2
		);
		expect(r.denkmalPerKm2?.value).toBeCloseTo(0.5);
		expect(r.stolpersteinePerKm2?.value).toBeCloseTo(0.75);
	});
});
