import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import bbox from '@turf/bbox';
import type { Feature, MultiPolygon, Polygon } from 'geojson';
import { buildKiezSlugs, type KiezNameRef } from '$lib/data/internal/kiez-slug.js';
import { bezirkSlugFromName, cleanName } from '$lib/data/region-display-names.js';
import type { LayerAggregate, LayerAggregatesFile } from '$lib/data/layer-aggregates-types.js';
import { readLayerAggregatesFile } from '$lib/server/profile/meta-sources.js';
import { LABELS, METRICS, type LabelValues, type MetricValues } from './topics';

/**
 * Themenwerte je Kiez und Bezirk aus vorhandenen Quellen: Layer-Aggregate, Story-Kennzahlen,
 * Kiez-/Bezirks-Statistik (DB, dieselben Zahlen wie die FAQ), Kriminalitätsatlas und
 * Punkt-Layer, die hier je Gebiet gezählt werden. Einmal pro Prozess gerechnet.
 */
export interface TopicData {
	readonly kiez: ReadonlyMap<string, { metrics: MetricValues; labels: LabelValues }>;
	readonly bezirk: ReadonlyMap<string, { metrics: MetricValues; labels: LabelValues }>;
}

type Geo = Polygon | MultiPolygon;
interface Area {
	readonly slug: string;
	readonly geometry: Geo;
	readonly box: [number, number, number, number];
}

const MIN_PEOPLE_PER10K = 1000;

const POINT_LAYERS = {
	bahnhoefe: ['ubahn-stationen', 'sbahn-stationen'],
	lebensmittel: ['nahversorgung-lebensmittel'],
	apotheken: ['nahversorgung-apotheke'],
	kitas: ['kitas-2024'],
	schulen: ['schulen-2024'],
	kulturorte: [
		'kultur-museum',
		'kultur-theater',
		'kultur-kino',
		'kultur-bibliothek',
		'kultur-galerie',
		'kultur-club',
		'kultur-soziokultur'
	]
} as const;
type PointKey = keyof typeof POINT_LAYERS;

async function readJson(path: string): Promise<unknown> {
	const { readFile } = await import('node:fs/promises');
	const { resolve } = await import('node:path');
	return JSON.parse(await readFile(resolve(process.cwd(), path), 'utf-8'));
}

async function readLayer(slug: string): Promise<{ features: Feature[] }> {
	const manifest = (await readJson('static/layers/MANIFEST.json')) as {
		layers: { slug: string; filename: string }[];
	};
	const layer = manifest.layers.find((l) => l.slug === slug);
	if (!layer) throw new Error(`${slug} fehlt im MANIFEST.json`);
	return (await readJson(`static/layers/${layer.filename}`)) as { features: Feature[] };
}

function toArea(slug: string, geometry: unknown): Area | null {
	const g = geometry as Geo | null;
	if (!g || (g.type !== 'Polygon' && g.type !== 'MultiPolygon')) return null;
	return { slug, geometry: g, box: bbox(g) as [number, number, number, number] };
}

function countPoints(
	areas: readonly Area[],
	points: readonly [number, number][]
): Map<string, number> {
	const out = new Map(areas.map((a) => [a.slug, 0]));
	for (const p of points) {
		for (const a of areas) {
			const [x0, y0, x1, y1] = a.box;
			if (p[0] < x0 || p[0] > x1 || p[1] < y0 || p[1] > y1) continue;
			if (booleanPointInPolygon(p, a.geometry)) {
				out.set(a.slug, (out.get(a.slug) ?? 0) + 1);
				break;
			}
		}
	}
	return out;
}

function share(a: LayerAggregate | undefined, cls: string): number | null {
	if (!a || a.type !== 'ordinal-distribution' || a.classes.length === 0) return null;
	return a.classes.find((c) => c.label.toLowerCase() === cls)?.share ?? 0;
}
function dominant(a: LayerAggregate | undefined): string | null {
	return a && a.type === 'ordinal-distribution' ? (a.dominant?.toLowerCase() ?? null) : null;
}
function num(a: LayerAggregate | undefined): number | null {
	if (!a) return null;
	if (a.type === 'weighted-mean') return a.mean;
	if (a.type === 'numeric-median') return a.median;
	if (a.type === 'area-share' || a.type === 'coverage-share') return a.share;
	return null;
}

interface StoryRow {
	slug: string;
	bewohner: number | null;
	bewohnerProKm2: number | null;
	laermDb: number | null;
	haltestelle400mAnteil: number | null;
}

