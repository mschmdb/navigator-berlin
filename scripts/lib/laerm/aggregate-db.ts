import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { point } from '@turf/helpers';
import type { Feature, Polygon, MultiPolygon } from 'geojson';

/**
 * Lärm-dB Per-LOR-Aggregat (Story 10.6b). Ordnet Fassadenpunkte (UTM33) ihrem
 * LOR-Planungsraum zu (Point-in-Polygon mit BBox-Prefilter) und mittelt `ges_den`.
 * Streaming-fähig: Punkte werden einzeln addiert, nur Akkumulatoren im Speicher.
 */
export interface LorBboxEntry {
	plrId: string;
	feature: Feature<Polygon | MultiPolygon>;
	bbox: readonly [number, number, number, number];
}

function polygonBbox(feat: Feature<Polygon | MultiPolygon>): [number, number, number, number] {
	let minX = Infinity;
	let minY = Infinity;
	let maxX = -Infinity;
	let maxY = -Infinity;
	const rings =
		feat.geometry.type === 'Polygon' ? feat.geometry.coordinates : feat.geometry.coordinates.flat();
	for (const ring of rings) {
		for (const [x, y] of ring as [number, number][]) {
			if (x < minX) minX = x;
			if (y < minY) minY = y;
			if (x > maxX) maxX = x;
			if (y > maxY) maxY = y;
		}
	}
	return [minX, minY, maxX, maxY];
}

export function buildLorBboxIndex(
	features: readonly Feature[],
	idFn: (f: Feature) => string
): LorBboxEntry[] {
	const out: LorBboxEntry[] = [];
	for (const f of features) {
		if (f.geometry?.type !== 'Polygon' && f.geometry?.type !== 'MultiPolygon') continue;
		const poly = f as Feature<Polygon | MultiPolygon>;
		out.push({ plrId: idFn(f), feature: poly, bbox: polygonBbox(poly) });
	}
	return out;
}

export function findLorForPoint(
	x: number,
	y: number,
	index: readonly LorBboxEntry[]
): string | null {
	const pt = point([x, y]);
	for (const entry of index) {
		const [minX, minY, maxX, maxY] = entry.bbox;
		if (x < minX || x > maxX || y < minY || y > maxY) continue;
		if (booleanPointInPolygon(pt, entry.feature)) return entry.plrId;
	}
	return null;
}

export class LaermDbAggregator {
	private sums = new Map<string, { sum: number; count: number }>();
	constructor(private readonly index: readonly LorBboxEntry[]) {}

	add(x: number, y: number, gesDen: number | null): void {
		if (gesDen === null || !Number.isFinite(gesDen)) return;
		const plrId = findLorForPoint(x, y, this.index);
		if (!plrId) return;
		const acc = this.sums.get(plrId) ?? { sum: 0, count: 0 };
		acc.sum += gesDen;
		acc.count += 1;
		this.sums.set(plrId, acc);
	}

	result(): Record<string, { dbDenMean: number; count: number }> {
		const out: Record<string, { dbDenMean: number; count: number }> = {};
		for (const [plrId, { sum, count }] of this.sums) {
			out[plrId] = { dbDenMean: Math.round((sum / count) * 10) / 10, count };
		}
		return out;
	}
}
