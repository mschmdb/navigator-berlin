import { describe, it, expect } from 'vitest';
import { dbUwbIdFromGeo, buildKiezMappings } from './kiez-mapper.js';
import type { FeatureCollection, Polygon } from 'geojson';

describe('dbUwbIdFromGeo', () => {
	describe('BTW 21/25 modern format', () => {
		it('matched BTW25 DB-Format aus BT25-Geo', () => {
			const id = dbUwbIdFromGeo({ BWK: '83', BEZ: '09', UWB3: '101', UWB: '09101' }, 'btw25');
			expect(id).toBe('083-09-101-0');
		});

		it('matched BTW21 DB-Format aus AH21-Geo', () => {
			const id = dbUwbIdFromGeo({ BWK: '75', BEZ: '01', UWB3: '100' }, 'btw21');
			expect(id).toBe('075-01-100-0');
		});
	});

	describe('BTW 17 alt-Format', () => {
		it('fügt BEZ+W ein im wahlbezirk-Slot', () => {
			const id = dbUwbIdFromGeo({ BWK: '078', BEZ: '05', UWB3: '221', UWB: '05221' }, 'btw17');
			expect(id).toBe('078-05-05W221-0');
		});
	});

	describe('AGH/BVV 16/21/23 alle gleiches Format ohne suffix', () => {
		it('AGH21 ohne suffix', () => {
			const id = dbUwbIdFromGeo({ BEZ: '01', UWB3: '100' }, 'agh21');
			expect(id).toBe('01W100');
		});

		it('BVV23 ohne suffix', () => {
			const id = dbUwbIdFromGeo({ BEZ: '01', UWB3: '100' }, 'bvv23');
			expect(id).toBe('01W100');
		});

		it('AGH16 ohne suffix', () => {
			const id = dbUwbIdFromGeo({ BEZ: '01', UWB: '100' }, 'agh16');
			expect(id).toBe('01W100');
		});

		it('BVV16 ohne suffix', () => {
			const id = dbUwbIdFromGeo({ BEZ: '01', UWB: '100' }, 'bvv16');
			expect(id).toBe('01W100');
		});
	});

	describe('UWB3-Detection-Fallback', () => {
		it('extrahiert UWB3 aus 5-stelliger UWB wenn UWB3 fehlt', () => {
			const id = dbUwbIdFromGeo({ BWK: '75', BEZ: '01', UWB: '01100' }, 'btw21');
			expect(id).toBe('075-01-100-0');
		});

		it('liest WB-Spalte (AH23 Wahllokale-Format)', () => {
			const id = dbUwbIdFromGeo({ BEZ: '01', WB: '100' }, 'agh23');
			expect(id).toBe('01W100');
		});
	});

	describe('Edge cases', () => {
		it('returns null bei fehlendem BEZ', () => {
			expect(dbUwbIdFromGeo({ UWB3: '100', BWK: '75' }, 'btw25')).toBeNull();
		});

		it('returns null bei BTW ohne BWK', () => {
			expect(dbUwbIdFromGeo({ BEZ: '01', UWB3: '100' }, 'btw25')).toBeNull();
		});

		it('returns null bei unbekanntem wahlSlug', () => {
			expect(dbUwbIdFromGeo({ BEZ: '01', UWB3: '100', BWK: '75' }, 'btw13')).toBeNull();
			expect(dbUwbIdFromGeo({ BEZ: '01', UWB3: '100' }, 'agh11')).toBeNull();
		});
	});
});

describe('buildKiezMappings', () => {
	const lorFc: FeatureCollection<Polygon, { BZR_NAME: string }> = {
		type: 'FeatureCollection',
		features: [
			{
				type: 'Feature',
				geometry: {
					type: 'Polygon',
					coordinates: [
						[
							[13.4, 52.5],
							[13.5, 52.5],
							[13.5, 52.55],
							[13.4, 52.55],
							[13.4, 52.5]
						]
					]
				},
				properties: { BZR_NAME: 'Test Kiez' }
			}
		]
	};

	it('liefert Mapping pro Geo-Feature im Kiez-Polygon', () => {
		const geoFc: FeatureCollection<Polygon, Record<string, unknown>> = {
			type: 'FeatureCollection',
			features: [
				{
					type: 'Feature',
					geometry: {
						type: 'Polygon',
						coordinates: [
							[
								[13.42, 52.52],
								[13.44, 52.52],
								[13.44, 52.54],
								[13.42, 52.54],
								[13.42, 52.52]
							]
						]
					},
					properties: { BWK: '75', BEZ: '01', UWB3: '100' }
				}
			]
		};
		const mappings = buildKiezMappings(geoFc, lorFc, 'btw25');
		expect(mappings).toHaveLength(1);
		expect(mappings[0].dbUwbId).toBe('075-01-100-0');
		expect(mappings[0].kiezSlug).toBe('test-kiez');
	});

	it('skipt Features ausserhalb aller Kiez-Polygone', () => {
		const geoFc: FeatureCollection<Polygon, Record<string, unknown>> = {
			type: 'FeatureCollection',
			features: [
				{
					type: 'Feature',
					geometry: {
						type: 'Polygon',
						coordinates: [
							[
								[14.0, 53.0],
								[14.1, 53.0],
								[14.1, 53.1],
								[14.0, 53.1],
								[14.0, 53.0]
							]
						]
					},
					properties: { BWK: '75', BEZ: '01', UWB3: '999' }
				}
			]
		};
		expect(buildKiezMappings(geoFc, lorFc, 'btw25')).toHaveLength(0);
	});

	it('dedupliziert gleiche DB-uwbIds', () => {
		const geoFc: FeatureCollection<Polygon, Record<string, unknown>> = {
			type: 'FeatureCollection',
			features: [
				{
					type: 'Feature',
					geometry: {
						type: 'Polygon',
						coordinates: [
							[
								[13.42, 52.52],
								[13.43, 52.52],
								[13.43, 52.53],
								[13.42, 52.53],
								[13.42, 52.52]
							]
						]
					},
					properties: { BWK: '75', BEZ: '01', UWB3: '100' }
				},
				{
					type: 'Feature',
					geometry: {
						type: 'Polygon',
						coordinates: [
							[
								[13.43, 52.52],
								[13.44, 52.52],
								[13.44, 52.53],
								[13.43, 52.53],
								[13.43, 52.52]
							]
						]
					},
					properties: { BWK: '75', BEZ: '01', UWB3: '100' }
				}
			]
		};
		expect(buildKiezMappings(geoFc, lorFc, 'btw25')).toHaveLength(1);
	});
});
