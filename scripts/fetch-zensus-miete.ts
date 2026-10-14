/**
 * Layer "Bestandsmiete Zensus 2022": Destatis-Gitterdaten (100m) auf LOR-Planungsraeume.
 *
 * Gebietswert = Summe(Miete x Wohnungen) / Summe Wohnungen. Planungsraeume mit weniger als
 * 30 vermieteten Wohnungen zeigen "keine Angabe". Das ZIP bleibt im Speicher.
 *
 * Run: `pnpm fetch:zensus-miete`. Danach `pnpm data:layer-aggregate` fuer Kiez/Bezirk.
 */
import { createHash } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import AdmZip from 'adm-zip';
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
import { buildMieteLayer, ZENSUS_MIETE_SLUG } from './lib/zensus/build-layer.js';
import { laeaToWgs84 } from './lib/zensus/laea.js';
import { parseMieteCsv, type Bbox3035 } from './lib/zensus/parse-miete-csv.js';
import { MIN_WOHNUNGEN, mergeAccumulators, meanFromSums } from './lib/zensus/weighted-mean.js';

const LAYERS_DIR = 'static/layers';
const MANIFEST_PATH = join(LAYERS_DIR, 'MANIFEST.json');
const ZIP_URL =
	'https://www.destatis.de/static/DE/zensus/gitterdaten/Durchschnittliche_Nettokaltmiete_und_Anzahl_der_Wohnungen.zip';
const CSV_SUFFIX = '100m-Gitter.csv';
const STICHTAG = '2022-05-15';

/** Berlin-Zuschnitt in EPSG:3035 (grob, Point-in-Polygon entscheidet danach exakt). */
const BERLIN_BBOX: Bbox3035 = { minX: 4529800, maxX: 4577300, minY: 3252000, maxY: 3291800 };

async function downloadZip(): Promise<Buffer> {
	assertAllowed(ZIP_URL);
	return withRetry(async () => {
		const res = await fetch(ZIP_URL, { headers: { 'User-Agent': USER_AGENT } });
		if (!res.ok) throw new Error(`Zensus-Miete ${ZIP_URL} HTTP ${res.status}`);
		return Buffer.from(await res.arrayBuffer());
	});
}

function extractCsv(zip: Buffer): Buffer {
	const entry = new AdmZip(zip).getEntries().find((e) => e.entryName.endsWith(CSV_SUFFIX));
	if (!entry) throw new Error(`Zensus-Miete-ZIP ohne Datei *${CSV_SUFFIX}`);
	return entry.getData();
}

async function writeLayer(manifest: Manifest, fc: FeatureCollection, now: string): Promise<void> {
	const buf = Buffer.from(JSON.stringify(fc), 'utf-8');
	const sha = createHash('sha256').update(buf).digest('hex');
	const filename = `${ZENSUS_MIETE_SLUG}.${sha.slice(0, 8)}.geojson`;
	await writeFile(join(LAYERS_DIR, filename), buf);
	const entry: LayerEntry = {
		slug: ZENSUS_MIETE_SLUG,
		filename,
		sourceUrl: ZIP_URL,
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
	const layers = [...manifest.layers.filter((l) => l.slug !== ZENSUS_MIETE_SLUG), entry];
	const next: Manifest = { schemaVersion: 1, generatedAt: manifest.generatedAt, layers };
	await writeFile(MANIFEST_PATH, `${JSON.stringify(next, null, 2)}\n`);
	await purgeOldHashes(ZENSUS_MIETE_SLUG, filename);
}

async function main(): Promise<void> {
	const manifest = await loadManifest();
	const [plrFc, bzrFc, bezFc] = await Promise.all([
		loadFcBySlug(manifest, 'lor-planungsraum'),
		loadFcBySlug(manifest, 'lor-bezirksregion'),
		loadFcBySlug(manifest, 'bezirke')
	]);
	const plrFeatures = plrFc.features as Feature<Polygon | MultiPolygon>[];

	const cells = parseMieteCsv(extractCsv(await downloadZip()), BERLIN_BBOX);
	const { byPlr, outside } = accumulateByPlr(cells, plrFeatures, laeaToWgs84);

	const bezNames = bezCodeToName(bezFc);
	const bezirkSlugByCode = new Map(
		[...bezNames].map(([code, name]) => [code, normalizeSlug(name)] as const)
	);
	const fc = buildMieteLayer(plrFeatures, byPlr, bzrIdToSlug(bzrFc, bezNames), bezirkSlugByCode);

	const total = mergeAccumulators([...byPlr.values()]);
	const berlin = meanFromSums(total.mieteSumme, total.wohnungen);
	const noValue = fc.features.filter((f) => f.properties?.miete === null).length;
	const nurKlammern = [...byPlr.values()].filter(
		(acc) => acc.wohnungen >= MIN_WOHNUNGEN && acc.sichereZellen === 0
	).length;
	console.log(
		`[zensus-miete] ${cells.length} Zellen in BBox, ${outside} ausserhalb Berlin, ` +
			`${total.wohnungen} Wohnungen, Berlin-Mittel ${berlin} EUR/m2, ` +
			`${noValue} Planungsraeume ohne Angabe (davon ${nurKlammern} nur KLAMMERN-Zellen, Rest < ${MIN_WOHNUNGEN} Wohnungen)`
	);

	await writeLayer(manifest, fc, new Date().toISOString());
	console.log(`[zensus-miete] MANIFEST.json um ${ZENSUS_MIETE_SLUG} ergaenzt`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
	main().catch((err) => {
		console.error(err);
		process.exit(1);
	});
}
