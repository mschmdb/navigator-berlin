import { error } from '@sveltejs/kit';
import center from '@turf/center';
import type { Feature, MultiPolygon, Polygon } from 'geojson';
import type { KiezProfile, Locale } from './types.js';
import { loadManifest } from './manifest.js';
import { fetchLayer } from './internal/layer-fetch.js';
import { normalizeSlug } from './internal/slug.js';
import { getLayersAtPoint } from './get-layers-at-point.js';

const LOR_BR_SLUG = 'lor-bezirksregion';

export async function getKiezProfile(
	_lang: Locale,
	slug: string,
	fetchFn: typeof fetch = fetch
): Promise<KiezProfile> {
	const normalized = normalizeSlug(slug);
	const manifest = await loadManifest(fetchFn);
	const layer = manifest.layers.find((l) => l.slug === LOR_BR_SLUG);
	if (!layer) throw error(500, 'lor-bezirksregion-Layer fehlt im Manifest');

	const fc = await fetchLayer(layer.filename, fetchFn);
	const feature = fc.features.find((f) => {
		const name = (f.properties as Record<string, unknown>)?.NAME;
		if (typeof name !== 'string') return false;
		return normalizeSlug(name) === normalized;
	}) as Feature<Polygon | MultiPolygon> | undefined;

	if (!feature) throw error(404, `Kiez not found: ${slug}`);

	const props = feature.properties as Record<string, unknown>;
	const centroid = center(feature).geometry.coordinates as [number, number];
	const coverage = await getLayersAtPoint(centroid[1], centroid[0], fetchFn);

	return {
		slug: normalized,
		name: String(props.NAME),
		bezirk: String(props.BEZIRK ?? ''),
		einwohner: Number(props.EINWOHNER ?? 0),
		flaecheHa: Number(props.FLAECHE_HA ?? 0),
		centroid,
		geometry: feature.geometry,
		layerCoverage: coverage
	};
}
