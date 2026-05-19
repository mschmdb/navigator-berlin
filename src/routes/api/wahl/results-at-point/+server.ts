import * as v from 'valibot';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { point } from '@turf/helpers';
import type { Feature, FeatureCollection, Polygon, MultiPolygon } from 'geojson';
import type { RequestHandler } from './$types';
import { BERLIN_BBOX } from '$lib/data/constants.js';
import { normalizeSlug } from '$lib/data/internal/slug.js';
import { getWahlList } from '$lib/server/db/queries/wahl/get-wahl-list.js';
import { getResultsForStimmbezirk } from '$lib/server/db/queries/wahl/get-results-for-stimmbezirk.js';
import { getResultsForKiez } from '$lib/server/db/queries/wahl/get-results-for-kiez.js';
import { getResultsForBezirk } from '$lib/server/db/queries/wahl/get-results-for-bezirk.js';
import { getResultsForBerlin } from '$lib/server/db/queries/wahl/get-results-for-berlin.js';
import { getSparklineForKiez } from '$lib/server/db/queries/wahl/get-sparkline-for-kiez.js';

const QuerySchema = v.object({
	lat: v.pipe(v.number(), v.minValue(BERLIN_BBOX.south - 0.05), v.maxValue(BERLIN_BBOX.north + 0.05)),
	lng: v.pipe(v.number(), v.minValue(BERLIN_BBOX.west - 0.05), v.maxValue(BERLIN_BBOX.east + 0.05))
});

type WahlListItem = Awaited<ReturnType<typeof getWahlList>>[number];

type LevelResults = {
	available: boolean;
	top5: Array<{ kurzname: string; vollname: string; farbeHex: string; stimmen: number; anteil: number }> | null;
	isBriefwahlAggregat?: boolean;
};

type WahlResultBundle = {
	wahl: WahlListItem;
	uwbId: string | null;
	levels: {
		stimmbezirk: LevelResults;
		kiez: LevelResults;
		bezirk: LevelResults;
		berlin: LevelResults;
	};
};

type SparklineSeries = {
	typ: 'btw' | 'agh' | 'bvv';
	stimmtyp: 'erststimme' | 'zweitstimme' | 'einstimme';
	level: 'kiez';
	kiezSlug: string;
	points: Array<{ jahr: number; parteiKurzname: string; farbeHex: string; anteil: number }>;
};

type Response = {
	point: { lat: number; lng: number };
	location: { bezirkSlug: string | null; kiezSlug: string | null };
	wahlbezirks: Record<string, { uwbId: string; bezirkCode: string }>;
	wahlen: WahlResultBundle[];
	sparklines: SparklineSeries[];
};

const STATIC_LAYERS_DIR = join(process.cwd(), 'static', 'layers');
const MANIFEST_PATH = join(STATIC_LAYERS_DIR, 'MANIFEST.json');
const SLUG_PREFIX = 'wahlbezirke-';

type Manifest = { layers: Array<{ slug: string; filename: string }> };

let manifestCache: Manifest | null = null;
const fcCache = new Map<string, FeatureCollection>();

async function loadManifest(): Promise<Manifest> {
	if (manifestCache) return manifestCache;
	if (!existsSync(MANIFEST_PATH)) throw new Error('MANIFEST.json missing');
	const raw = await readFile(MANIFEST_PATH, 'utf-8');
	manifestCache = JSON.parse(raw) as Manifest;
	return manifestCache;
}

async function loadFc(filename: string): Promise<FeatureCollection> {
	const hit = fcCache.get(filename);
	if (hit) return hit;
	const raw = await readFile(join(STATIC_LAYERS_DIR, filename), 'utf-8');
	const fc = JSON.parse(raw) as FeatureCollection;
	fcCache.set(filename, fc);
	return fc;
}

