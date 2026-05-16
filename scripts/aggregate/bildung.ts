/**
 * Bildung-Aggregat (Story 2.0 T4.9).
 *
 * Zwei Layer:
 * - `kitas-2024` (Point)
 * - `schulen-2024` (Point)
 *
 * Count per km² als Bildungs-Dichte-Signal.
 */

import type { Feature, Polygon, MultiPolygon } from 'geojson';
import { pointsInPolygon, countPerKm2 } from './spatial.js';
import type { BildungAggregat } from './types.js';

const SLUG_KITAS = 'kitas-2024';
const SLUG_SCHULEN = 'schulen-2024';

export interface BildungInput {
	readonly kitasFeatures: ReadonlyArray<Feature>;
	readonly kitasSourceUpdatedAt: string;
	readonly schulenFeatures: ReadonlyArray<Feature>;
	readonly schulenSourceUpdatedAt: string;
}

export function computeBildungAggregate(
	input: BildungInput,
	target: Feature<Polygon | MultiPolygon>,
	areaSquareMeters: number
): BildungAggregat {
	const kCount = pointsInPolygon(input.kitasFeatures, target).length;
	const sCount = pointsInPolygon(input.schulenFeatures, target).length;
	const kPerKm2 = countPerKm2(kCount, areaSquareMeters);
	const sPerKm2 = countPerKm2(sCount, areaSquareMeters);
	return {
		kitasPerKm2:
			kPerKm2 !== null
				? { value: kPerKm2, layer: SLUG_KITAS, sourceUpdatedAt: input.kitasSourceUpdatedAt }
				: null,
		schulenPerKm2:
			sPerKm2 !== null
				? { value: sPerKm2, layer: SLUG_SCHULEN, sourceUpdatedAt: input.schulenSourceUpdatedAt }
				: null
	};
}
