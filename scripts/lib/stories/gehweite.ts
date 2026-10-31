import RBush from 'rbush';
import bbox from '@turf/bbox';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { point } from '@turf/helpers';
import type { Feature, MultiPolygon, Polygon } from 'geojson';

/** Luftlinie zur naechsten Haltestelle, die als "zu Fuss erreichbar" zaehlt. */
export const STOP_RADIUS_M = 400;

export interface XY {
	readonly x: number;
	readonly y: number;
}

/** Haltestellen im Raster mit Zellgroesse = Radius (EPSG:3035-Meter). */
export type StopGrid = Map<string, XY[]>;

function key(cx: number, cy: number): string {
	return `${cx}:${cy}`;
}

export function buildStopGrid(stops: readonly XY[]): StopGrid {
	const grid: StopGrid = new Map();
	for (const s of stops) {
		const k = key(Math.floor(s.x / STOP_RADIUS_M), Math.floor(s.y / STOP_RADIUS_M));
		const bucket = grid.get(k);
		if (bucket) bucket.push(s);
		else grid.set(k, [s]);
	}
	return grid;
}

/** Prueft die 3x3 Nachbarzellen. Genau 400 m zaehlen mit. */
export function hasStopWithin(grid: StopGrid, x: number, y: number): boolean {
	const cx = Math.floor(x / STOP_RADIUS_M);
	const cy = Math.floor(y / STOP_RADIUS_M);
	const r2 = STOP_RADIUS_M * STOP_RADIUS_M;
	for (let dx = -1; dx <= 1; dx++) {
		for (let dy = -1; dy <= 1; dy++) {
			const bucket = grid.get(key(cx + dx, cy + dy));
			if (!bucket) continue;
			for (const s of bucket) {
				const ddx = s.x - x;
				const ddy = s.y - y;
				if (ddx * ddx + ddy * ddy <= r2) return true;
			}
		}
	}
	return false;
}

interface IndexItem {
	minX: number;
	minY: number;
	maxX: number;
	maxY: number;
	idx: number;
}

/** Liefert eine Funktion Zelle (EPSG:3035) -> PLR_ID per Point-in-Polygon, Grenzpunkte zaehlen. */
export function createPlrLocator(
	plrFeatures: readonly Feature<Polygon | MultiPolygon>[],
	project: (x: number, y: number) => [number, number]
): (x: number, y: number) => string | null {
	const ids = plrFeatures.map((f) => {
		const id = (f.properties ?? {})['PLR_ID'];
		if (typeof id !== 'string') throw new Error('Planungsraum ohne PLR_ID');
		return id;
	});
	const tree = new RBush<IndexItem>();
	tree.load(
		plrFeatures.map((f, idx) => {
			const [minX, minY, maxX, maxY] = bbox(f);
			return { minX, minY, maxX, maxY, idx };
		})
	);
	return (x, y) => {
		const [lon, lat] = project(x, y);
		const pt = point([lon, lat]);
		const hit = tree
			.search({ minX: lon, minY: lat, maxX: lon, maxY: lat })
			.find((c) => booleanPointInPolygon(pt, plrFeatures[c.idx]));
		return hit ? ids[hit.idx] : null;
	};
}

export interface GehweiteSumme {
	einwohner: number;
	mitHaltestelle: number;
}

export interface GehweiteResult {
	readonly byPlr: Map<string, GehweiteSumme>;
	/** Zellen ausserhalb aller Planungsraeume und ihre Einwohner. */
	readonly outside: number;
	readonly outsideEinwohner: number;
}

export function accumulateGehweite(
	cells: readonly (XY & { einwohner: number })[],
	plrFeatures: readonly Feature<Polygon | MultiPolygon>[],
	project: (x: number, y: number) => [number, number],
	grid: StopGrid
): GehweiteResult {
	const locate = createPlrLocator(plrFeatures, project);
	const byPlr = new Map<string, GehweiteSumme>();
	let outside = 0;
	let outsideEinwohner = 0;
	for (const cell of cells) {
		const id = locate(cell.x, cell.y);
		if (id === null) {
			outside++;
			outsideEinwohner += cell.einwohner;
			continue;
		}
		const sum = byPlr.get(id) ?? { einwohner: 0, mitHaltestelle: 0 };
		sum.einwohner += cell.einwohner;
		if (hasStopWithin(grid, cell.x, cell.y)) sum.mitHaltestelle += cell.einwohner;
		byPlr.set(id, sum);
	}
	return { byPlr, outside, outsideEinwohner };
}
