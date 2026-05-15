import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { point } from '@turf/helpers';
import center from '@turf/center';
import type { Feature, Geometry, Polygon, MultiPolygon } from 'geojson';
import type { LayerHitLike } from './types.js';

export interface BuildLayerSpec {
	slug: string;
	features: readonly Feature[];
}

export function buildPolygonLayerHitsAtPoint(
	lat: number,
	lng: number,
	layers: readonly BuildLayerSpec[]
): LayerHitLike[] {
	const hits: LayerHitLike[] = [];
	const queryPoint = point([lng, lat]);
	for (const layer of layers) {
		for (const feat of layer.features) {
			if (feat.geometry.type !== 'Polygon' && feat.geometry.type !== 'MultiPolygon') continue;
			const polygonFeat = feat as Feature<Polygon | MultiPolygon>;
			if (booleanPointInPolygon(queryPoint, polygonFeat)) {
				hits.push({ layer: layer.slug, value: feat.properties ?? null });
				break;
			}
		}
	}
	return hits;
}

/**
 * Presence-Layer (z.B. radverkehrsnetz-2025, fahrradstrassen-2024) sind LineStrings ohne
 * Adress-Hit-Konzept. MVP-Pipeline injiziert deren Berlin-weite Verfügbarkeit als
 * synthetische Hits in alle LOR-Centroids, weil das Netz flächendeckend ausgebaut ist.
 * Per-LOR-Genauigkeit ist Phase-2 (LineString-im-Polygon-Test).
 */
export function buildPresenceLayerHits(presentSlugs: readonly string[]): LayerHitLike[] {
	return presentSlugs.map((slug) => ({ layer: slug, value: { present: true } }));
}

const EARTH_RADIUS_M = 6_371_000;

function toRad(deg: number): number {
	return (deg * Math.PI) / 180;
}

function haversineM(lat1: number, lng1: number, lat2: number, lng2: number): number {
	const dLat = toRad(lat2 - lat1);
	const dLng = toRad(lng2 - lng1);
	const a =
		Math.sin(dLat / 2) ** 2 +
		Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
	return 2 * EARTH_RADIUS_M * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function geometryCentroid(geom: Geometry): [number, number] | null {
	if (geom.type === 'Point') {
		const [lng, lat] = geom.coordinates;
		return typeof lng === 'number' && typeof lat === 'number' ? [lng, lat] : null;
	}
	if (geom.type === 'Polygon' || geom.type === 'MultiPolygon') {
		try {
			const c = center({ type: 'Feature', geometry: geom, properties: {} } as Feature);
			const [lng, lat] = c.geometry.coordinates;
			return [lng, lat];
		} catch {
			return null;
		}
	}
	return null;
}

/**
 * Pre-build flat list of (lng, lat) centroids pro POI-Layer. Mix Point + Polygon-Layer,
 * Polygons collapse zu Bbox-Center. Konsument: nearestPoiDistanceM.
 */
export interface PoiIndex {
	[slug: string]: ReadonlyArray<readonly [number, number]>;
}

export function buildPoiIndex(layers: readonly BuildLayerSpec[]): PoiIndex {
	const out: PoiIndex = {};
	for (const layer of layers) {
		const centroids: Array<[number, number]> = [];
		for (const feat of layer.features) {
			if (!feat.geometry) continue;
			const c = geometryCentroid(feat.geometry);
			if (c) centroids.push(c);
		}
		out[layer.slug] = centroids;
	}
	return out;
}

export function nearestPoiDistanceM(
	lat: number,
	lng: number,
	centroids: ReadonlyArray<readonly [number, number]>
): number | null {
	if (centroids.length === 0) return null;
	let best = Infinity;
	for (const [poiLng, poiLat] of centroids) {
		const m = haversineM(lat, lng, poiLat, poiLng);
		if (m < best) best = m;
	}
	return best === Infinity ? null : Math.round(best);
}

export function buildPoiDistanceHits(
	lat: number,
	lng: number,
	poiIndex: PoiIndex
): LayerHitLike[] {
	const hits: LayerHitLike[] = [];
	for (const [slug, centroids] of Object.entries(poiIndex)) {
		const d = nearestPoiDistanceM(lat, lng, centroids);
		if (d === null) continue;
		hits.push({ layer: slug, value: { distanceM: d } });
	}
	return hits;
}