function dbUwbIdFromGeoForWahl(
	props: Record<string, unknown>,
	wahlSlug: string
): string | null {
	const bez = typeof props.BEZ === 'string' ? props.BEZ.padStart(2, '0') : null;
	const uwb3 = pickUwb3(props);
	if (!bez || !uwb3) return null;

	if (wahlSlug === 'btw21' || wahlSlug === 'btw25') {
		const bwk = typeof props.BWK === 'string' ? props.BWK.padStart(3, '0') : null;
		return bwk ? `${bwk}-${bez}-${uwb3}-0` : null;
	}
	if (wahlSlug === 'btw17') {
		const bwk = typeof props.BWK === 'string' ? props.BWK.padStart(3, '0') : null;
		return bwk ? `${bwk}-${bez}-${bez}W${uwb3}-0` : null;
	}
	if (['agh21', 'agh23', 'bvv21', 'bvv23'].includes(wahlSlug)) {
		return `${bez}W${uwb3}-W`;
	}
	if (['agh16', 'bvv16'].includes(wahlSlug)) {
		return `${bez}W${uwb3}`;
	}
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

function wahlSlugFor(w: WahlListItem): string {
	const jj = String(w.jahr).slice(-2);
	return `${w.typ}${jj}`;
}

// agh23/bvv23 = Wiederholungswahl Sept 2023 auf unveränderten Wahlbezirken
// vom Sept 2021 → ah21-Polygone (ah23-Layer enthält nur Wahllokal-Punkte).
const WAHL_TO_GEO: Record<string, string> = {
	btw17: 'btw17',
	btw21: 'ah21',
	btw25: 'bt25',
	agh16: 'ah16',
	agh21: 'ah21',
	agh23: 'ah21',
	bvv16: 'ah16',
	bvv21: 'ah21',
	bvv23: 'ah21'
};

async function findWahlbezirks(
	lat: number,
	lng: number
): Promise<Record<string, { uwbId: string; bezirkCode: string; geoProps: Record<string, unknown> }>> {
	const manifest = await loadManifest();
	const wahlbezirksLayers = manifest.layers.filter((l) => l.slug.startsWith(SLUG_PREFIX));
	const results: Record<string, { uwbId: string; bezirkCode: string; geoProps: Record<string, unknown> }> = {};
	const pt = point([lng, lat]);

	await Promise.all(
		wahlbezirksLayers.map(async (layer) => {
			const geoSlug = layer.slug.slice(SLUG_PREFIX.length);
			const fc = await loadFc(layer.filename);
			for (const feature of fc.features) {
				if (!booleanPointInPolygon(pt, feature as Feature<Polygon | MultiPolygon>)) continue;
				const props = (feature.properties ?? {}) as Record<string, unknown>;
				const bez = typeof props.BEZ === 'string' ? props.BEZ.padStart(2, '0') : '00';
				const uwbId = pickUwb3(props) ?? '';
				results[geoSlug] = { uwbId, bezirkCode: bez, geoProps: props };
				break;
			}
		})
	);
	return results;
}

const BEZIRK_NAMES: Record<string, string> = {
	'01': 'Mitte',
	'02': 'Friedrichshain-Kreuzberg',
	'03': 'Pankow',
	'04': 'Charlottenburg-Wilmersdorf',
	'05': 'Spandau',
	'06': 'Steglitz-Zehlendorf',
	'07': 'Tempelhof-Schöneberg',
	'08': 'Neukölln',
	'09': 'Treptow-Köpenick',
	'10': 'Marzahn-Hellersdorf',
	'11': 'Lichtenberg',
	'12': 'Reinickendorf'
};

async function findKiezSlug(lat: number, lng: number): Promise<string | null> {
	const manifest = await loadManifest();
	const lorLayer = manifest.layers.find((l) => l.slug === 'lor-bezirksregion');
	if (!lorLayer) return null;
	const fc = await loadFc(lorLayer.filename);
	const pt = point([lng, lat]);
	for (const feature of fc.features) {
		if (!booleanPointInPolygon(pt, feature as Feature<Polygon | MultiPolygon>)) continue;
		const name = (feature.properties as { BZR_NAME?: string } | null)?.BZR_NAME;
		return name ? normalizeSlug(name) : null;
	}
	return null;
}

async function buildLevelResults(
	wahl: WahlListItem,
	dbUwbId: string | null,
	kiezSlug: string | null,
	bezirkSlug: string | null,
	isBriefwahlByDefault: boolean
): Promise<WahlResultBundle['levels']> {
	// Top-10 statt Top-5: Delta-Vergleich Stimmbezirk-Partei vs Bezirk/Berlin braucht
	// auch nicht-Top-5-Parteien (BSW oft Rank 6-7 auf Bezirks/Berlin-Ebene während
	// Top-5 lokal). UI rendert weiter nur Top-5 als Hauptliste.
	const LIMIT = 10;
	const [stimmbezirk, kiez, bezirk, berlin] = await Promise.all([
		dbUwbId
			? getResultsForStimmbezirk(wahl.id, dbUwbId, LIMIT).then((rows) => ({
					available: rows.length > 0,
					top5: rows.length > 0 ? rows.map((r) => ({
						kurzname: r.parteiKurzname,
						vollname: r.parteiVollname,
						farbeHex: r.farbeHex,
						stimmen: r.stimmen,
						anteil: r.anteil
					})) : null,
					isBriefwahlAggregat: rows[0]?.istBriefwahlAggregat ?? isBriefwahlByDefault
				}))
			: Promise.resolve({ available: false, top5: null }),
		kiezSlug
			? getResultsForKiez(wahl.id, kiezSlug, LIMIT).then((rows) => ({
					available: rows.length > 0,
					top5: rows.length > 0 ? rows.map((r) => ({
						kurzname: r.parteiKurzname,
						vollname: r.parteiVollname,
						farbeHex: r.farbeHex,
						stimmen: r.stimmen,
						anteil: r.anteil
					})) : null
				}))
			: Promise.resolve({ available: false, top5: null }),
		bezirkSlug
			? getResultsForBezirk(wahl.id, bezirkSlug, LIMIT).then((rows) => ({
					available: rows.length > 0,
					top5: rows.length > 0 ? rows.map((r) => ({
						kurzname: r.parteiKurzname,
						vollname: r.parteiVollname,
						farbeHex: r.farbeHex,
						stimmen: r.stimmen,
						anteil: r.anteil
					})) : null
				}))
			: Promise.resolve({ available: false, top5: null }),
		getResultsForBerlin(wahl.id, LIMIT).then((rows) => ({
			available: rows.length > 0,
			top5: rows.length > 0 ? rows.map((r) => ({
				kurzname: r.parteiKurzname,
				vollname: r.parteiVollname,
				farbeHex: r.farbeHex,
				stimmen: r.stimmen,
				anteil: r.anteil
			})) : null
		}))
	]);
	return { stimmbezirk, kiez, bezirk, berlin };
}

export const GET: RequestHandler = async ({ url }) => {
	const lat = parseFloat(url.searchParams.get('lat') ?? '');
	const lng = parseFloat(url.searchParams.get('lng') ?? '');
	const parsed = v.safeParse(QuerySchema, { lat, lng });
	if (!parsed.success) {
		return new Response(JSON.stringify({ error: 'invalid_coords' }), {
			status: 400,
			headers: { 'content-type': 'application/json' }
		});
	}

	const [wahlbezirks, kiezSlug] = await Promise.all([
		findWahlbezirks(lat, lng).catch(
			() => ({}) as Record<string, { uwbId: string; bezirkCode: string; geoProps: Record<string, unknown> }>
		),
		findKiezSlug(lat, lng).catch(() => null)
	]);

	let bezirkSlug: string | null = null;
	for (const data of Object.values(wahlbezirks)) {
		const name = BEZIRK_NAMES[data.bezirkCode];
		if (name) {
			bezirkSlug = normalizeSlug(name);
			break;
		}
	}

	const wahlen = await getWahlList();
	const bundles: WahlResultBundle[] = await Promise.all(
		wahlen.map(async (w) => {
			const slug = wahlSlugFor(w);
			const geoSlug = WAHL_TO_GEO[slug];
			const wb = geoSlug ? wahlbezirks[geoSlug] : undefined;
			const dbUwbId = wb ? dbUwbIdFromGeoForWahl(wb.geoProps, slug) : null;
			const levels = await buildLevelResults(w, dbUwbId, kiezSlug, bezirkSlug, false);
			return { wahl: w, uwbId: dbUwbId, levels };
		})
	);

	const sanitizedWahlbezirks: Record<string, { uwbId: string; bezirkCode: string }> = {};
	for (const [slug, data] of Object.entries(wahlbezirks)) {
		sanitizedWahlbezirks[slug] = { uwbId: data.uwbId, bezirkCode: data.bezirkCode };
	}

	const sparklines: SparklineSeries[] = [];
	if (kiezSlug) {
		const seenCombos = new Set<string>();
		for (const b of bundles) {
			const key = `${b.wahl.typ}-${b.wahl.stimmtyp}`;
			if (seenCombos.has(key)) continue;
			seenCombos.add(key);
			const points = await getSparklineForKiez(kiezSlug, b.wahl.typ, b.wahl.stimmtyp, 5);
			if (points.length > 0) {
				sparklines.push({
					typ: b.wahl.typ,
					stimmtyp: b.wahl.stimmtyp,
					level: 'kiez',
					kiezSlug,
					points: points.map((p) => ({
						jahr: p.jahr,
						parteiKurzname: p.parteiKurzname,
						farbeHex: p.farbeHex,
						anteil: p.anteil
					}))
				});
			}
		}
	}

	const body: Response = {
		point: { lat, lng },
		location: { bezirkSlug, kiezSlug },
		wahlbezirks: sanitizedWahlbezirks,
		wahlen: bundles,
		sparklines
	};

	return new Response(JSON.stringify(body), {
		status: 200,
		headers: {
			'content-type': 'application/json',
			'cache-control': 'private, max-age=60'
		}
	});
};
