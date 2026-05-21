import { describe, expect, it } from 'vitest';
import { polygon } from '@turf/helpers';
import area from '@turf/area';
import type { Feature } from 'geojson';
import {
	collectPlrValues,
	collectSpatialPointValues,
	collectIntersectArea,
	buildSpatialTargets,
	type TargetPolygon
} from './member-assignment.js';
import type { LorHierarchy } from '../kiez-score/lor-hierarchy.js';

const hierarchy: LorHierarchy = {
	bezirksregionen: [
		{
			bzrId: '011001',
			name: 'Tiergarten',
			slug: 'tiergarten',
			bezirkSlug: 'mitte',
			areaM2: 1000,
			planungsraeume: [
				{ plrId: '01100101', bez: '01', areaM2: 500 },
				{ plrId: '01100102', bez: '01', areaM2: 500 }
			]
		}
	],
	bezirke: [
		{
			slug: 'mitte',
			name: 'Mitte',
			bezCode: '01',
			planungsraeume: [
				{ plrId: '01100101', bez: '01', areaM2: 500 },
				{ plrId: '01100102', bez: '01', areaM2: 500 }
			]
		}
	]
};

function plrFeature(plrId: string, kategorie: string): Feature {
	return {
		type: 'Feature',
		properties: { plr_id: plrId, kategorie },
		geometry: { type: 'Point', coordinates: [13.4, 52.5] }
	};
}

describe('collectPlrValues', () => {
	it('mappt PLR-Werte auf Kiez/Bezirk/Berlin via Hierarchie', () => {
		const features = [plrFeature('01100101', 'hoch'), plrFeature('01100102', 'gering')];
		const r = collectPlrValues(features, 'kategorie', hierarchy);
		expect(r.kiez.get('tiergarten')).toEqual(['hoch', 'gering']);
		expect(r.bezirk.get('mitte')).toEqual(['hoch', 'gering']);
		expect(r.berlin.sort()).toEqual(['gering', 'hoch']);
	});

	it('fehlender PLR-Wert → null im Member-Array', () => {
		const r = collectPlrValues([plrFeature('01100101', 'hoch')], 'kategorie', hierarchy);
		expect(r.kiez.get('tiergarten')).toEqual(['hoch', null]);
	});
});

const squareA = polygon([
	[
		[13.0, 52.0],
		[13.1, 52.0],
		[13.1, 52.1],
		[13.0, 52.1],
		[13.0, 52.0]
	]
]);
const squareB = polygon([
	[
		[13.2, 52.0],
		[13.3, 52.0],
		[13.3, 52.1],
		[13.2, 52.1],
		[13.2, 52.0]
	]
]);

const targets: TargetPolygon[] = [
	{ slug: 'a', feature: squareA, areaM2: 1 },
	{ slug: 'b', feature: squareB, areaM2: 1 }
];

describe('collectSpatialPointValues', () => {
	it('ordnet Source-Feature per Repräsentativ-Punkt dem enthaltenden Ziel zu', () => {
		const src: Feature[] = [
			{
				type: 'Feature',
				properties: { pet14h: 30 },
				geometry: { type: 'Point', coordinates: [13.05, 52.05] }
			},
			{
				type: 'Feature',
				properties: { pet14h: 40 },
				geometry: { type: 'Point', coordinates: [13.25, 52.05] }
			}
		];
		const r = collectSpatialPointValues(src, 'pet14h', targets);
		expect(r.get('a')).toEqual([30]);
		expect(r.get('b')).toEqual([40]);
	});
});

describe('collectIntersectArea', () => {
	it('summiert Intersect-Fläche je Ziel (überlappendes Source-Polygon)', () => {
		// Source überlappt die linke Hälfte von squareA.
		const src = [
			polygon([
				[
					[13.0, 52.0],
					[13.05, 52.0],
					[13.05, 52.1],
					[13.0, 52.1],
					[13.0, 52.0]
				]
			])
		];
		const r = collectIntersectArea(src, targets);
		const hitA = r.get('a')!;
		expect(hitA).toBeGreaterThan(0);
		// nur halbe Breite → kleiner als volle squareA-Fläche.
		expect(hitA).toBeLessThan(area(squareA));
		expect(r.get('b')).toBe(0);
	});
});

describe('buildSpatialTargets', () => {
	it('baut Kiez/Bezirk-Targets mit Hierarchie-Slugs + Berlin-Fläche', () => {
		const brFeatures: Feature[] = [
			{ type: 'Feature', properties: { BZR_ID: '011001' }, geometry: squareA.geometry }
		];
		const bezFeatures: Feature[] = [
			{
				type: 'Feature',
				properties: { Gemeinde_name: 'Mitte' },
				geometry: squareA.geometry
			}
		];
		const t = buildSpatialTargets(brFeatures, bezFeatures, hierarchy);
		expect(t.kiez[0].slug).toBe('tiergarten');
		expect(t.bezirk[0].slug).toBe('mitte');
		expect(t.berlinAreaM2).toBeGreaterThan(0);
	});
});
