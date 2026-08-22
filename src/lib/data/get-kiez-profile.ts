import { error } from '@sveltejs/kit';
import center from '@turf/center';
import turfArea from '@turf/area';
import type { Feature, MultiPolygon, Polygon } from 'geojson';
import type { KiezProfile, Locale } from './types.js';
import { loadManifest } from './manifest.js';
import { fetchLayer } from './internal/layer-fetch.js';
import { normalizeSlug } from './internal/slug.js';
import { resolveKiezSlugIndex, type KiezNameRef } from './internal/kiez-slug.js';
import { getLayersAtPoint } from './get-layers-at-point.js';
import { getEinwohnerGesamtForScope } from './get-kiez-demografie.js';

const LOR_BR_SLUG = 'lor-bezirksregion';
const BEZIRKE_SLUG = 'bezirke';

function readKiezName(props: Record<string, unknown>): string | null {
	const candidates = ['BZR_NAME', 'NAME', 'name'] as const;
	for (const key of candidates) {
		const v = props[key];
		if (typeof v === 'string' && v.length > 0) return v;
	}
	return null;
}

function readBezirkCode(props: Record<string, unknown>): string | null {
	const v = props.BEZ;
	if (typeof v === 'string' && v.length > 0) return v;
	if (typeof v === 'number') return String(v).padStart(2, '0');
	return null;
}

async function buildBezirkCodeToNameMap(
	manifest: Awaited<ReturnType<typeof loadManifest>>,
	fetchFn: typeof fetch
): Promise<Map<string, string>> {
	const layer = manifest.layers.find((l) => l.slug === BEZIRKE_SLUG);
	if (!layer) return new Map();
	const fc = await fetchLayer(layer.filename, fetchFn);
	const map = new Map<string, string>();
	for (const f of fc.features) {
		const props = (f.properties ?? {}) as Record<string, unknown>;
		const schluessel = props.Schluessel_gesamt;
		const name = props.Gemeinde_name;
		if (typeof schluessel === 'string' && typeof name === 'string') {
			map.set(schluessel.slice(-2), name);
		}
	}
	return map;
}

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
	const codeToName = await buildBezirkCodeToNameMap(manifest, fetchFn);

	// Refs index-aligned zu den benannten Features. Gleiche Disambiguierung wie
	// entries()/Sitemap: Duplikat "Heerstraße" → Bezirk-Suffix, sonst 404 auf
	// /kiez/heerstrasse-spandau (8.2b-Mismatch-Fix).
	const named = fc.features
		.map((f) => {
			const featureProps = (f.properties ?? {}) as Record<string, unknown>;
			const featureName = readKiezName(featureProps);
			if (!featureName) return null;
			const bezCode = readBezirkCode(featureProps);
			const bezirkName = bezCode ? (codeToName.get(bezCode) ?? '') : '';
			return {
				feature: f as Feature<Polygon | MultiPolygon>,
				ref: { name: featureName, bezirk: bezirkName } satisfies KiezNameRef
			};
		})
		.filter((x): x is NonNullable<typeof x> => x !== null);

	const index = resolveKiezSlugIndex(
		named.map((n) => n.ref),
		slug
	);
	if (index === -1) throw error(404, `Kiez not found: ${slug}`);

	const { feature } = named[index];
	const props = (feature.properties ?? {}) as Record<string, unknown>;
	const name = readKiezName(props) ?? slug;
	const bezirk = named[index].ref.bezirk;

	const centroid = center(feature).geometry.coordinates as [number, number];
	const coverage = await getLayersAtPoint(centroid[1], centroid[0], fetchFn);

	// Einwohner aus dem Demografie-Payload (gepflegt, mit Stichtag); die
	// Boundary-GeoJSONs führen keine EINWOHNER-Props mehr. Props bleiben als
	// Fallback für Alt-Daten, sonst 0.
	const einwohnerRaw = props.EINWOHNER ?? props.einwohner;
	const flaecheRaw = props.FLAECHE_HA ?? props.flaeche_ha;
	const groesseM2 = typeof props.GROESSE_m2 === 'number' ? props.GROESSE_m2 : null;
	const einwohnerAggregat = await getEinwohnerGesamtForScope('kiez', normalized, fetchFn);
	const einwohner = einwohnerAggregat ?? (typeof einwohnerRaw === 'number' ? einwohnerRaw : 0);
	const flaecheHa =
		typeof flaecheRaw === 'number'
			? flaecheRaw
			: groesseM2 !== null
				? Math.round(groesseM2 / 10000)
				: Math.round(turfArea(feature) / 10000);

	return {
		slug: normalized,
		name,
		bezirk,
		einwohner,
		flaecheHa,
		centroid,
		geometry: feature.geometry,
		layerCoverage: coverage
	};
}
