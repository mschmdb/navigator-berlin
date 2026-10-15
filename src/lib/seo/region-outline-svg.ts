import bbox from '@turf/bbox';
import { featureCollection, feature } from '@turf/helpers';
import type { MultiPolygon, Polygon } from 'geojson';

export interface PolygonLike {
	readonly type: 'Polygon';
	readonly coordinates: readonly (readonly (readonly number[])[])[];
}

export interface MultiPolygonLike {
	readonly type: 'MultiPolygon';
	readonly coordinates: readonly (readonly (readonly (readonly number[])[])[])[];
}

export interface OutlineRegion {
	readonly id: string;
	readonly geometry: PolygonLike | MultiPolygonLike;
}

export interface RegionOutline {
	readonly viewBox: string;
	readonly width: number;
	readonly height: number;
	readonly paths: readonly { readonly id: string; readonly d: string }[];
}

const TARGET_SIZE = 1000;

function rings(geometry: OutlineRegion['geometry']): (readonly (readonly number[])[])[] {
	return geometry.type === 'Polygon' ? [...geometry.coordinates] : geometry.coordinates.flat();
}

const round = (n: number): number => Math.round(n);

/** Toleranz der Vereinfachung in viewBox-Einheiten (1000 = längere Seite). */
export const SIMPLIFY_TOLERANCE = 1.2;

type Pt = readonly [number, number];

function distToSegment(p: Pt, a: Pt, b: Pt): number {
	const dx = b[0] - a[0];
	const dy = b[1] - a[1];
	const len2 = dx * dx + dy * dy;
	if (len2 === 0) return Math.hypot(p[0] - a[0], p[1] - a[1]);
	const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2));
	return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
}

/** Douglas-Peucker auf einem offenen Linienzug; Anfangs- und Endpunkt bleiben. */
export function simplifyLine(points: readonly Pt[], tolerance: number): Pt[] {
	if (points.length < 3) return [...points];
	const keep = new Array<boolean>(points.length).fill(false);
	keep[0] = true;
	keep[points.length - 1] = true;
	const stack: [number, number][] = [[0, points.length - 1]];
	while (stack.length > 0) {
		const [from, to] = stack.pop()!;
		let maxDist = 0;
		let index = -1;
		for (let i = from + 1; i < to; i++) {
			const d = distToSegment(points[i], points[from], points[to]);
			if (d > maxDist) {
				maxDist = d;
				index = i;
			}
		}
		if (index !== -1 && maxDist > tolerance) {
			keep[index] = true;
			stack.push([from, index], [index, to]);
		}
	}
	return points.filter((_, i) => keep[i]);
}

/**
 * Vereinfacht einen Ring (ohne wiederholten Schlusspunkt) und rundet auf ganze
 * Einheiten. Liefert `null`, wenn weniger als 3 Punkte übrig bleiben.
 */
export function simplifyRing(ring: readonly Pt[], tolerance: number): Pt[] | null {
	if (ring.length < 3) return null;
	const closed = simplifyLine([...ring, ring[0]], tolerance).slice(0, -1);
	const pts: Pt[] = [];
	for (const [x, y] of closed) {
		const p: Pt = [round(x), round(y)];
		const last = pts[pts.length - 1];
		if (!last || last[0] !== p[0] || last[1] !== p[1]) pts.push(p);
	}
	const first = pts[0];
	const last = pts[pts.length - 1];
	if (pts.length > 1 && first[0] === last[0] && first[1] === last[1]) pts.pop();
	return pts.length >= 3 ? pts : null;
}

/**
 * Projiziert Polygone aller Regionen gemeinsam in ein SVG-Koordinatensystem
 * (äquirektangulär, Längengrad mit cos der Mittelbreite gestaucht). Längere
 * Seite = 1000 Einheiten. Reine Funktion, läuft im Prerender.
 */
export function buildRegionOutline(regions: readonly OutlineRegion[]): RegionOutline | null {
	const usable = regions.filter((r) => rings(r.geometry).some((ring) => ring.length >= 3));
	if (usable.length === 0) return null;

	const [minLon, minLat, maxLon, maxLat] = bbox(
		featureCollection(usable.map((r) => feature(r.geometry as unknown as Polygon | MultiPolygon)))
	);
	const lonScale = Math.cos((((minLat + maxLat) / 2) * Math.PI) / 180);
	const spanX = (maxLon - minLon) * lonScale;
	const spanY = maxLat - minLat;
	const longest = Math.max(spanX, spanY);
	if (!(longest > 0)) return null;
	const scale = TARGET_SIZE / longest;

	const project = (lon: number, lat: number): Pt => [
		(lon - minLon) * lonScale * scale,
		(maxLat - lat) * scale
	];

	const paths = usable
		.map((r) => {
			const parts: string[] = [];
			for (const ring of rings(r.geometry)) {
				const pts = simplifyRing(
					ring.map(([lon, lat]) => project(lon, lat)),
					SIMPLIFY_TOLERANCE
				);
				if (pts) parts.push(`M${pts.map(([x, y]) => `${x} ${y}`).join('L')}Z`);
			}
			return { id: r.id, d: parts.join('') };
		})
		.filter((p) => p.d !== '');
	if (paths.length === 0) return null;

	const width = round(spanX * scale);
	const height = round(spanY * scale);
	return { viewBox: `0 0 ${width} ${height}`, width, height, paths };
}
