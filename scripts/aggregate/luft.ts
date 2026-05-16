/**
 * Luft-Aggregat (Story 2.0 T4.4).
 *
 * Layer `luft-2023` publiziert ordinal-kategoriale Werte pro LOR-Planungsraum
 * (`kategorie ∈ {'hoch', 'mittel', 'niedrig'}`), analog laerm-2023. Aggregat-
 * Schema identisch zu LaermAggregat.
 */

import type { Feature, Polygon, MultiPolygon } from 'geojson';
import { pointsInPolygon, dominantCategory, categoryDistribution } from './spatial.js';
import type { LuftAggregat } from './types.js';

const LAYER_SLUG = 'luft-2023';
const PROP = 'kategorie';

export interface LuftInput {
	readonly features: ReadonlyArray<Feature>;
	readonly sourceUpdatedAt: string;
}

export function computeLuftAggregate(
	input: LuftInput,
	target: Feature<Polygon | MultiPolygon>
): LuftAggregat {
	const inside = pointsInPolygon(input.features, target);
	const dom = dominantCategory(inside, PROP);
	const dist = categoryDistribution(inside, PROP);
	const distSize = Object.keys(dist).length;
	return {
		dominantCategory:
			dom !== null
				? { value: dom, layer: LAYER_SLUG, sourceUpdatedAt: input.sourceUpdatedAt }
				: null,
		categoryDistribution:
			distSize > 0
				? { value: dist, layer: LAYER_SLUG, sourceUpdatedAt: input.sourceUpdatedAt }
				: null
	};
}
