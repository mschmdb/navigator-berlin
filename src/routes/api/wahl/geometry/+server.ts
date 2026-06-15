import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { Feature, FeatureCollection, Polygon, MultiPolygon } from 'geojson';
import type { RequestHandler } from './$types';

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

function geoSlugForYear(year: number): string | null {
	if (year === 2025) return 'bt25';
	if (year === 2023) return 'ah21';
	if (year === 2021) return 'ah21';
	if (year === 2017) return 'btw17';
	if (year === 2016) return 'ah16';
	return null;
}

function pickUwb3(props: Record<string, unknown>): string | null {
	if (typeof props.UWB3 === 'string') return props.UWB3;
	if (typeof props.UWB === 'string') {
		const u = props.UWB;
		if (u.length === 5) return u.slice(2);
		return u;
	}
	if (typeof props.WB === 'string') return props.WB;
	return null;
}

function candidateDbUwbIds(props: Record<string, unknown>): string[] {
	const bez = typeof props.BEZ === 'string' ? props.BEZ.padStart(2, '0') : null;
	const uwb3 = pickUwb3(props);
	if (!bez || !uwb3) return [];
	const bwk = typeof props.BWK === 'string' ? props.BWK.padStart(3, '0') : null;
	const out: string[] = [];
	if (bwk) {
		out.push(`${bwk}-${bez}-${uwb3}-0`);
		out.push(`${bwk}-${bez}-${bez}W${uwb3}-0`);
	}
	out.push(`${bez}W${uwb3}-W`);
	out.push(`${bez}W${uwb3}`);
	return out;
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
	const layer = manifest.layers.find((l) => l.slug === `wahlbezirke-${geoSlug}`);
	if (!layer) {
		return new Response(JSON.stringify({ error: 'layer_not_found', geoSlug }), {
			status: 404,
			headers: { 'content-type': 'application/json' }
		});
	}
	const fc = await loadFc(layer.filename);
	for (const f of fc.features) {
		const geom = f.geometry as Polygon | MultiPolygon | null;
		if (!geom || (geom.type !== 'Polygon' && geom.type !== 'MultiPolygon')) continue;
		const props = (f.properties ?? {}) as Record<string, unknown>;
		const candidates = candidateDbUwbIds(props);
		if (!candidates.includes(districtId)) continue;
		const bezirkCode = typeof props.BEZ === 'string' ? props.BEZ.padStart(2, '0') : null;
		const feature: Feature = {
			type: 'Feature',
			geometry: geom,
			properties: {
				district_id: districtId,
				year,
				bezirk_code: bezirkCode
			}
		};
		return new Response(JSON.stringify(feature), {
			status: 200,
			headers: {
				'content-type': 'application/geo+json',
				'cache-control': 'public, max-age=3600'
			}
		});
	}
	return new Response(
		JSON.stringify({
			error: 'district_not_found',
			district_id: districtId,
			year,
			hint: 'Verify district_id format. BTW21/25: 075-01-100-0. BTW17: 078-05-05W221-0. AGH/BVV21/23: 01W100-W. AGH/BVV16: 01W100.'
		}),
		{
			status: 404,
			headers: { 'content-type': 'application/json' }
		}
	);
};
