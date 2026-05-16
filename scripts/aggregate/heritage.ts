/**
 * Heritage-Aggregat (Story 2.0 T4.10).
 *
 * Zwei Layer:
 * - `denkmal-2024`: Bau-/Garten-Denkmale aus FIS-Broker (MultiPolygon, ~7228
 *   nach Mapshaper-Simplify, ursprünglich ~9553). Memory:
 *   project_simplify_keep_shapes.md (Story 1.25: 20%-Simplify-Profil ohne
 *   keep-shapes eliminiert Slivers; hier mit keep-shapes immer noch ~24%
 *   Feature-Loss). Heritage-Dichte ist damit leicht unterschätzt.
 * - `stolpersteine`: OSM-Punkte. Memory feedback_no_lebenswert relevant für
 *   Naming, hier reiner Count.
 *
 * Aggregat = Counts pro Typ / km².
 */

import type { Feature, Polygon, MultiPolygon } from 'geojson';
import { pointsInPolygon, countPerKm2 } from './spatial.js';
import type { HeritageAggregat } from './types.js';

const SLUG_DENKMAL = 'denkmal-2024';
const SLUG_STOLPER = 'stolpersteine';

export interface HeritageInput {
	readonly denkmalFeatures: ReadonlyArray<Feature>;
	readonly denkmalSourceUpdatedAt: string;
	readonly stolpersteineFeatures: ReadonlyArray<Feature>;
	readonly stolpersteineSourceUpdatedAt: string;
}

export function computeHeritageAggregate(
	input: HeritageInput,
	target: Feature<Polygon | MultiPolygon>,
	areaSquareMeters: number
): HeritageAggregat {
	const dCount = pointsInPolygon(input.denkmalFeatures, target).length;
	const sCount = pointsInPolygon(input.stolpersteineFeatures, target).length;
	const dPerKm2 = countPerKm2(dCount, areaSquareMeters);
	const sPerKm2 = countPerKm2(sCount, areaSquareMeters);
	return {
		denkmalPerKm2:
			dPerKm2 !== null
				? { value: dPerKm2, layer: SLUG_DENKMAL, sourceUpdatedAt: input.denkmalSourceUpdatedAt }
				: null,
		stolpersteinePerKm2:
			sPerKm2 !== null
				? {
						value: sPerKm2,
						layer: SLUG_STOLPER,
						sourceUpdatedAt: input.stolpersteineSourceUpdatedAt
					}
				: null
	};
}
