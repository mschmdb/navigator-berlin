/**
 * Klima-Aggregat (Story 2.0 T4.6).
 *
 * Layer `klima-pet-2022` publiziert numerischen PET-Wert (°C) pro Block
 * (~16k Features, Property `pet14h`). Aggregat = Mean PET + Anteil Blöcke
 * mit `pet14h > 38°C` (Schwellwert „sehr heiß" per Berliner Klimaanalyse).
 */

import type { Feature, Polygon, MultiPolygon } from 'geojson';
import { pointsInPolygon, featureMean, shareAbove } from './spatial.js';
import type { KlimaAggregat } from './types.js';

const LAYER_SLUG = 'klima-pet-2022';
const PROP = 'pet14h';
const SEHR_HEISS_THRESHOLD_C = 38;

export interface KlimaInput {
	readonly features: ReadonlyArray<Feature>;
	readonly sourceUpdatedAt: string;
}

export function computeKlimaAggregate(
	input: KlimaInput,
	target: Feature<Polygon | MultiPolygon>
): KlimaAggregat {
	const inside = pointsInPolygon(input.features, target);
	const mean = featureMean(inside, PROP);
	const share = shareAbove(inside, PROP, SEHR_HEISS_THRESHOLD_C);
	return {
		meanPet:
			mean !== null
				? { value: mean, layer: LAYER_SLUG, sourceUpdatedAt: input.sourceUpdatedAt }
				: null,
		shareSehrHeiss:
			share !== null
				? { value: share, layer: LAYER_SLUG, sourceUpdatedAt: input.sourceUpdatedAt }
				: null
	};
}
