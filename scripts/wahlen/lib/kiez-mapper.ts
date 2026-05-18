import center from '@turf/center';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import type { Feature, FeatureCollection, Polygon, MultiPolygon } from 'geojson';
import { normalizeSlug } from '../../../src/lib/data/internal/slug.js';

export type GeoUwbProps = Record<string, unknown>;

export type KiezMapping = {
	dbUwbId: string;
	kiezSlug: string;
};

/**
 * Map DB-uwbId zu kiez-slug via Centroid → LOR-Bezirksregion. Format-Variants über die Jahre:
 *
 * | Wahl       | DB-Format                       | Geo-Build-Rule                       |
 * |------------|---------------------------------|--------------------------------------|
 * | BTW 21/25  | `${BWK}-${BEZ}-${UWB3}-0`       | `${BWK}-${BEZ}-${UWB3}-0`            |
 * | BTW 17     | `${BWK}-${BEZ}-${BEZ}W${UWB3}-0`| `${BWK}-${BEZ}-${BEZ}W${UWB3}-0`     |
 * | BTW 13     | (split-direct format, different) | not mappable                        |
 * | AGH/BVV 21/23 | `${BEZ}W${UWB3}-W`           | `${BEZ}W${UWB3}-W`                   |
 * | AGH/BVV 16 | `${BEZ}W${UWB3}` (no suffix)    | `${BEZ}W${UWB3}`                     |
 * | AGH/BVV 11 | (different, Adresse-Spalte fehlt) | not mappable                       |
 */
export function dbUwbIdFromGeo(
	props: GeoUwbProps,
	wahlSlug: string
): string | null {
	const bez = typeof props.BEZ === 'string' ? props.BEZ.padStart(2, '0') : null;
	const uwb3 = pickUwb3(props);
	if (!bez || !uwb3) return null;

	if (wahlSlug === 'btw21' || wahlSlug === 'btw25') {
		const bwk = typeof props.BWK === 'string' ? props.BWK.padStart(3, '0') : null;
		if (!bwk) return null;
		return `${bwk}-${bez}-${uwb3}-0`;
	}

	if (wahlSlug === 'btw17') {
		const bwk = typeof props.BWK === 'string' ? props.BWK.padStart(3, '0') : null;
		if (!bwk) return null;
		return `${bwk}-${bez}-${bez}W${uwb3}-0`;
	}

	if (wahlSlug === 'agh21' || wahlSlug === 'agh23' || wahlSlug === 'bvv21' || wahlSlug === 'bvv23') {
		return `${bez}W${uwb3}-W`;
	}

	if (wahlSlug === 'agh16' || wahlSlug === 'bvv16') {
		return `${bez}W${uwb3}`;
	}

	return null;
}

function pickUwb3(props: GeoUwbProps): string | null {
	if (typeof props.UWB3 === 'string') return props.UWB3;
	if (typeof props.UWB === 'string') {
		const u = props.UWB;
		if (u.length === 5) return u.slice(2);
		if (u.length === 3) return u;
		return u;
	}
	if (typeof props.WB === 'string') return props.WB;
	return null;
}

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
