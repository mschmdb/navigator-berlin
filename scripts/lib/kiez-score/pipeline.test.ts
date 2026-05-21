import { describe, expect, it } from 'vitest';
import type { Feature, FeatureCollection, Polygon } from 'geojson';
import {
	buildKiezScoresFromInput,
	buildDerivedLayerGeojsons,
	defaultLorIdFor
} from './pipeline.js';
import { validateKiezScoreOutput } from './output-schema.js';
import type { BuildLayerSpec } from './build-helpers.js';
import type { OepnvStopIndexShape } from './nearest-stops.js';

function makeSquareLor(
	id: string,
	minLng: number,
	minLat: number,
	span = 0.01
): Feature<Polygon> {
	return {
		type: 'Feature',
		properties: { plr_id: id, plr_name: `LOR-${id}` },
		geometry: {
			type: 'Polygon',
			coordinates: [
				[
					[minLng, minLat],
					[minLng + span, minLat],
					[minLng + span, minLat + span],
					[minLng, minLat + span],
					[minLng, minLat]
				]
			]
		}
	};
}

function makeLayer(slug: string, features: Feature[]): BuildLayerSpec {
	return { slug, features };
}

const EMPTY_OEPNV: OepnvStopIndexShape = {
	ubahn: [],
	sbahn: [],
	tram: [],
	bus: []
};

const LAERM_POLYGON: Feature<Polygon> = {
	type: 'Feature',
	properties: { kategorie: 'gering' },
	geometry: {
		type: 'Polygon',
		coordinates: [
			[
				[13.0, 52.0],
				[13.5, 52.0],
				[13.5, 52.5],
				[13.0, 52.5],
				[13.0, 52.0]
			]
		]
	}
};

describe('defaultLorIdFor', () => {
	it('liest plr_id als String', () => {
		const f = makeSquareLor('001001', 13.0, 52.0);
		expect(defaultLorIdFor(f)).toBe('001001');
	});

	it('fällt auf id als String zurück', () => {
		const f: Feature = {
			type: 'Feature',
			properties: { id: 42 },
			geometry: { type: 'Point', coordinates: [13, 52] }
		};
		expect(defaultLorIdFor(f)).toBe('42');
	});

	it('liefert null wenn kein Kandidat-Key trägt einen Wert', () => {
		const f: Feature = {
			type: 'Feature',
			properties: {},
			geometry: { type: 'Point', coordinates: [13, 52] }
		};
		expect(defaultLorIdFor(f)).toBeNull();
	});
});

