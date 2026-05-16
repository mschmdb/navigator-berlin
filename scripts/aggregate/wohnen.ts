/**
 * Wohnen-Aggregat (Story 2.0 T4.7).
 *
 * Zwei Quellen:
 * - `wohnlagen-2024`: ~400k Adress-Punkte mit Property `wol` (Wohnlage-Code,
 *   typisch 1-5). Dominante Lage + Verteilung über Adresse-Counts.
 * - `mss-gesamtindex-2025`: 542 LOR-PLR-Polygone mit `si_v` (MSS-Status-Text:
 *   sehr niedrig / niedrig / mittel / hoch). `sdi_n` (1-99-Composite-Score)
 *   ist NICHT die kategorische Quelle und führt zu „unbekannt"-Bucket im
 *   Steckbrief; `si_v` ist die offizielle Status-Klasse (Story 1.30).
 */

import type { Feature, Polygon, MultiPolygon } from 'geojson';
import { pointsInPolygon, dominantCategory, categoryDistribution } from './spatial.js';
import type { WohnenAggregat } from './types.js';

const SLUG_WOHNLAGEN = 'wohnlagen-2024';
const SLUG_MSS = 'mss-gesamtindex-2025';
const PROP_WOL = 'wol';
const PROP_MSS = 'si_v';

export interface WohnenInput {
	readonly wohnlagenFeatures: ReadonlyArray<Feature>;
	readonly wohnlagenSourceUpdatedAt: string;
	readonly mssFeatures: ReadonlyArray<Feature>;
	readonly mssSourceUpdatedAt: string;
}

function toStringProp(features: ReadonlyArray<Feature>, prop: string): Feature[] {
	// `wol` und `si_v` können als Number oder String kommen; normalisieren.
	return features.map((f) => ({
		...f,
		properties: f.properties
			? { ...f.properties, [prop]: f.properties[prop] != null ? String(f.properties[prop]) : null }
			: null
	}));
}

export function computeWohnenAggregate(
	input: WohnenInput,
	target: Feature<Polygon | MultiPolygon>
): WohnenAggregat {
	const insideW = pointsInPolygon(toStringProp(input.wohnlagenFeatures, PROP_WOL), target);
	const domW = dominantCategory(insideW, PROP_WOL);
	const distW = categoryDistribution(insideW, PROP_WOL);
	const distWSize = Object.keys(distW).length;
	const insideM = pointsInPolygon(toStringProp(input.mssFeatures, PROP_MSS), target);
	const domM = dominantCategory(insideM, PROP_MSS);
	const distM = categoryDistribution(insideM, PROP_MSS);
	const distMSize = Object.keys(distM).length;
	return {
		dominantWohnlage:
			domW !== null
				? { value: domW, layer: SLUG_WOHNLAGEN, sourceUpdatedAt: input.wohnlagenSourceUpdatedAt }
				: null,
		wohnlageDistribution:
			distWSize > 0
				? { value: distW, layer: SLUG_WOHNLAGEN, sourceUpdatedAt: input.wohnlagenSourceUpdatedAt }
				: null,
		dominantMss:
			domM !== null
				? { value: domM, layer: SLUG_MSS, sourceUpdatedAt: input.mssSourceUpdatedAt }
				: null,
		mssDistribution:
			distMSize > 0
				? { value: distM, layer: SLUG_MSS, sourceUpdatedAt: input.mssSourceUpdatedAt }
				: null
	};
}
