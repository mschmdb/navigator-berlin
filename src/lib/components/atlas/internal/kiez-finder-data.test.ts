import { describe, expect, it } from 'vitest';
import type { FeatureCollection } from 'geojson';
import { buildParteiMetric, buildSbahnMetric, buildScoreMetric } from './kiez-finder-data.js';

const square = (id: string, x: number): GeoJSON.Feature => ({
	type: 'Feature',
	properties: { PLR_ID: id, PLR_NAME: id },
	geometry: {
		type: 'Polygon',
		coordinates: [
			[
				[x, 52.5],
				[x + 0.01, 52.5],
				[x + 0.01, 52.51],
				[x, 52.51],
				[x, 52.5]
			]
		]
	}
});

describe('buildScoreMetric', () => {
	it('mappt value 0..100 auf 0..1 je plr_id', () => {
		const fc = {
			type: 'FeatureCollection',
			features: [
				{ type: 'Feature', properties: { plr_id: 'a', value: 69.3 }, geometry: null },
				{ type: 'Feature', properties: { plr_id: 'b', value: 0 }, geometry: null },
				{ type: 'Feature', properties: { plr_id: 'c' }, geometry: null }
			]
		} as unknown as FeatureCollection;
		const m = buildScoreMetric(fc);
		expect(m.get('a')).toBeCloseTo(0.693, 5);
		expect(m.get('b')).toBe(0);
		expect(m.has('c')).toBe(false);
	});
});

describe('buildSbahnMetric', () => {
	it('nahe Fläche fittet 1, ferne 0', () => {
		const plrFc = {
			type: 'FeatureCollection',
			features: [square('nah', 13.3), square('fern', 14.4)]
		} as FeatureCollection;
		const stations = {
			type: 'FeatureCollection',
			features: [
				{
					type: 'Feature',
					properties: {},
					geometry: { type: 'Point', coordinates: [13.305, 52.505] }
				}
			]
		} as FeatureCollection;
		const m = buildSbahnMetric(plrFc, stations);
		expect(m.get('nah')).toBe(1);
		expect(m.get('fern')).toBe(0);
	});

	it('ohne Stationen bleibt die Map leer (Kriterium neutral)', () => {
		const plrFc = {
			type: 'FeatureCollection',
			features: [square('a', 13.3)]
		} as FeatureCollection;
		expect(buildSbahnMetric(plrFc, { type: 'FeatureCollection', features: [] }).size).toBe(0);
	});
});

describe('buildParteiMetric', () => {
	it('normalisiert Anteile über das stadtweite Maximum und spiegelt BZR auf PLR', () => {
		const shares = [
			{ bzrId: '011001', partei: 'CDU', anteil: 0.2 },
			{ bzrId: '011002', partei: 'CDU', anteil: 0.4 },
			{ bzrId: '011001', partei: 'SPD', anteil: 0.3 }
		];
		const plrIds = ['01100101', '01100201', '01100202'];
		const m = buildParteiMetric(shares, plrIds, 'CDU');
		expect(m.get('01100101')).toBeCloseTo(0.5, 5);
		expect(m.get('01100201')).toBe(1);
		expect(m.get('01100202')).toBe(1);
	});

	it('unbekannte Partei ergibt leere Map', () => {
		expect(buildParteiMetric([], ['01100101'], 'CDU').size).toBe(0);
	});
});
