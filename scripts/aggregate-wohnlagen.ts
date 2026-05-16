/**
 * scripts/aggregate-wohnlagen.ts (Story 2.0 Folge-Refit 2026-05-16).
 *
 * Wohnlagen-2024-Layer kommt aus FIS-Broker als 401k Adress-Punkte mit `wol`
 * pro Adresse. 116 MB Client-Side-Fetch ist unbrauchbar (Browser-OOM in
 * Inspector-Pfad via `getLayersAtPoint`). Dieses Script aggregiert auf
 * 542 LOR-Planungsraum-Polygone mit dominanter Wohnlage + Verteilungs-
 * Counts und überschreibt das Manifest-Layer-File, sodass der Layer im
 * Inspector als kompakter Polygon-Layer landet.
 *
 * Run: `pnpm data:aggregate-wohnlagen` nach `pnpm data:fetch-static`. Im
 * `prebuild`-Hook nicht zwingend nötig (idempotent, nur wenn Source neu
 * gezogen wurde).
 *
 * Output-Properties pro Polygon:
 *  - `plr_id`, `plr_name`, `bez_name`
 *  - `wol_mode`: häufigster wol-Wert ('einfach' / 'mittel' / 'gut') oder
 *    'unbekannt' wenn 0 Adressen im Polygon
 *  - `count_einfach`, `count_mittel`, `count_gut`
 *
 * Inspector-`formatWohnlage` (value-formatters.ts) consumiert genau diese
 * Shape (aggregate-Branch).
 */

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import RBush from 'rbush';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { point as turfPoint } from '@turf/helpers';
import turfBbox from '@turf/bbox';
import type {
	Feature,
	FeatureCollection,
	MultiPolygon,
	Polygon,
	Point as GeoJsonPoint
} from 'geojson';

const REPO_ROOT = process.cwd();
const LAYERS_DIR = path.join(REPO_ROOT, 'static/layers');
const MANIFEST_PATH = path.join(LAYERS_DIR, 'MANIFEST.json');

const WOHNLAGEN_SLUG = 'wohnlagen-2024';
const PLR_SLUG = 'lor-planungsraum';

type WolBucket = 'einfach' | 'mittel' | 'gut';
const WOL_BUCKETS: readonly WolBucket[] = ['einfach', 'mittel', 'gut'];

interface ManifestLayer {
	slug: string;
	filename: string;
	sourceUrl: string;
	fetchedAt: string;
	sourceUpdatedAt?: string;
	license: string;
	sha256: string;
	bundleGroup: string;
	zoomThresholds: { min: number; max: number };
	geometryType: 'Point' | 'Polygon' | 'LineString';
	featureCount: number;
	[key: string]: unknown;
}
interface Manifest {
	schemaVersion: 1;
	generatedAt: string;
	layers: ManifestLayer[];
}

interface PointRecord extends RBush.BBox {
	lng: number;
	lat: number;
	wol: WolBucket;
}

async function readManifest(): Promise<Manifest> {
	const raw = await readFile(MANIFEST_PATH, 'utf-8');
	return JSON.parse(raw) as Manifest;
}

async function readGeoJson<T>(filePath: string): Promise<T> {
	const raw = await readFile(filePath, 'utf-8');
	return JSON.parse(raw) as T;
}

function normalizeWol(raw: unknown): WolBucket | null {
	if (typeof raw !== 'string') return null;
	const lower = raw.trim().toLowerCase();
	if (lower === 'einfach' || lower === 'einfache wohnlage') return 'einfach';
	if (lower === 'mittel' || lower === 'mittlere wohnlage') return 'mittel';
	if (lower === 'gut' || lower === 'gute wohnlage') return 'gut';
	return null;
}

function buildPointIndex(
	pointsFc: FeatureCollection<GeoJsonPoint, Record<string, unknown>>
): RBush<PointRecord> {
	const tree = new RBush<PointRecord>();
	const records: PointRecord[] = [];
	for (const f of pointsFc.features) {
		const wol = normalizeWol(f.properties?.wol);
		if (!wol) continue;
		const [lng, lat] = f.geometry.coordinates;
		records.push({ minX: lng, minY: lat, maxX: lng, maxY: lat, lng, lat, wol });
	}
	tree.load(records);
	return tree;
}

interface AggregatedPolygon {
	feature: Feature<Polygon | MultiPolygon, Record<string, unknown>>;
	wol_mode: string;
	count_einfach: number;
	count_mittel: number;
	count_gut: number;
}

