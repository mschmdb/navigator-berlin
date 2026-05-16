/**
 * Oepnv-Aggregat (Story 2.0 T4.8).
 *
 * Vier Layer-Quellen:
 * - `ubahn-stationen` (Point)
 * - `sbahn-stationen` (Point)
 * - `tram-haltestellen` (Point)
 * - `bus-haltestellen` (Point)
 *
 * Aggregat = Counts pro Typ + Gesamt-Stops/km².
 * Area wird vom Caller geliefert (aus Manifest oder @turf/area).
 */

import type { Feature, Polygon, MultiPolygon } from 'geojson';
import { pointsInPolygon, countPerKm2 } from './spatial.js';
import type { OepnvAggregat } from './types.js';

const SLUGS = {
	ubahn: 'ubahn-stationen',
	sbahn: 'sbahn-stationen',
	tram: 'tram-haltestellen',
	bus: 'bus-haltestellen'
} as const;

export interface OepnvInput {
	readonly ubahnFeatures: ReadonlyArray<Feature>;
	readonly ubahnSourceUpdatedAt: string;
	readonly sbahnFeatures: ReadonlyArray<Feature>;
	readonly sbahnSourceUpdatedAt: string;
	readonly tramFeatures: ReadonlyArray<Feature>;
	readonly tramSourceUpdatedAt: string;
	readonly busFeatures: ReadonlyArray<Feature>;
	readonly busSourceUpdatedAt: string;
}

export function computeOepnvAggregate(
	input: OepnvInput,
	target: Feature<Polygon | MultiPolygon>,
	areaSquareMeters: number
): OepnvAggregat {
	const u = pointsInPolygon(input.ubahnFeatures, target).length;
	const s = pointsInPolygon(input.sbahnFeatures, target).length;
	const t = pointsInPolygon(input.tramFeatures, target).length;
	const b = pointsInPolygon(input.busFeatures, target).length;
	const total = u + s + t + b;
	const density = countPerKm2(total, areaSquareMeters);
	// Determinismus: ältestes sourceUpdatedAt als Composite-Stand für stopsPerKm2
	const composite = [
		input.ubahnSourceUpdatedAt,
		input.sbahnSourceUpdatedAt,
		input.tramSourceUpdatedAt,
		input.busSourceUpdatedAt
	]
		.filter((d): d is string => typeof d === 'string')
		.sort()[0];
	return {
		stopsPerKm2:
			density !== null && composite
				? { value: density, layer: 'oepnv-composite', sourceUpdatedAt: composite }
				: null,
		uBahnCount: { value: u, layer: SLUGS.ubahn, sourceUpdatedAt: input.ubahnSourceUpdatedAt },
		sBahnCount: { value: s, layer: SLUGS.sbahn, sourceUpdatedAt: input.sbahnSourceUpdatedAt },
		tramCount: { value: t, layer: SLUGS.tram, sourceUpdatedAt: input.tramSourceUpdatedAt },
		busCount: { value: b, layer: SLUGS.bus, sourceUpdatedAt: input.busSourceUpdatedAt }
	};
}
