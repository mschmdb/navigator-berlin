import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { point } from '@turf/helpers';
import type { Feature, Polygon, MultiPolygon } from 'geojson';
import { loadManifest } from './manifest.js';
import { fetchLayer } from './internal/layer-fetch.js';
import { getIndex } from './internal/spatial-index.js';
import { isInBerlin } from './constants.js';

export type WahlbezirksProps = {
	uwb: string;
	uwb3?: string;
	bwb?: string;
	bwb3?: string;
	bez: string;
	bwk?: string;
	awk?: string;
};

export type WahlbezirksHit = {
	geoSlug: string;
	uwbId: string;
	bezirkCode: string;
	properties: WahlbezirksProps;
};

const SLUG_PREFIX = 'wahlbezirke-';

function normalizeProps(raw: Record<string, unknown>): WahlbezirksProps | null {
	const uwb = typeof raw.UWB === 'string' ? raw.UWB : typeof raw.uwb === 'string' ? raw.uwb : null;
	const bez = typeof raw.BEZ === 'string' ? raw.BEZ : typeof raw.bez === 'string' ? raw.bez : null;
	if (!uwb || !bez) return null;
	const out: WahlbezirksProps = {
		uwb,
		bez,
		uwb3: typeof raw.UWB3 === 'string' ? raw.UWB3 : undefined,
		bwb: typeof raw.BWB === 'string' ? raw.BWB : undefined,
		bwb3: typeof raw.BWB3 === 'string' ? raw.BWB3 : undefined,
		bwk: typeof raw.BWK === 'string' ? raw.BWK : undefined,
		awk: typeof raw.AWK === 'string' ? raw.AWK : undefined
	};
	return out;
}

function buildUwbIdFromGeo(props: WahlbezirksProps): string {
	const wahlkreis = (props.bwk ?? props.awk ?? '').padStart(3, '0');
	const bezirk = props.bez.padStart(2, '0');
	const wahlbezirk = props.uwb3 ?? props.uwb;
	return `${wahlkreis}-${bezirk}-${wahlbezirk}-0`;
}

export async function getWahlbezirkAtPoint(
	geoSlug: string,
	lat: number,
	lng: number,
	fetchFn: typeof fetch = fetch
): Promise<WahlbezirksHit | null> {
	if (!isInBerlin(lat, lng)) return null;

	const manifest = await loadManifest(fetchFn);
	const slug = geoSlug.startsWith(SLUG_PREFIX) ? geoSlug : `${SLUG_PREFIX}${geoSlug}`;
	const layer = manifest.layers.find((l) => l.slug === slug);
	if (!layer) return null;

	const idx = await getIndex(layer.filename, fetchFn);
	const candidates = idx.search({ minX: lng, minY: lat, maxX: lng, maxY: lat });
	if (candidates.length === 0) return null;

	const fc = await fetchLayer(layer.filename, fetchFn);
	const pt = point([lng, lat]);

	for (const { featureIndex } of candidates) {
		const feature = fc.features[featureIndex] as Feature<Polygon | MultiPolygon, Record<string, unknown>>;
		if (!feature?.geometry) continue;
		if (!booleanPointInPolygon(pt, feature)) continue;
		const props = normalizeProps(feature.properties ?? {});
		if (!props) continue;
		return {
			geoSlug: slug,
			uwbId: buildUwbIdFromGeo(props),
			bezirkCode: props.bez.padStart(2, '0'),
			properties: props
		};
	}
	return null;
}

export async function getWahlbezirksByYear(
	lat: number,
	lng: number,
	fetchFn: typeof fetch = fetch
): Promise<Record<string, WahlbezirksHit>> {
	if (!isInBerlin(lat, lng)) return {};

	const manifest = await loadManifest(fetchFn);
	const wahlbezirksLayers = manifest.layers.filter((l) => l.slug.startsWith(SLUG_PREFIX));
	const results: Record<string, WahlbezirksHit> = {};

	await Promise.all(
		wahlbezirksLayers.map(async (layer) => {
			const geoSlug = layer.slug.slice(SLUG_PREFIX.length);
			const hit = await getWahlbezirkAtPoint(geoSlug, lat, lng, fetchFn);
			if (hit) results[geoSlug] = hit;
		})
	);

	return results;
}
