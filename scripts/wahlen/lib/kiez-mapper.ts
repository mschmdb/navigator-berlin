import center from '@turf/center';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import type { Feature, FeatureCollection, Polygon, MultiPolygon } from 'geojson';
import { buildKiezSlugs } from '../../../src/lib/data/internal/kiez-slug.js';
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
	lorFc: FeatureCollection<Polygon | MultiPolygon, { BZR_NAME: string; BEZ?: string }>,
	wahlSlug: string,
	bezirkeFc: FeatureCollection<Polygon | MultiPolygon, Record<string, unknown>>
): KiezMapping[] {
	// Slug-Bildung ueber die GETEILTE Disambiguierung (kiez-slug.ts, identisch
	// zu Client-Join, Resolver und Sitemap): Duplikat-Namen wie "Heerstrasse"
	// (Charlottenburg-Wilmersdorf + Spandau) bekommen den Bezirks-Slug als
	// Suffix. Der fruehere bare normalizeSlug(BZR_NAME) warf beide Kieze auf
	// EINEN Slug zusammen (DB-Rows = Summe beider, Client-Join lief ins Leere).
	const bezNames = new Map<string, string>();
	for (const f of bezirkeFc.features) {
		const p = (f.properties ?? {}) as Record<string, unknown>;
		if (typeof p.Gemeinde_schluessel === 'string' && typeof p.Gemeinde_name === 'string') {
			bezNames.set(p.Gemeinde_schluessel.slice(-2), p.Gemeinde_name);
		}
	}
	const refs = lorFc.features.map((f) => ({
		name: typeof f.properties?.BZR_NAME === 'string' ? f.properties.BZR_NAME : '',
		bezirk: bezNames.get(typeof f.properties?.BEZ === 'string' ? f.properties.BEZ : '') ?? ''
	}));
	const lorSlugs = buildKiezSlugs(refs);

	const out: KiezMapping[] = [];
	const seen = new Set<string>();

	for (const feature of geoFc.features) {
		const dbUwbId = dbUwbIdFromGeo(feature.properties, wahlSlug);
		if (!dbUwbId || seen.has(dbUwbId)) continue;

		const c = center(feature as Feature);
		const kiezIndex = lorFc.features.findIndex((lor) =>
			booleanPointInPolygon(c, lor as Feature<Polygon | MultiPolygon>)
		);
		if (kiezIndex === -1 || !lorFc.features[kiezIndex].properties?.BZR_NAME) continue;

		out.push({ dbUwbId, kiezSlug: lorSlugs[kiezIndex] });
		seen.add(dbUwbId);
	}
	return out;
}
