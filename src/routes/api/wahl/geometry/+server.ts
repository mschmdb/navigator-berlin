import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { Feature, FeatureCollection, Polygon, MultiPolygon } from 'geojson';
import type { RequestHandler } from './$types';
import { wahlCacheHeaders } from '$lib/server/wahl/cache-control.js';
import {
	geoSlugForYear,
	candidateDbUwbIds,
	UWB_FORMAT_HINT
} from '$lib/data/wahl-geo-mapping.js';

const STATIC_LAYERS_DIR = join(process.cwd(), 'static', 'layers');
const MANIFEST_PATH = join(STATIC_LAYERS_DIR, 'MANIFEST.json');

type Manifest = { layers: Array<{ slug: string; filename: string }> };

let manifestCache: Manifest | null = null;
const fcCache = new Map<string, FeatureCollection>();

async function loadManifest(): Promise<Manifest> {
	if (manifestCache) return manifestCache;
	if (!existsSync(MANIFEST_PATH)) throw new Error('MANIFEST.json missing');
	manifestCache = JSON.parse(await readFile(MANIFEST_PATH, 'utf-8')) as Manifest;
	return manifestCache;
}

async function loadFc(filename: string): Promise<FeatureCollection> {
	const hit = fcCache.get(filename);
	if (hit) return hit;
	const fc = JSON.parse(
		await readFile(join(STATIC_LAYERS_DIR, filename), 'utf-8')
	) as FeatureCollection;
	fcCache.set(filename, fc);
	return fc;
}

export const GET: RequestHandler = async ({ url }) => {
	const districtId = url.searchParams.get('district_id');
	const yearStr = url.searchParams.get('year');
	if (!districtId || !yearStr) {
		return new Response(JSON.stringify({ error: 'missing_params' }), {
			status: 400,
			headers: { 'content-type': 'application/json' }
		});
	}
	const year = parseInt(yearStr, 10);
	if (!Number.isFinite(year)) {
		return new Response(JSON.stringify({ error: 'invalid_year' }), {
			status: 400,
			headers: { 'content-type': 'application/json' }
		});
	}
	const geoSlug = geoSlugForYear(year);
	if (!geoSlug) {
		return new Response(
			JSON.stringify({
				error: 'geometry_not_available',
				year,
				available_levels: ['bezirk', 'berlin']
			}),
			{
				status: 200,
				headers: { 'content-type': 'application/json' }
			}
		);
	}
	const manifest = await loadManifest();
	const urnenLayer = manifest.layers.find((l) => l.slug === `wahlbezirke-${geoSlug}`);
	const gruppenLayer = manifest.layers.find((l) => l.slug === `wahlgruppen-${geoSlug}`);
	if (!urnenLayer) {
		return new Response(JSON.stringify({ error: 'layer_not_found', geoSlug }), {
			status: 404,
			headers: { 'content-type': 'application/json' }
		});
	}
	const urnenFc = await loadFc(urnenLayer.filename);
	for (const f of urnenFc.features) {
		const geom = f.geometry as Polygon | MultiPolygon | null;
		if (!geom || (geom.type !== 'Polygon' && geom.type !== 'MultiPolygon')) continue;
		const props = (f.properties ?? {}) as Record<string, unknown>;
		const candidates = candidateDbUwbIds(props);
		if (!candidates.includes(districtId)) continue;
		const bezirkCode = typeof props.BEZ === 'string' ? props.BEZ.padStart(2, '0') : null;

		// Story 17 (Briefwahl-Gruppen als kleinste Kartenebene): die Karte
		// zeigt keine einzelne Urnen-Fläche mehr, sondern die dissolvierte
		// Gruppen-Fläche (Urne + ihre Geschwister-Urnen + Briefwahlbezirk).
		// `briefwahlMatchKey` vergleicht rohe BEZ+BWB*-Werte statt einer
		// wahlSlug-formatierten Gruppen-ID -- diese Route kennt nur `year`
		// (mehrdeutig zwischen btw/agh/bvv), nicht den wahlSlug.
		const gruppenGeom = gruppenLayer ? await findGruppenGeometry(gruppenLayer, props) : null;
		const geometry = gruppenGeom ?? geom;

		const feature: Feature = {
			type: 'Feature',
			geometry,
			properties: {
				district_id: districtId,
				year,
				bezirk_code: bezirkCode,
				is_gruppe: gruppenGeom !== null
			}
		};
		return new Response(JSON.stringify(feature), {
			status: 200,
			headers: {
				'content-type': 'application/geo+json',
				...wahlCacheHeaders()
			}
		});
	}
	return new Response(
		JSON.stringify({
			error: 'district_not_found',
			district_id: districtId,
			year,
			hint: UWB_FORMAT_HINT
		}),
		{
			status: 404,
			headers: { 'content-type': 'application/json' }
		}
	);
};

/** Roher Vergleichs-Schlüssel BEZ+Briefwahlbezirk-Suffix aus welchem BWB*-Feld
 * auch immer vorhanden ist (BWB3 bevorzugt, dann BWB2, dann BWB) -- identisch
 * auf Urnen- UND (dissolvierten) Gruppen-Features, weil der Dissolve-Schritt
 * (`sbb-geo-pipeline.ts#dissolveGruppen`) diese Felder unverändert kopiert. */
function briefwahlMatchKey(props: Record<string, unknown>): string | null {
	const bez = typeof props.BEZ === 'string' ? props.BEZ.padStart(2, '0') : null;
	if (!bez) return null;
	const suffix =
		typeof props.BWB3 === 'string'
			? props.BWB3
			: typeof props.BWB2 === 'string'
				? props.BWB2
				: typeof props.BWB === 'string'
					? props.BWB
					: null;
	if (!suffix) return null;
	return `${bez}|${suffix}`;
}

async function findGruppenGeometry(
	gruppenLayer: { filename: string },
	urneProps: Record<string, unknown>
): Promise<Polygon | MultiPolygon | null> {
	const key = briefwahlMatchKey(urneProps);
	if (!key) return null;
	const fc = await loadFc(gruppenLayer.filename);
	for (const f of fc.features) {
		const props = (f.properties ?? {}) as Record<string, unknown>;
		if (briefwahlMatchKey(props) !== key) continue;
		const geom = f.geometry as Polygon | MultiPolygon | null;
		if (geom && (geom.type === 'Polygon' || geom.type === 'MultiPolygon')) return geom;
	}
	return null;
}