function aggregatePolygon(
	plr: Feature<Polygon | MultiPolygon, Record<string, unknown>>,
	index: RBush<PointRecord>
): AggregatedPolygon {
	const counts: Record<WolBucket, number> = { einfach: 0, mittel: 0, gut: 0 };
	const [minX, minY, maxX, maxY] = turfBbox(plr) as [number, number, number, number];
	const candidates = index.search({ minX, minY, maxX, maxY });
	for (const rec of candidates) {
		if (booleanPointInPolygon(turfPoint([rec.lng, rec.lat]), plr)) {
			counts[rec.wol]++;
		}
	}
	const total = counts.einfach + counts.mittel + counts.gut;
	let mode: string = 'unbekannt';
	if (total > 0) {
		mode = WOL_BUCKETS.reduce<WolBucket>(
			(best, b) => (counts[b] > counts[best] ? b : best),
			WOL_BUCKETS[0]
		);
	}
	return {
		feature: plr,
		wol_mode: mode,
		count_einfach: counts.einfach,
		count_mittel: counts.mittel,
		count_gut: counts.gut
	};
}

function sha256Of(buffer: Buffer): string {
	return createHash('sha256').update(buffer).digest('hex');
}

async function main(): Promise<void> {
	process.stdout.write('[aggregate-wohnlagen] starting\n');
	const manifest = await readManifest();
	const wohnLayer = manifest.layers.find((l) => l.slug === WOHNLAGEN_SLUG);
	const plrLayer = manifest.layers.find((l) => l.slug === PLR_SLUG);
	if (!wohnLayer) throw new Error(`Layer ${WOHNLAGEN_SLUG} fehlt im MANIFEST`);
	if (!plrLayer) throw new Error(`Layer ${PLR_SLUG} fehlt im MANIFEST`);

	const wohnPath = path.join(LAYERS_DIR, wohnLayer.filename);
	const plrPath = path.join(LAYERS_DIR, plrLayer.filename);

	process.stdout.write(
		`[aggregate-wohnlagen] reading ${wohnLayer.filename} + ${plrLayer.filename}\n`
	);
	const [pointsFc, plrFc] = await Promise.all([
		readGeoJson<FeatureCollection<GeoJsonPoint, Record<string, unknown>>>(wohnPath),
		readGeoJson<FeatureCollection<Polygon | MultiPolygon, Record<string, unknown>>>(plrPath)
	]);
	process.stdout.write(
		`[aggregate-wohnlagen] ${pointsFc.features.length} points / ${plrFc.features.length} polygons\n`
	);

	process.stdout.write('[aggregate-wohnlagen] building point-index\n');
	const index = buildPointIndex(pointsFc);

	process.stdout.write('[aggregate-wohnlagen] spatial-join\n');
	const aggregated = plrFc.features.map((plr) => aggregatePolygon(plr, index));

	const outFc: FeatureCollection<Polygon | MultiPolygon, Record<string, unknown>> = {
		type: 'FeatureCollection',
		features: aggregated.map((a) => ({
			type: 'Feature',
			geometry: a.feature.geometry,
			properties: {
				plr_id: a.feature.properties?.PLR_ID ?? a.feature.properties?.plr_id ?? '',
				plr_name: a.feature.properties?.PLR_NAME ?? a.feature.properties?.plr_name ?? '',
				bez_name: a.feature.properties?.BEZ_NAME ?? a.feature.properties?.bez_name ?? '',
				wol_mode: a.wol_mode,
				count_einfach: a.count_einfach,
				count_mittel: a.count_mittel,
				count_gut: a.count_gut
			}
		}))
	};

	const buffer = Buffer.from(JSON.stringify(outFc));
	const hash = sha256Of(buffer);
	const newFilename = `${WOHNLAGEN_SLUG}.${hash.slice(0, 8)}.geojson`;
	const newPath = path.join(LAYERS_DIR, newFilename);
	await writeFile(newPath, buffer);
	process.stdout.write(`[aggregate-wohnlagen] wrote ${newFilename} (${buffer.byteLength} B)\n`);

	// Manifest aktualisieren: filename + sha256 + featureCount + geometryType.
	wohnLayer.filename = newFilename;
	wohnLayer.sha256 = hash;
	wohnLayer.featureCount = outFc.features.length;
	wohnLayer.geometryType = 'Polygon';
	manifest.generatedAt = new Date().toISOString();
	await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n');
	process.stdout.write('[aggregate-wohnlagen] manifest updated\n');

	// Altes File optional dranlassen (Build-Pipeline könnte es noch löschen).
	process.stdout.write('[aggregate-wohnlagen] done\n');
}

main().catch((err: unknown) => {
	const msg = err instanceof Error ? err.message : String(err);
	process.stderr.write(`[aggregate-wohnlagen] FATAL: ${msg}\n`);
	process.exit(1);
});
