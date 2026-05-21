import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import area from '@turf/area';
import { point } from '@turf/helpers';
import type { Feature, Point, Polygon, MultiPolygon } from 'geojson';

export interface PointCountResult {
	readonly count: number;
	readonly densityPerKm2: number;
}

function readLngLat(f: Feature): [number, number] | null {
	if (f.geometry?.type !== 'Point') return null;
	const c = (f.geometry as Point).coordinates;
	if (!Array.isArray(c) || c.length < 2) return null;
	const [lng, lat] = c;
	if (typeof lng !== 'number' || typeof lat !== 'number') return null;
	return [lng, lat];
}

/**
 * Story 8.2b · Runtime-Count von Point-Features in einem Ziel-Polygon (Kiez/Bezirk).
 * Reuse statt 8.2a-Pre-Aggregat (Point-Layer sind dort bewusst ausgenommen).
 * `densityPerKm2` aus turf-Fläche (m² → km²).
 */
export function countPointsInPolygon(
	pointFeatures: readonly Feature[],
	polygon: Feature<Polygon | MultiPolygon>
): PointCountResult {
	let count = 0;
	for (const f of pointFeatures) {
		const ll = readLngLat(f);
		if (!ll) continue;
		if (booleanPointInPolygon(point(ll), polygon)) count += 1;
	}
	const areaKm2 = area(polygon) / 1_000_000;
	const densityPerKm2 = areaKm2 > 0 ? Math.round((count / areaKm2) * 10) / 10 : 0;
	return { count, densityPerKm2 };
}

/** Berlin-Level: Gesamt-Count über alle Point-Features (kein Polygon-Filter). */
export function countAllPoints(pointFeatures: readonly Feature[]): number {
	let count = 0;
	for (const f of pointFeatures) {
		if (readLngLat(f)) count += 1;
	}
	return count;
}
