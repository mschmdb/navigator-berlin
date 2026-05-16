/**
 * Laerm-Aggregat (Story 2.0 T4.3).
 *
 * Layer `laerm-2023` publiziert ordinal-kategoriale Werte pro LOR-Planungsraum:
 * Property `kategorie ∈ {'hoch', 'mittel', 'niedrig', ...}`. Diese Funktion
 * sammelt alle PLR-Polygone deren Centroid im Ziel-Polygon (Bezirk oder BZR)
 * liegt und berechnet dominanteste Kategorie + Verteilung.
 */

import type { Feature, Polygon, MultiPolygon } from 'geojson';
import { pointsInPolygon, dominantCategory, categoryDistribution } from './spatial.js';
import type { LaermAggregat } from './types.js';

const LAYER_SLUG = 'laerm-2023';
const PROP = 'kategorie';

export interface LaermInput {
	readonly features: ReadonlyArray<Feature>;
	readonly sourceUpdatedAt: string;
}

export function computeLaermAggregate(
	input: LaermInput,
	target: Feature<Polygon | MultiPolygon>
): LaermAggregat {
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
