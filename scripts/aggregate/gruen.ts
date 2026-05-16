/**
 * Gruen-Aggregat (Story 2.0 T4.5).
 *
 * Drei Quellen:
 * - `gruenversorgung-2023`: ordinal `kategorie` pro LOR-PLR
 * - `gruenanlagen`: MultiPolygon-Park-Features, Count per Bezirk/BZR
 * - `spielplaetze`: Polygon-Spielplatz-Features, Count per Bezirk/BZR
 */

import type { Feature, Polygon, MultiPolygon } from 'geojson';
import { pointsInPolygon, dominantCategory, categoryDistribution } from './spatial.js';
import type { GruenAggregat } from './types.js';

const SLUG_VERSORGUNG = 'gruenversorgung-2023';
const SLUG_ANLAGEN = 'gruenanlagen';
const SLUG_SPIELPLAETZE = 'spielplaetze';
const PROP = 'kategorie';

export interface GruenInput {
	readonly versorgungFeatures: ReadonlyArray<Feature>;
	readonly versorgungSourceUpdatedAt: string;
	readonly gruenanlagenFeatures: ReadonlyArray<Feature>;
	readonly gruenanlagenSourceUpdatedAt: string;
	readonly spielplaetzeFeatures: ReadonlyArray<Feature>;
	readonly spielplaetzeSourceUpdatedAt: string;
}

export function computeGruenAggregate(
	input: GruenInput,
	target: Feature<Polygon | MultiPolygon>
): GruenAggregat {
	const insideV = pointsInPolygon(input.versorgungFeatures, target);
	const dom = dominantCategory(insideV, PROP);
	const dist = categoryDistribution(insideV, PROP);
	const distSize = Object.keys(dist).length;
	const insideG = pointsInPolygon(input.gruenanlagenFeatures, target);
	const insideS = pointsInPolygon(input.spielplaetzeFeatures, target);
	return {
		dominantVersorgung:
			dom !== null
				? { value: dom, layer: SLUG_VERSORGUNG, sourceUpdatedAt: input.versorgungSourceUpdatedAt }
				: null,
		versorgungDistribution:
			distSize > 0
				? { value: dist, layer: SLUG_VERSORGUNG, sourceUpdatedAt: input.versorgungSourceUpdatedAt }
				: null,
		gruenanlagenCount: {
			value: insideG.length,
			layer: SLUG_ANLAGEN,
			sourceUpdatedAt: input.gruenanlagenSourceUpdatedAt
		},
		spielplaetzeCount: {
			value: insideS.length,
			layer: SLUG_SPIELPLAETZE,
			sourceUpdatedAt: input.spielplaetzeSourceUpdatedAt
		}
	};
}
