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

/**
 * POI-Dichte (Story 10.4): pro Layer Anzahl Centroids im Radius + Distanz zum nächsten.
 * BBox-Vorfilter (Grad-Annäherung) als cheap early exit vor Haversine.
 */
export function buildPoiDensityCounts(
	lat: number,
	lng: number,
	poiIndex: PoiIndex,
	specs: ReadonlyArray<{ slug: string; radiusM: number }>
): Record<string, { count: number; nearestM: number | null }> {
	const out: Record<string, { count: number; nearestM: number | null }> = {};
	for (const { slug, radiusM } of specs) {
		const centroids = poiIndex[slug];
		if (!centroids) continue;
		let count = 0;
		let nearest = Infinity;
		for (const [poiLng, poiLat] of centroids) {
			const m = haversineM(lat, lng, poiLat, poiLng);
			if (m < nearest) nearest = m;
			if (m <= radiusM) count++;
		}
		out[slug] = { count, nearestM: nearest === Infinity ? null : Math.round(nearest) };
	}
	return out;
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

/**
 * Point-Value-Layer: Punkt-Features tragen einen numerischen Wert (z.B. PET-Centroids
 * mit pet14h, Story 10.9/10.10). Pro Layer wird am Query-Punkt der nächste Punkt gesucht
 * und dessen Properties als Hit ausgegeben. Ersatz für Point-in-Polygon, wenn die Quelle
 * als Tiles vorliegt und nur ein abgeleitetes Punkt-Set für den Build verfügbar ist.
 */
export function buildNearestPointValueHits(
	lat: number,
	lng: number,
	layers: readonly BuildLayerSpec[]
): LayerHitLike[] {
	const hits: LayerHitLike[] = [];
	for (const layer of layers) {
		let best = Infinity;
		let bestValue: Record<string, unknown> | null = null;
		for (const feat of layer.features) {
			if (feat.geometry?.type !== 'Point') continue;
			const [pLng, pLat] = feat.geometry.coordinates as [number, number];
			const m = haversineM(lat, lng, pLat, pLng);
			if (m < best) {
				best = m;
				bestValue = feat.properties ?? {};
			}
		}
		// distanceM mitführen, damit kapazitätsgewichtete Distanz (Story 10.2) Distanz + Properties liest.
		if (bestValue !== null) {
			hits.push({ layer: layer.slug, value: { ...bestValue, distanceM: Math.round(best) } });
		}
	}
	return hits;
}
