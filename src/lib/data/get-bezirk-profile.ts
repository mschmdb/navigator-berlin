import { error } from '@sveltejs/kit';
import center from '@turf/center';
import turfArea from '@turf/area';
import type { Feature, MultiPolygon, Polygon } from 'geojson';
import type { BezirkProfile, Locale } from './types.js';
import { loadManifest } from './manifest.js';
import { fetchLayer } from './internal/layer-fetch.js';
import { normalizeSlug } from './internal/slug.js';
import { getLayersAtPoint } from './get-layers-at-point.js';
import { getEinwohnerGesamtForScope } from './get-kiez-demografie.js';

const BEZIRKE_SLUG = 'bezirke';

function readBezirkName(props: Record<string, unknown>): string | null {
	const candidates = ['Gemeinde_name', 'NAME', 'name'] as const;
	for (const key of candidates) {
		const v = props[key];
		if (typeof v === 'string' && v.length > 0) return v;
	}
	return null;
}

export async function getBezirkProfile(
	_lang: Locale,
	slug: string,
	fetchFn: typeof fetch = fetch
): Promise<BezirkProfile> {
	const normalized = normalizeSlug(slug);
	const manifest = await loadManifest(fetchFn);
	const layer = manifest.layers.find((l) => l.slug === BEZIRKE_SLUG);
	if (!layer) throw error(500, 'bezirke-Layer fehlt im Manifest');

	const fc = await fetchLayer(layer.filename, fetchFn);
	const feature = fc.features.find((f) => {
		const name = readBezirkName((f.properties ?? {}) as Record<string, unknown>);
		if (!name) return false;
		return normalizeSlug(name) === normalized;
	}) as Feature<Polygon | MultiPolygon> | undefined;

	if (!feature) throw error(404, `Bezirk not found: ${slug}`);

	const props = (feature.properties ?? {}) as Record<string, unknown>;
	const name = readBezirkName(props) ?? slug;
	const centroid = center(feature).geometry.coordinates as [number, number];
	const coverage = await getLayersAtPoint(centroid[1], centroid[0], fetchFn);

	// Einwohner aus dem Demografie-Payload (gepflegt, mit Stichtag); das
	// Prod-Bezirks-GeoJSON führt keine EINWOHNER-Props. Props als Fallback.
	const einwohnerAggregat = await getEinwohnerGesamtForScope('bezirk', normalized, fetchFn);
	const einwohnerRaw = props.EINWOHNER ?? props.einwohner;
	const flaecheRaw = props.FLAECHE_HA ?? props.flaeche_ha;
	const einwohner = einwohnerAggregat ?? (typeof einwohnerRaw === 'number' ? einwohnerRaw : 0);
	const flaecheHa =
		typeof flaecheRaw === 'number' ? flaecheRaw : Math.round(turfArea(feature) / 10000);

	return {
		slug: normalized,
		name,
		einwohner,
		flaecheHa,
		centroid,
		geometry: feature.geometry,
		ortsteilSlugs: [],
		layerCoverage: coverage
	};
}
