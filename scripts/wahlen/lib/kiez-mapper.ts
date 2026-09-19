import center from '@turf/center';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import type { Feature, FeatureCollection, Polygon, MultiPolygon } from 'geojson';
import { normalizeSlug } from '../../../src/lib/data/internal/slug.js';
import { dbUwbIdFromGeo, type GeoUwbProps } from '../../../src/lib/data/wahl-geo-mapping.js';

export type { GeoUwbProps };

export type KiezMapping = {
	dbUwbId: string;
	kiezSlug: string;
};

/**
 * Map DB-uwbId zu kiez-slug via Centroid → LOR-Bezirksregion. `dbUwbIdFromGeo`
 * delegiert an `src/lib/data/wahl-geo-mapping.ts` (einzige Quelle). Format-
 * Varianten über die Jahre:
 *
 * | Wahl          | DB-Format                                                    |
 * |---------------|---------------------------------------------------------------|
 * | BTW 21/25     | `${BWK}-${BEZ}-${UWB3}-0`                                    |
 * | BTW 17        | `${BWK}-${BEZ}-${BEZ}W${UWB3}-0`                             |
 * | BTW 13        | (split-direct format, different) — not mappable              |
 * | AGH/BVV 21/23 | `${BEZ}W${UWB3}` (ohne Suffix; DB kann `-W` enthalten, Reverse-Lookup in der geometry-Route deckt beides ab) |
 * | AGH/BVV 16    | `${BEZ}W${UWB3}` (no suffix)                                 |
 * | AGH/BVV 11    | (different, Adresse-Spalte fehlt) — not mappable             |
 */
export { dbUwbIdFromGeo };

/**
 * Berechne Kiez-Slug pro Geo-Feature via Centroid → LOR-BR-Punkt-in-Polygon.
 */
export function buildKiezMappings(
	geoFc: FeatureCollection<Polygon | MultiPolygon, GeoUwbProps>,
	lorFc: FeatureCollection<Polygon | MultiPolygon, { BZR_NAME: string }>,
	wahlSlug: string
): KiezMapping[] {
	const out: KiezMapping[] = [];
	const seen = new Set<string>();

	for (const feature of geoFc.features) {
		const dbUwbId = dbUwbIdFromGeo(feature.properties, wahlSlug);
		if (!dbUwbId || seen.has(dbUwbId)) continue;

		const c = center(feature as Feature);
		const kiez = lorFc.features.find((lor) =>
			booleanPointInPolygon(c, lor as Feature<Polygon | MultiPolygon>)
		);
		if (!kiez || !kiez.properties?.BZR_NAME) continue;

		const kiezSlug = normalizeSlug(kiez.properties.BZR_NAME);
		out.push({ dbUwbId, kiezSlug });
		seen.add(dbUwbId);
	}
	return out;
}
