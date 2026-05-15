import { describe, expect, it, beforeEach } from 'vitest';
import type { Feature, FeatureCollection, Polygon } from 'geojson';
import {
	_resetKiezScoreCache,
	applyMobilityOverride,
	findLorIdContaining,
	getKiezScore,
	loadKiezScores
} from './get-kiez-score.js';
import { _resetManifestCache } from './manifest.js';
import { computeKiezScore } from '../../../scripts/lib/kiez-score/compute-score.js';
import { buildKiezScoresFromInput } from '../../../scripts/lib/kiez-score/pipeline.js';
import type { KiezScoreOutput } from '../../../scripts/lib/kiez-score/output-schema.js';
import type { Manifest } from './types.js';

function makeSquareLor(id: string, minLng: number, minLat: number, span = 0.01): Feature<Polygon> {
	return {
		type: 'Feature',
		properties: { plr_id: id },
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

function makeManifest(): Manifest {
	return {
		schemaVersion: 1,
		generatedAt: '2026-05-15T12:00:00.000Z',
		layers: [
			{
				slug: 'lor-planungsraum',
				filename: 'lor-planungsraum.deadbeef.geojson',
				sourceUrl: 'https://example.org/lor.geojson',
				fetchedAt: '2026-05-15T12:00:00.000Z',
				license: 'dl-de/zero-2-0',
				sha256: 'a'.repeat(64),
				bundleGroup: 'A: Boundaries',
				zoomThresholds: { min: 11, max: 15 },
				geometryType: 'Polygon',
				featureCount: 2,
				mapRelevant: false,
				inspectorRelevant: false
			}
		]
	};
}

function makeMockFetch(opts: {
	manifest?: Manifest;
	lor?: FeatureCollection;
	scores?: KiezScoreOutput;
}): typeof fetch {
	return (async (input: RequestInfo | URL): Promise<Response> => {
		const url = typeof input === 'string' ? input : input.toString();
		if (url.endsWith('MANIFEST.json')) {
			return new Response(JSON.stringify(opts.manifest ?? makeManifest()), { status: 200 });
		}
		if (url.includes('lor-planungsraum')) {
			return new Response(JSON.stringify(opts.lor ?? { type: 'FeatureCollection', features: [] }), {
				status: 200
			});
		}
		if (url.includes('kiez-scores.json')) {
			return new Response(
				JSON.stringify(
					opts.scores ?? {
						schemaVersion: 1,
						generatedAt: '2026-05-15T12:00:00.000Z',
						scores: {}
					}
				),
				{ status: 200 }
			);
		}
		return new Response('not found', { status: 404 });
	}) as typeof fetch;
}

beforeEach(() => {
	_resetKiezScoreCache();
	_resetManifestCache();
});

describe('findLorIdContaining', () => {
	it('liefert plr_id wenn Punkt im Polygon liegt', () => {
		const lors = [makeSquareLor('001', 13.0, 52.0), makeSquareLor('002', 13.1, 52.0)];
		expect(findLorIdContaining(52.005, 13.005, lors)).toBe('001');
		expect(findLorIdContaining(52.005, 13.105, lors)).toBe('002');
	});

	it('liefert null wenn Punkt außerhalb aller Polygone', () => {
		const lors = [makeSquareLor('001', 13.0, 52.0)];
		expect(findLorIdContaining(54.0, 12.0, lors)).toBeNull();
	});
});

describe('applyMobilityOverride', () => {
	it('überschreibt Mobility-Dim mit exakten Distancen, lässt andere Dim unverändert', () => {
		const baseline = computeKiezScore({
			layerHits: [{ layer: 'laerm-2023', value: { kategorie: 'gering' } }],
			nearestStops: { ubahn: { distanceM: 1000 }, sbahn: null, tram: null, bus: null }
		});
		const overridden = applyMobilityOverride(baseline, {
			nearestStops: {
				ubahn: { distanceM: 200 },
				sbahn: null,
				tram: null,
				bus: null
			}
		});
		const baselineMobility = baseline.dimensions.find((d) => d.dimension === 'mobilitaet');
		const overriddenMobility = overridden.dimensions.find((d) => d.dimension === 'mobilitaet');
		expect(overriddenMobility?.value).not.toBe(baselineMobility?.value);
		expect(overriddenMobility?.value).toBeGreaterThan(baselineMobility?.value ?? 0);
		// Ruhe-Luft unverändert
		const baselineRuhe = baseline.dimensions.find((d) => d.dimension === 'ruhe-luft');
		const overriddenRuhe = overridden.dimensions.find((d) => d.dimension === 'ruhe-luft');
		expect(overriddenRuhe?.value).toBe(baselineRuhe?.value);
	});

	it('erhöht Mobility-Score deutlich wenn Override eine bessere Distance liefert', () => {
		const baseline = computeKiezScore({
			layerHits: [],
			nearestStops: { ubahn: null, sbahn: null, tram: null, bus: null }
		});
		const baselineMob = baseline.dimensions.find((d) => d.dimension === 'mobilitaet');
		expect(baselineMob?.value).toBe(0);
		const overridden = applyMobilityOverride(baseline, {
			nearestStops: {
				ubahn: { distanceM: 100 },
				sbahn: { distanceM: 100 },
				tram: { distanceM: 100 },
				bus: { distanceM: 100 }
			}
		});
		const mob = overridden.dimensions.find((d) => d.dimension === 'mobilitaet');
		expect(mob?.value).toBeGreaterThan(50);
	});
});

describe('loadKiezScores', () => {
	it('lädt + cached den Output', async () => {
		const out: KiezScoreOutput = {
			schemaVersion: 1,
			generatedAt: '2026-05-15T12:00:00.000Z',
			scores: {
				A: {
					persona: 'allgemein',
					dimensions: [],
					missingDimensions: []
				}
			}
		};
		let calls = 0;
		const fetchFn = (async () => {
			calls++;
			return new Response(JSON.stringify(out), { status: 200 });
		}) as typeof fetch;
		await loadKiezScores(fetchFn);
		await loadKiezScores(fetchFn);
		expect(calls).toBe(1);
	});

	it('wirft bei HTTP-Fehler (5xx)', async () => {
		const fetchFn = (async () => new Response('nope', { status: 500 })) as typeof fetch;
		await expect(loadKiezScores(fetchFn)).rejects.toThrow();
	});

	it('liefert leeren Output bei 404 (Pipeline noch nicht gelaufen, kein Hard-Fail)', async () => {
		const fetchFn = (async () => new Response('not found', { status: 404 })) as typeof fetch;
		const out = await loadKiezScores(fetchFn);
		expect(out.scores).toEqual({});
	});
});

describe('getKiezScore', () => {
	it('liefert Score für Adresse in LOR-Polygon', async () => {
		const lors: FeatureCollection = {
			type: 'FeatureCollection',
			features: [makeSquareLor('001', 13.0, 52.0)]
		};
		const buildOut = buildKiezScoresFromInput(
			{
				lorFeatures: lors.features,
				polygonLayers: [],
				presenceLayers: [],
				oepnvIndex: { ubahn: [], sbahn: [], tram: [], bus: [] }
			},
			'2026-05-15T12:00:00.000Z'
		);
		const fetchFn = makeMockFetch({ lor: lors, scores: buildOut });
		const score = await getKiezScore(52.005, 13.005, fetchFn);
		expect(score).not.toBeNull();
		expect(score?.persona).toBe('allgemein');
	});

	it('liefert null wenn Punkt außerhalb aller LOR', async () => {
		const lors: FeatureCollection = {
			type: 'FeatureCollection',
			features: [makeSquareLor('001', 13.0, 52.0)]
		};
		const buildOut: KiezScoreOutput = {
			schemaVersion: 1,
			generatedAt: '2026-05-15T12:00:00.000Z',
			scores: { '001': { persona: 'allgemein', dimensions: [], missingDimensions: [] } }
		};
		const fetchFn = makeMockFetch({ lor: lors, scores: buildOut });
		const score = await getKiezScore(54.0, 12.0, fetchFn);
		expect(score).toBeNull();
	});

	it('wendet Override an wenn übergeben', async () => {
		const lors: FeatureCollection = {
			type: 'FeatureCollection',
			features: [makeSquareLor('001', 13.0, 52.0)]
		};
		const buildOut = buildKiezScoresFromInput(
			{
				lorFeatures: lors.features,
				polygonLayers: [],
				presenceLayers: [],
				oepnvIndex: { ubahn: [], sbahn: [], tram: [], bus: [] }
			},
			'2026-05-15T12:00:00.000Z'
		);
		const fetchFn = makeMockFetch({ lor: lors, scores: buildOut });
		const baseline = await getKiezScore(52.005, 13.005, fetchFn);
		const overridden = await getKiezScore(52.005, 13.005, fetchFn, {
			nearestStops: {
				ubahn: { distanceM: 100 },
				sbahn: null,
				tram: null,
				bus: null
			}
		});
		const baselineMob = baseline?.dimensions.find((d) => d.dimension === 'mobilitaet');
		const overriddenMob = overridden?.dimensions.find((d) => d.dimension === 'mobilitaet');
		expect(overriddenMob?.value).not.toBe(baselineMob?.value);
	});

	it('cached Ergebnis nach erstem Aufruf (gleicher Punkt + Override-Status)', async () => {
		const lors: FeatureCollection = {
			type: 'FeatureCollection',
			features: [makeSquareLor('001', 13.0, 52.0)]
		};
		const buildOut: KiezScoreOutput = {
			schemaVersion: 1,
			generatedAt: '2026-05-15T12:00:00.000Z',
			scores: { '001': { persona: 'allgemein', dimensions: [], missingDimensions: [] } }
		};
		let manifestCalls = 0;
		let lorCalls = 0;
		let scoreCalls = 0;
		const fetchFn = (async (input: RequestInfo | URL) => {
			const url = typeof input === 'string' ? input : input.toString();
			if (url.endsWith('MANIFEST.json')) {
				manifestCalls++;
				return new Response(JSON.stringify(makeManifest()), { status: 200 });
			}
			if (url.includes('lor-planungsraum')) {
				lorCalls++;
				return new Response(JSON.stringify(lors), { status: 200 });
			}
			if (url.includes('kiez-scores.json')) {
				scoreCalls++;
				return new Response(JSON.stringify(buildOut), { status: 200 });
			}
			return new Response('not found', { status: 404 });
		}) as typeof fetch;
		await getKiezScore(52.005, 13.005, fetchFn);
		await getKiezScore(52.005, 13.005, fetchFn);
		expect(lorCalls).toBe(1);
		expect(scoreCalls).toBe(1);
	});
});
