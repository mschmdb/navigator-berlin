/**
 * Layer "Altbau-Anteil (Zensus 2022)": Destatis-Gitterdaten (100m, Baujahresklassen) auf
 * LOR-Planungsraeume.
 *
 * Gebietswert = Wohnungen in Gebaeuden vor 1949 / alle Wohnungen. Planungsraeume mit weniger
 * als 30 Wohnungen zeigen "keine Angabe". Das Archiv ist 7-Zip (trotz .zip-Endung) und liegt
 * in `.cache/`. Braucht `7zz` (`brew install sevenzip`).
 *
 * Run: `pnpm fetch:zensus-altbau`. Danach `pnpm data:layer-aggregate` fuer Kiez/Bezirk.
 */
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Feature, FeatureCollection, MultiPolygon, Polygon } from 'geojson';
import { assertAllowed } from './lib/allowlist.js';
import { withRetry } from './lib/retry.js';
import { USER_AGENT } from './lib/user-agent.js';
import type { LayerEntry } from './lib/types.js';
import {
	bezCodeToName,
	bzrIdToSlug,
	loadFcBySlug,
	loadManifest,
	purgeOldHashes,
	type Manifest
} from './fetch-einwohner.js';
import { normalizeSlug } from '../src/lib/data/internal/slug.js';
import { accumulateByPlr } from './lib/zensus/assign-cells.js';
import { ZENSUS_ALTBAU_SLUG, addAltbauCell, buildAltbauLayer } from './lib/zensus/altbau.js';
import { laeaToWgs84 } from './lib/zensus/laea.js';
import { parseAltbauCsv, type AltbauParseStats } from './lib/zensus/parse-altbau-csv.js';
import type { Bbox3035 } from './lib/zensus/parse-miete-csv.js';
import { extractFrom7z } from './lib/zensus/seven-zip.js';
import { MIN_WOHNUNGEN, mergeAccumulators, meanFromSums } from './lib/zensus/weighted-mean.js';

const LAYERS_DIR = 'static/layers';
const MANIFEST_PATH = join(LAYERS_DIR, 'MANIFEST.json');
const CACHE_DIR = '.cache/zensus';
const ARCHIVE_PATH = join(CACHE_DIR, 'Wohnungen_mod_MZ_Baujahresklassen_in_Gitterzellen.7z');
const ARCHIVE_URL =
	'https://www.destatis.de/static/DE/zensus/gitterdaten/Wohnungen_mod_MZ_Baujahresklassen_in_Gitterzellen.zip';
const CSV_PATTERN = '*100m-Gitterzellen.csv';
const STICHTAG = '2022-05-15';

/** Berlin-Zuschnitt in EPSG:3035 (grob, Point-in-Polygon entscheidet danach exakt). */
const BERLIN_BBOX: Bbox3035 = { minX: 4529800, maxX: 4577300, minY: 3252000, maxY: 3291800 };

async function downloadArchive(): Promise<void> {
	assertAllowed(ARCHIVE_URL);
	const buf = await withRetry(async () => {
		const res = await fetch(ARCHIVE_URL, { headers: { 'User-Agent': USER_AGENT } });
		if (!res.ok) throw new Error(`Zensus-Altbau ${ARCHIVE_URL} HTTP ${res.status}`);
		return Buffer.from(await res.arrayBuffer());
	});
	await mkdir(CACHE_DIR, { recursive: true });
	await writeFile(ARCHIVE_PATH, buf);
}

async function writeLayer(manifest: Manifest, fc: FeatureCollection, now: string): Promise<void> {
	const buf = Buffer.from(JSON.stringify(fc), 'utf-8');
	const sha = createHash('sha256').update(buf).digest('hex');
	const filename = `${ZENSUS_ALTBAU_SLUG}.${sha.slice(0, 8)}.geojson`;
	await writeFile(join(LAYERS_DIR, filename), buf);
	const entry: LayerEntry = {
		slug: ZENSUS_ALTBAU_SLUG,
		filename,
		sourceUrl: ARCHIVE_URL,
		fetchedAt: now,
		sourceUpdatedAt: `${STICHTAG}T00:00:00.000Z`,
		license: 'dl-de/by-2-0',
		sha256: sha,
		bundleGroup: 'B: Wohn-Daten',
		zoomThresholds: { min: 9, max: 18 },
		geometryType: 'Polygon',
		featureCount: fc.features.length,
		inspectorRelevant: true,
		mapRelevant: true
	};
	const layers = [...manifest.layers.filter((l) => l.slug !== ZENSUS_ALTBAU_SLUG), entry];
	const next: Manifest = { schemaVersion: 1, generatedAt: manifest.generatedAt, layers };
	await writeFile(MANIFEST_PATH, `${JSON.stringify(next, null, 2)}\n`);
	await purgeOldHashes(ZENSUS_ALTBAU_SLUG, filename);
}

async function main(): Promise<void> {
	const manifest = await loadManifest();
	const [plrFc, bzrFc, bezFc] = await Promise.all([
		loadFcBySlug(manifest, 'lor-planungsraum'),
		loadFcBySlug(manifest, 'lor-bezirksregion'),
		loadFcBySlug(manifest, 'bezirke')
	]);
	const plrFeatures = plrFc.features as Feature<Polygon | MultiPolygon>[];

	await downloadArchive();
	const csv = await extractFrom7z(ARCHIVE_PATH, CSV_PATTERN);
	const parseStats: AltbauParseStats = { clamped: 0, dropped: 0 };
	const cells = parseAltbauCsv(csv, BERLIN_BBOX, parseStats);
	const { byPlr, outside } = accumulateByPlr(cells, plrFeatures, laeaToWgs84, (acc, c) =>
		addAltbauCell(acc, c.wohnungen, c.altbau)
	);

	const bezNames = bezCodeToName(bezFc);
	const bezirkSlugByCode = new Map(
		[...bezNames].map(([code, name]) => [code, normalizeSlug(name)] as const)
	);
	const fc = buildAltbauLayer(plrFeatures, byPlr, bzrIdToSlug(bzrFc, bezNames), bezirkSlugByCode);

	const total = mergeAccumulators([...byPlr.values()]);
	const berlin = meanFromSums(total.mieteSumme, total.wohnungen);
	const noValue = fc.features.filter((f) => f.properties?.altbau_anteil === null).length;
	console.log(
		`[zensus-altbau] ${cells.length} Zellen in BBox, ${outside} ausserhalb Berlin, ` +
			`${total.wohnungen} Wohnungen, Berlin-Anteil vor 1949 ${berlin} %, ` +
			`${noValue} Planungsraeume ohne Angabe (< ${MIN_WOHNUNGEN} Wohnungen), ` +
			`${parseStats.clamped} Zellen auf Zellsumme gekappt, ${parseStats.dropped} Zellen ohne Wohnungen verworfen`
	);

	await writeLayer(manifest, fc, new Date().toISOString());
	console.log(`[zensus-altbau] MANIFEST.json um ${ZENSUS_ALTBAU_SLUG} ergaenzt`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
	main().catch((err) => {
		console.error(err);
		process.exit(1);
	});
}
