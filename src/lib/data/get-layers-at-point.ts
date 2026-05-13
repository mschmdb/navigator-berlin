import { LRUCache } from 'lru-cache';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import distance from '@turf/distance';
import { point } from '@turf/helpers';
import type { Feature, LineString, MultiLineString, Point, Polygon, MultiPolygon } from 'geojson';
import type { LayerHit, LayerMetadata } from './types.js';
import { loadManifest } from './manifest.js';
import { fetchLayer } from './internal/layer-fetch.js';
import { getIndex } from './internal/spatial-index.js';
import { isInBerlin } from './constants.js';

const POINT_LAYER_DISTANCE_KM = 0.05;
const LINE_LAYER_DISTANCE_KM = 0.03;

const resultCache = new LRUCache<string, LayerHit[]>({ max: 200 });

export function _resetLayerHitCache(): void {
	resultCache.clear();
}

function inSeason(seasonality: { from: string; to: string }, now: Date = new Date()): boolean {
	const month = now.getUTCMonth() + 1;
	const day = now.getUTCDate();
	const today = `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
	const { from, to } = seasonality;
	if (from <= to) return today >= from && today <= to;
	return today >= from || today <= to;
}

function makeHit(
	layer: LayerMetadata,
	value: unknown,
	reason?: LayerHit['reason']
): LayerHit {
	const hit: LayerHit = {
		layer: layer.slug,
		value,
		source: layer.sourceUrl,
		updatedAt: layer.sourceUpdatedAt ?? layer.fetchedAt,
		license: layer.license
	};
	if (reason) hit.reason = reason;
	return hit;
}

export type PmtilesQueryFn = (slug: string, lng: number, lat: number) => Record<string, unknown> | null;

async function hitForLayer(
	layer: LayerMetadata,
	lat: number,
	lng: number,
	fetchFn: typeof fetch,
	pmtilesQuery?: PmtilesQueryFn
): Promise<LayerHit | null> {
	if (layer.inspectorRelevant === false) return null;
	if (layer.seasonality && !inSeason(layer.seasonality)) {
		return makeHit(layer, null, 'seasonal');
	}
	if (layer.format === 'pmtiles') {
		if (!pmtilesQuery) return null;
		const props = pmtilesQuery(layer.slug, lng, lat);
		if (props) return makeHit(layer, props);
		return makeHit(layer, null, 'no-coverage');
	}

	const fc = await fetchLayer(layer.filename, fetchFn);
	if (!Array.isArray(fc?.features) || fc.features.length === 0) {
		// Defensiv: leere FeatureCollection ODER nicht-GeoJSON-Format (z.B. raw Overpass
		// für stolpersteine/trinkbrunnen, Story 1.3 Pipeline-Bug).
		if (layer.geometryType === 'Point') return null;
		return makeHit(layer, null, 'no-coverage');
	}
	const idx = await getIndex(layer.filename, fetchFn);
	const bboxQuery = {
		minX: lng - 0.001,
		minY: lat - 0.001,
		maxX: lng + 0.001,
		maxY: lat + 0.001
	};
	const candidates = idx.search(bboxQuery);

	if (layer.geometryType === 'Point') {
		for (const cand of candidates) {
			const feat = fc.features[cand.featureIndex] as Feature<Point>;
			const [flng, flat] = feat.geometry.coordinates;
			const km = distance([flng, flat], [lng, lat], { units: 'kilometers' });
			if (km <= POINT_LAYER_DISTANCE_KM) {
				return makeHit(layer, feat.properties);
			}
		}
		return null;
	}

	if (layer.geometryType === 'LineString') {
		// Schienen/Strassen-Layer: vertex-nearest Heuristik (Bbox-Candidates + Punkt-zu-Vertex).
		// Echte Punkt-Linie-Distanz für Phase 2.
		for (const cand of candidates) {
			const feat = fc.features[cand.featureIndex] as Feature<LineString | MultiLineString>;
			const coords =
				feat.geometry.type === 'LineString'
					? feat.geometry.coordinates
					: feat.geometry.coordinates.flat();
			for (const [flng, flat] of coords) {
				const km = distance([flng, flat], [lng, lat], { units: 'kilometers' });
				if (km <= LINE_LAYER_DISTANCE_KM) {
					return makeHit(layer, feat.properties);
				}
			}
		}
		return makeHit(layer, null, 'no-coverage');
	}

	const queryPoint = point([lng, lat]);
	for (const cand of candidates) {
		const feat = fc.features[cand.featureIndex] as Feature<Polygon | MultiPolygon>;
		if (booleanPointInPolygon(queryPoint, feat)) {
			return makeHit(layer, feat.properties);
		}
	}
	return makeHit(layer, null, 'no-coverage');
}

export async function getLayersAtPoint(
	lat: number,
	lng: number,
	fetchFn: typeof fetch = fetch,
	pmtilesQuery?: PmtilesQueryFn
): Promise<LayerHit[]> {
	if (!isInBerlin(lat, lng)) return [];
	// Cache-Key inkludiert pmtilesQuery-Verfügbarkeit, damit PMTiles-Hits nicht
	// gecached werden bevor die Map geladen ist.
	const key = `${lat.toFixed(6)},${lng.toFixed(6)}|${pmtilesQuery ? '1' : '0'}`;
	const cached = resultCache.get(key);
	if (cached) return cached;

	const manifest = await loadManifest(fetchFn);
	const results = await Promise.all(
		manifest.layers.map((layer) => hitForLayer(layer, lat, lng, fetchFn, pmtilesQuery))
	);
	const hits = results.filter((h): h is LayerHit => h !== null);
	resultCache.set(key, hits);
	return hits;
}