type StatsRow = { slug: string; oepnv: unknown; klima: unknown };
function statValue(group: unknown, key: string): number | null {
	const v = (group as Record<string, { value?: unknown } | null> | null)?.[key]?.value;
	return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

async function loadStats(): Promise<{ kiez: StatsRow[]; bezirk: StatsRow[] }> {
	if (!process.env.DATABASE_URL) return { kiez: [], bezirk: [] };
	const { getDb } = await import('$lib/server/db/index.js');
	const { kiezStats, bezirkStats } = await import('$lib/server/db/schema/index.js');
	const db = getDb();
	const [kiez, bezirk] = await Promise.all([
		db
			.select({ slug: kiezStats.slug, oepnv: kiezStats.oepnv, klima: kiezStats.klima })
			.from(kiezStats),
		db
			.select({ slug: bezirkStats.slug, oepnv: bezirkStats.oepnv, klima: bezirkStats.klima })
			.from(bezirkStats)
	]);
	return { kiez, bezirk };
}

function aggregateLookup(
	file: LayerAggregatesFile | null,
	layer: string,
	level: 'kiez' | 'bezirk',
	slug: string,
	bezirkSlug: string | null
): LayerAggregate | undefined {
	const entry = file?.aggregates?.[layer];
	const records = (level === 'kiez' ? entry?.kiez : entry?.bezirk) ?? {};
	if (Object.hasOwn(records, slug)) return records[slug];
	const alt = `${slug}-${bezirkSlug}`;
	return bezirkSlug && Object.hasOwn(records, alt) ? records[alt] : undefined;
}

async function build(): Promise<TopicData> {
	const [lor, bezirke, file, stories, krimi, stats] = await Promise.all([
		readLayer('lor-bezirksregion'),
		readLayer('bezirke'),
		readLayerAggregatesFile(),
		readJson('static/data/stories-kennzahlen.json') as Promise<{
			kieze: (StoryRow & { bezirkSlug: string })[];
			bezirke: StoryRow[];
		}>,
		readJson('static/data/kriminalitaet-lor.json') as Promise<{
			records: { bzrId: string; index?: number }[];
		}>,
		loadStats()
	]);

	// Kiez-Slugs exakt wie Profile und Sitemap (buildKiezSlugs, bereinigte Namen).
	const bezCodeToName = new Map<string, string>();
	const bezirkAreas: Area[] = [];
	for (const f of bezirke.features) {
		const p = f.properties ?? {};
		if (typeof p.Schluessel_gesamt !== 'string' || typeof p.Gemeinde_name !== 'string') continue;
		const name = cleanName(p.Gemeinde_name);
		bezCodeToName.set(p.Schluessel_gesamt.slice(-2), name);
		const area = toArea(bezirkSlugFromName(name), f.geometry);
		if (area) bezirkAreas.push(area);
	}
	const refs: (KiezNameRef & { bzrId: string; geometry: unknown; bezirkSlug: string })[] = [];
	for (const f of lor.features) {
		const p = f.properties ?? {};
		if (typeof p.BZR_NAME !== 'string' || typeof p.BZR_ID !== 'string') continue;
		const bezirk = bezCodeToName.get(String(p.BEZ)) ?? '';
		refs.push({
			name: cleanName(p.BZR_NAME),
			bezirk,
			bzrId: p.BZR_ID,
			geometry: f.geometry,
			bezirkSlug: bezirkSlugFromName(bezirk)
		});
	}
	const slugs = buildKiezSlugs(refs);
	const kiezAreas = refs.flatMap((r, i) => toArea(slugs[i], r.geometry) ?? []);

	const counts = new Map<PointKey, { kiez: Map<string, number>; bezirk: Map<string, number> }>();
	for (const key of Object.keys(POINT_LAYERS) as PointKey[]) {
		// Ein Ort kann in zwei Layern stehen (Galerie und Soziokultur): nach OSM-ID bzw. Lage entdoppeln.
		const seen = new Set<string>();
		const points: [number, number][] = [];
		for (const layer of POINT_LAYERS[key]) {
			for (const f of (await readLayer(layer)).features) {
				if (f.geometry?.type !== 'Point') continue;
				const [lng, lat] = f.geometry.coordinates as [number, number];
				const osm = f.properties?.osmId;
				const id =
					osm != null
						? `osm:${f.properties?.osmType ?? ''}${osm}`
						: `${lng.toFixed(5)},${lat.toFixed(5)}`;
				if (seen.has(id)) continue;
				seen.add(id);
				points.push([lng, lat]);
			}
		}
		counts.set(key, {
			kiez: countPoints(kiezAreas, points),
			bezirk: countPoints(bezirkAreas, points)
		});
	}

	const hzByBzr = new Map<string, number>();
	for (const r of krimi.records) {
		const v = r.index;
		if (typeof v === 'number' && !hzByBzr.has(r.bzrId)) hzByBzr.set(r.bzrId, v);
	}

	const statsKiez = new Map(stats.kiez.map((s) => [s.slug, s]));
	const statsBezirk = new Map(stats.bezirk.map((s) => [s.slug, s]));
	const storyKiez = new Map(stories.kieze.map((s) => [s.slug, s]));
	const storyBezirk = new Map(stories.bezirke.map((s) => [s.slug, s]));

	function metricsFor(
		level: 'kiez' | 'bezirk',
		slug: string,
		bezirkSlug: string | null,
		kriminalitaet: number | null
	): { metrics: MetricValues; labels: LabelValues } {
		const agg = (layer: string) => aggregateLookup(file, layer, level, slug, bezirkSlug);
		const story = level === 'kiez' ? storyKiez.get(slug) : storyBezirk.get(slug);
		const st = level === 'kiez' ? statsKiez.get(slug) : statsBezirk.get(slug);
		const c = (k: PointKey) => counts.get(k)?.[level].get(slug) ?? null;
		const bewohner = story?.bewohner ?? null;
		// Je 10.000 Einwohner, fair zwischen großen und kleinen Gebieten. Unter 1.000 Einwohnern
		// (Gewerbe, Parks) würden einzelne Orte riesige Ausreißer erzeugen: dann keine Angabe.
		const per10k = (k: PointKey) => {
			const n = c(k);
			return n !== null && bewohner !== null && bewohner >= MIN_PEOPLE_PER10K
				? (n / bewohner) * 10_000
				: null;
		};
		const metrics: Record<(typeof METRICS)[number], number | null> = {
			laermDb: story?.laermDb ?? null,
			luftHoch: share(agg('luft-2023'), 'hoch'),
			gruenanlagen: num(agg('gruenanlagen')),
			gruenSchlecht: share(agg('gruenversorgung-2023'), 'schlecht'),
			pet: statValue(st?.klima, 'meanPet'),
			bestandsmiete: num(agg('zensus-bestandsmiete-2022')),
			altbau: num(agg('zensus-altbau-anteil-2022')),
			milieuschutz: num(agg('milieuschutz-erhaltungsmiete')),
			haltestellenKm2: statValue(st?.oepnv, 'stopsPerKm2'),
			haltestelle400m:
				story?.haltestelle400mAnteil == null ? null : story.haltestelle400mAnteil * 100,
			bahnhoefe: c('bahnhoefe'),
			lebensmittel10k: per10k('lebensmittel'),
			apotheken: per10k('apotheken'),
			kitas: per10k('kitas'),
			schulen: per10k('schulen'),
			kulturorte: per10k('kulturorte'),
			dichte: story?.bewohnerProKm2 ?? null,
			kriminalitaet
		};
		const labels: Record<(typeof LABELS)[number], string | null> = {
			laermKlasse: dominant(agg('laerm-2023')),
			mss: dominant(agg('mss-gesamtindex-2025')),
			gruenversorgung: dominant(agg('gruenversorgung-2023'))
		};
		return { metrics, labels };
	}

	const kiez = new Map<string, { metrics: MetricValues; labels: LabelValues }>();
	refs.forEach((r, i) => {
		kiez.set(slugs[i], metricsFor('kiez', slugs[i], r.bezirkSlug, hzByBzr.get(r.bzrId) ?? null));
	});

	// Bezirk: Kieztaten als Mittel seiner Kieze, gewichtet mit den Einwohnern.
	const bezirk = new Map<string, { metrics: MetricValues; labels: LabelValues }>();
	for (const a of bezirkAreas) {
		let sum = 0;
		let weight = 0;
		refs.forEach((r, i) => {
			const hz = hzByBzr.get(r.bzrId);
			const w = storyKiez.get(slugs[i])?.bewohner ?? 0;
			if (r.bezirkSlug === a.slug && typeof hz === 'number' && w > 0) {
				sum += hz * w;
				weight += w;
			}
		});
		bezirk.set(a.slug, metricsFor('bezirk', a.slug, null, weight > 0 ? sum / weight : null));
	}
	return { kiez, bezirk };
}

let cached: Promise<TopicData> | null = null;

export function loadTopicData(): Promise<TopicData> {
	cached ??= build().catch((err) => {
		cached = null;
		throw err;
	});
	return cached;
}
