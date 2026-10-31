/**
 * Data Stories (gh-161): Zensus-2022-Bevoelkerungsgitter (100 m) auf LOR-Planungsraeume.
 * Pro Planungsraum: Einwohner und Einwohner mit Haltestelle (U, S, Tram, Bus) in 400 m
 * Luftlinie vom Zellmittelpunkt. Ausgabe `static/data/zensus-gehweite-lor.json` (committet,
 * Zwischenergebnis fuer `pnpm data:stories-kennzahlen`).
 *
 * Das Archiv ist ein Zip. Braucht `7zz` (`brew install sevenzip`). Run: `pnpm fetch:zensus-gehweite` (`-- --refresh` laedt das Archiv neu).
 */
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import type { Feature, FeatureCollection, MultiPolygon, Polygon } from 'geojson';
import { assertAllowed } from './lib/allowlist.js';
import { isMainEntry } from './lib/is-main-entry.js';
import { buildOepnvStopIndex } from './lib/oepnv-stop-index.js';
import { withRetry } from './lib/retry.js';
import { USER_AGENT } from './lib/user-agent.js';
import { loadFcBySlug, loadManifest } from './fetch-einwohner.js';
import { laeaToWgs84, wgs84ToLaea } from './lib/zensus/laea.js';
import type { Bbox3035 } from './lib/zensus/parse-miete-csv.js';
import { extractFrom7z } from './lib/zensus/seven-zip.js';
import { accumulateGehweite, buildStopGrid, STOP_RADIUS_M } from './lib/stories/gehweite.js';
import { parseBevoelkerungCsv } from './lib/stories/parse-bevoelkerung-csv.js';

const CACHE_DIR = '.cache/zensus';
const ARCHIVE_PATH = join(CACHE_DIR, 'Zensus2022_Bevoelkerungszahl.zip');
const ARCHIVE_URL =
	'https://www.destatis.de/static/DE/zensus/gitterdaten/Zensus2022_Bevoelkerungszahl.zip';
const CSV_PATTERN = '*100m-Gitter.csv';
const STICHTAG = '2022-05-15';
export const OUT_FILE = 'static/data/zensus-gehweite-lor.json';

/** Berlin-Zuschnitt in EPSG:3035, wie bei `fetch-zensus-altbau`. */
const BERLIN_BBOX: Bbox3035 = { minX: 4529800, maxX: 4577300, minY: 3252000, maxY: 3291800 };
const STOP_LAYERS = {
	ubahn: 'ubahn-stationen',
	sbahn: 'sbahn-stationen',
	tram: 'tram-haltestellen',
	bus: 'bus-haltestellen'
} as const;

async function downloadArchive(refresh: boolean): Promise<void> {
	if (!refresh && existsSync(ARCHIVE_PATH)) return;
	assertAllowed(ARCHIVE_URL);
	const buf = await withRetry(async () => {
		const res = await fetch(ARCHIVE_URL, { headers: { 'User-Agent': USER_AGENT } });
		if (!res.ok) throw new Error(`Zensus-Bevoelkerung ${ARCHIVE_URL} HTTP ${res.status}`);
		return Buffer.from(await res.arrayBuffer());
	});
	await mkdir(CACHE_DIR, { recursive: true });
	await writeFile(ARCHIVE_PATH, buf);
}

async function main(): Promise<void> {
	const manifest = await loadManifest();
	const plrFc = await loadFcBySlug(manifest, 'lor-planungsraum');
	const plrFeatures = plrFc.features as Feature<Polygon | MultiPolygon>[];

	const fcs = Object.fromEntries(
		await Promise.all(
			Object.entries(STOP_LAYERS).map(
				async ([modus, slug]) => [modus, await loadFcBySlug(manifest, slug)] as const
			)
		)
	) as Record<keyof typeof STOP_LAYERS, FeatureCollection>;
	const index = buildOepnvStopIndex(fcs);
	const stops = [...index.ubahn, ...index.sbahn, ...index.tram, ...index.bus].map((s) =>
		wgs84ToLaea(s.lng, s.lat)
	);
	const grid = buildStopGrid(stops);

	await downloadArchive(process.argv.includes('--refresh'));
	const csv = await extractFrom7z(ARCHIVE_PATH, CSV_PATTERN);
	const cells = parseBevoelkerungCsv(csv, BERLIN_BBOX);
	const { byPlr, outside, outsideEinwohner } = accumulateGehweite(
		cells,
		plrFeatures,
		laeaToWgs84,
		grid
	);

	const records = [...byPlr]
		.map(([plrId, s]) => ({
			plrId,
			einwohner: s.einwohner,
			einwohnerMitHaltestelle: s.mitHaltestelle
		}))
		.sort((a, b) => (a.plrId < b.plrId ? -1 : 1));
	const gesamt = records.reduce((s, r) => s + r.einwohner, 0);
	const mit = records.reduce((s, r) => s + r.einwohnerMitHaltestelle, 0);

	if (records.length === 0 || gesamt === 0) {
		throw new Error('Keine Einwohner in den Planungsraeumen gefunden, Ausgabe nicht geschrieben');
	}

	const layerEntry = (slug: string) => {
		const e = manifest.layers.find((l) => l.slug === slug);
		if (!e) throw new Error(`MANIFEST ohne ${slug}`);
		return e;
	};
	const stopEntries = Object.values(STOP_LAYERS).map(layerEntry);
	const stopStand = stopEntries.map((e) => e.fetchedAt.slice(0, 10)).sort()[0];
	const lorEntry = layerEntry('lor-planungsraum');
	const lorStand = (lorEntry.sourceUpdatedAt ?? lorEntry.fetchedAt).slice(0, 10);

	await mkdir(dirname(OUT_FILE), { recursive: true });
	await writeFile(
		OUT_FILE,
		`${JSON.stringify(
			{
				schemaVersion: 1,
				generatedAt: new Date().toISOString(),
				stichtag: STICHTAG,
				radiusM: STOP_RADIUS_M,
				sources: [
					{
						name: 'Zensus 2022, Bevölkerungszahl im 100-m-Gitter (Destatis)',
						url: ARCHIVE_URL,
						stand: STICHTAG
					},
					{
						name: 'Haltestellen U-Bahn, S-Bahn, Tram, Bus (OpenStreetMap)',
						url: stopEntries[0].sourceUrl,
						file: stopEntries.map((e) => e.filename).join(', '),
						stand: stopStand
					},
					{
						name: 'LOR-Planungsräume 2021',
						url: lorEntry.sourceUrl,
						file: lorEntry.filename,
						stand: lorStand
					}
				],
				records
			},
			null,
			2
		)}\n`
	);
	console.log(
		`[zensus-gehweite] ${cells.length} Zellen, ${stops.length} Haltestellen, ` +
			`${outside} Zellen (${outsideEinwohner} Einwohner) ausserhalb der Planungsraeume, ` +
			`${gesamt} Einwohner in ${records.length} Planungsraeumen, ` +
			`Anteil mit Haltestelle in ${STOP_RADIUS_M} m: ${((mit / gesamt) * 100).toFixed(1)} %`
	);
}

if (isMainEntry(import.meta.url, process.argv[1])) {
	main().catch((err) => {
		console.error(err);
		process.exit(1);
	});
}
