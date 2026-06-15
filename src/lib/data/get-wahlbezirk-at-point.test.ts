import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getWahlbezirkAtPoint, getWahlbezirksByYear } from './get-wahlbezirk-at-point.js';
import { _resetManifestCache } from './manifest.js';
import { _resetLayerCache } from './internal/layer-fetch.js';
import { _resetIndexCache } from './internal/spatial-index.js';

const miniManifest = {
	schemaVersion: 1,
	generatedAt: '2026-05-18T17:00:00.000Z',
	layers: [
		{
			slug: 'wahlbezirke-bt25',
			filename: 'wahlbezirke-bt25.deadbeef.geojson',
			sourceUrl: 'https://www.statistik-berlin-brandenburg.de/opendata/RBS_OD_UWB_BT25.zip',
			fetchedAt: '2026-05-18T17:00:00.000Z',
			license: 'dl-de/by-2-0',
			sha256: 'a'.repeat(64),
			bundleGroup: 'H: Wahldaten',
			zoomThresholds: { min: 13, max: 17 },
			geometryType: 'Polygon',
			featureCount: 2,
			inspectorRelevant: true,
			mapRelevant: false
		},
		{
			slug: 'wahlbezirke-ah21',
			filename: 'wahlbezirke-ah21.cafebabe.geojson',
			sourceUrl: 'https://www.statistik-berlin-brandenburg.de/opendata/RBS_OD_UWB_AH21.zip',
			fetchedAt: '2026-05-18T17:00:00.000Z',
			license: 'dl-de/by-2-0',
			sha256: 'b'.repeat(64),
			bundleGroup: 'H: Wahldaten',
			zoomThresholds: { min: 13, max: 17 },
			geometryType: 'Polygon',
			featureCount: 1,
			inspectorRelevant: true,
			mapRelevant: false
		}
	]
};

const bt25Geo = {
	type: 'FeatureCollection',
	features: [
		{
			type: 'Feature',
			geometry: {
				type: 'Polygon',
				coordinates: [
					[
						[13.4, 52.5],
						[13.42, 52.5],
						[13.42, 52.52],
						[13.4, 52.52],
						[13.4, 52.5]
					]
				]
			},
			properties: {
				UWB: '01100',
				UWB3: '100',
				BWB: '011A',
				BWB3: '1A',
				AWK: '0101',
				BEZ: '01',
				BWK: '075'
			}
		},
		{
			type: 'Feature',
			geometry: {
				type: 'Polygon',
				coordinates: [
					[
						[13.42, 52.5],
						[13.44, 52.5],
						[13.44, 52.52],
						[13.42, 52.52],
						[13.42, 52.5]
					]
				]
			},
			properties: {
				UWB: '01101',
				UWB3: '101',
				BWB: '011B',
				BWB3: '1B',
				AWK: '0101',
				BEZ: '01',
				BWK: '075'
			}
		}
	]
};

const ah21Geo = {
	type: 'FeatureCollection',
	features: [
		{
			type: 'Feature',
			geometry: {
				type: 'Polygon',
				coordinates: [
					[
						[13.4, 52.5],
						[13.44, 52.5],
						[13.44, 52.52],
						[13.4, 52.52],
						[13.4, 52.5]
					]
				]
			},
			properties: { UWB: '01200', UWB3: '200', BEZ: '01', BWK: '075', AWK: '0103' }
		}
	]
};

const buildFetchMock = () =>
	vi.fn(async (url: string) => {
		if (url === '/layers/MANIFEST.json')
			return new Response(JSON.stringify(miniManifest), { status: 200 });
		if (url === '/layers/wahlbezirke-bt25.deadbeef.geojson')
			return new Response(JSON.stringify(bt25Geo), { status: 200 });
		if (url === '/layers/wahlbezirke-ah21.cafebabe.geojson')
			return new Response(JSON.stringify(ah21Geo), { status: 200 });
		return new Response('404', { status: 404 });
	});

beforeEach(() => {
	_resetManifestCache();
	_resetLayerCache();
	_resetIndexCache();
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe('getWahlbezirkAtPoint', () => {
	it('returns null for non-Berlin coordinate (Potsdam)', async () => {
		const fn = buildFetchMock();
		const result = await getWahlbezirkAtPoint('bt25', 52.4, 13.06, fn as unknown as typeof fetch);
		expect(result).toBeNull();
	});

	it('returns null for unknown geo-slug', async () => {
		const fn = buildFetchMock();
		const result = await getWahlbezirkAtPoint('bt99', 52.51, 13.41, fn as unknown as typeof fetch);
		expect(result).toBeNull();
	});

	it('returns hit for BT25 fixture polygon 1', async () => {
		const fn = buildFetchMock();
		const result = await getWahlbezirkAtPoint('bt25', 52.51, 13.41, fn as unknown as typeof fetch);
		expect(result).not.toBeNull();
		expect(result?.geoSlug).toBe('wahlbezirke-bt25');
		expect(result?.bezirkCode).toBe('01');
		expect(result?.uwbId).toBe('075-01-100-0');
		expect(result?.properties.uwb).toBe('01100');
		expect(result?.properties.bwk).toBe('075');
	});

	it('returns hit for BT25 fixture polygon 2 (other UWB)', async () => {
		const fn = buildFetchMock();
		const result = await getWahlbezirkAtPoint('bt25', 52.51, 13.43, fn as unknown as typeof fetch);
		expect(result?.uwbId).toBe('075-01-101-0');
	});

	it('returns null for Berlin coord outside any polygon', async () => {
		const fn = buildFetchMock();
		const result = await getWahlbezirkAtPoint('bt25', 52.6, 13.5, fn as unknown as typeof fetch);
		expect(result).toBeNull();
	});

	it('accepts both prefixed and unprefixed geo-slug', async () => {
		const fn = buildFetchMock();
		const a = await getWahlbezirkAtPoint('bt25', 52.51, 13.41, fn as unknown as typeof fetch);
		const b = await getWahlbezirkAtPoint(
			'wahlbezirke-bt25',
			52.51,
			13.41,
			fn as unknown as typeof fetch
		);
		expect(a?.uwbId).toBe(b?.uwbId);
	});
});

describe('getWahlbezirksByYear', () => {
	it('returns empty for non-Berlin', async () => {
		const fn = buildFetchMock();
		const result = await getWahlbezirksByYear(52.4, 13.06, fn as unknown as typeof fetch);
		expect(result).toEqual({});
	});

	it('returns hits for both fixture-layers at Berlin point', async () => {
		const fn = buildFetchMock();
		const result = await getWahlbezirksByYear(52.51, 13.41, fn as unknown as typeof fetch);
		expect(Object.keys(result).sort()).toEqual(['ah21', 'bt25']);
		expect(result.bt25.uwbId).toBe('075-01-100-0');
		expect(result.ah21.uwbId).toBe('075-01-200-0');
	});

	it('returns empty for Berlin coord outside all polygons', async () => {
		const fn = buildFetchMock();
		const result = await getWahlbezirksByYear(52.6, 13.5, fn as unknown as typeof fetch);
		expect(result).toEqual({});
	});
});