describe('buildKiezScoresFromInput', () => {
	it('generiert einen Score pro LOR-Polygon', () => {
		const lors: Feature[] = [
			makeSquareLor('A', 13.0, 52.0),
			makeSquareLor('B', 13.1, 52.1),
			makeSquareLor('C', 13.2, 52.2)
		];
		const out = buildKiezScoresFromInput(
			{
				lorFeatures: lors,
				polygonLayers: [],
				presenceLayers: [],
				oepnvIndex: EMPTY_OEPNV
			},
			'2026-05-15T12:00:00.000Z'
		);
		expect(Object.keys(out.scores)).toEqual(['A', 'B', 'C']);
		expect(out.schemaVersion).toBe(1);
		expect(out.generatedAt).toBe('2026-05-15T12:00:00.000Z');
	});

	it('überspringt Features ohne Polygon-Geometrie + ohne LOR-ID', () => {
		const lors: Feature[] = [
			{
				type: 'Feature',
				properties: { plr_id: 'P' },
				geometry: { type: 'Point', coordinates: [13, 52] }
			},
			{
				type: 'Feature',
				properties: {},
				geometry: {
					type: 'Polygon',
					coordinates: [
						[
							[13.0, 52.0],
							[13.01, 52.0],
							[13.01, 52.01],
							[13.0, 52.01],
							[13.0, 52.0]
						]
					]
				}
			},
			makeSquareLor('valid', 13.0, 52.0)
		];
		const out = buildKiezScoresFromInput(
			{ lorFeatures: lors, polygonLayers: [], presenceLayers: [], oepnvIndex: EMPTY_OEPNV },
			'2026-05-15T12:00:00.000Z'
		);
		expect(Object.keys(out.scores)).toEqual(['valid']);
	});

	it('verknüpft Polygon-Layer-Properties mit dem LOR-Centroid', () => {
		const lor = makeSquareLor('001', 13.0, 52.0);
		const out = buildKiezScoresFromInput(
			{
				lorFeatures: [lor],
				polygonLayers: [makeLayer('luft-2023', [LAERM_POLYGON])],
				presenceLayers: [],
				oepnvIndex: EMPTY_OEPNV
			},
			'2026-05-15T12:00:00.000Z'
		);
		const score = out.scores['001'];
		const ruheLuft = score.dimensions.find((d) => d.dimension === 'ruhe-luft');
		expect(ruheLuft?.sources.find((s) => s.layer === 'luft-2023')?.normalizedValue).toBe(100);
	});

	it('injiziert Presence-Layer-Hits in alle Scores', () => {
		const out = buildKiezScoresFromInput(
			{
				lorFeatures: [makeSquareLor('001', 13.0, 52.0)],
				polygonLayers: [],
				presenceLayers: ['radverkehrsnetz-2025'],
				oepnvIndex: EMPTY_OEPNV
			},
			'2026-05-15T12:00:00.000Z'
		);
		const mobility = out.scores['001'].dimensions.find((d) => d.dimension === 'mobilitaet');
		const rad = mobility?.sources.find((s) => s.layer === 'radverkehr-presence');
		expect(rad?.normalizedValue).toBe(100);
	});

	it('Output-Struktur passt das valibot-Schema', () => {
		const out = buildKiezScoresFromInput(
			{
				lorFeatures: [makeSquareLor('001', 13.0, 52.0)],
				polygonLayers: [],
				presenceLayers: [],
				oepnvIndex: EMPTY_OEPNV
			},
			'2026-05-15T12:00:00.000Z'
		);
		expect(() => validateKiezScoreOutput(out)).not.toThrow();
	});

	it('buildDerivedLayerGeojsons erzeugt eine FC pro Kiez-Score-Dimension', () => {
		const lors: Feature[] = [makeSquareLor('A', 13.0, 52.0), makeSquareLor('B', 13.1, 52.1)];
		const out = buildKiezScoresFromInput(
			{ lorFeatures: lors, polygonLayers: [], presenceLayers: [], oepnvIndex: EMPTY_OEPNV },
			'2026-05-15T12:00:00.000Z'
		);
		const derived = buildDerivedLayerGeojsons(lors, out);
		expect(Object.keys(derived).sort()).toEqual([
			'kiez-score-gesamt',
			'kiez-score-gruen-hitze',
			'kiez-score-mobilitaet',
			'kiez-score-ruhe-luft',
			'kiez-score-versorgung',
			'kiez-score-wohnschutz'
		]);
		for (const fc of Object.values(derived)) {
			expect(fc.type).toBe('FeatureCollection');
			expect(fc.features).toHaveLength(2);
			expect(fc.features[0].properties).toHaveProperty('plr_id');
			expect(fc.features[0].properties).toHaveProperty('value');
		}
	});

	it('Mini-Fixture mit 3 LORs + Polygon-Layer + Milieuschutz-Presence erzeugt 3 valide Scores', () => {
		const lors: Feature[] = [
			makeSquareLor('A', 13.0, 52.0),
			makeSquareLor('B', 13.1, 52.0),
			makeSquareLor('C', 13.2, 52.0)
		];
		const out = buildKiezScoresFromInput(
			{
				lorFeatures: lors,
				polygonLayers: [makeLayer('laerm-2023', [LAERM_POLYGON])],
				presenceLayers: ['radverkehrsnetz-2025', 'milieuschutz-erhaltungsmiete'],
				oepnvIndex: EMPTY_OEPNV
			},
			'2026-05-15T12:00:00.000Z'
		);
		expect(Object.keys(out.scores)).toHaveLength(3);
		for (const score of Object.values(out.scores)) {
			const wohnschutz = score.dimensions.find((d) => d.dimension === 'wohnschutz');
			expect(wohnschutz?.value).toBe(100);
		}
		expect(() => validateKiezScoreOutput(out)).not.toThrow();
	});
});
