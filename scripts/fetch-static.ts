import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { SOURCES, DWD_STATIONS } from './lib/sources.js';
import { fetchOdisGeoJson } from './lib/fetchers/odis.js';
import { fetchFisBrokerWfs } from './lib/fetchers/fis-broker.js';
import { fetchOverpass } from './lib/fetchers/overpass.js';
import { fetchDwdZip, extractProduktTageswerteCsv } from './lib/fetchers/dwd-cdc.js';
import { parseDwdKlCsv, aggregateYearly } from './lib/dwd.js';
import { reprojectGeoJSON } from './lib/reproject.js';
import { simplifyGeoJSON } from './lib/simplify.js';
import { buildLayerEntry, buildManifest, validateManifest } from './lib/manifest.js';
import type { ClimateBundle, LayerEntry } from './lib/types.js';

const CACHE_DIR = '.cache';
const OUT_LAYERS = 'static/layers';
const OUT_CLIMATE = 'static/climate';

async function ensureDirs(): Promise<void> {
	for (const d of [
		join(CACHE_DIR, 'fetch'),
		join(CACHE_DIR, 'reproject'),
		join(CACHE_DIR, 'simplify'),
		OUT_LAYERS,
		OUT_CLIMATE
	]) {
		await mkdir(d, { recursive: true });
	}
}

async function fetchSource(slug: string): Promise<{ raw: string; sourceUrl: string }> {
	const source = SOURCES.find((s) => s.slug === slug);
	if (!source) throw new Error(`Unknown source slug: ${slug}`);
	switch (source.kind) {
		case 'odis':
			return { raw: await fetchOdisGeoJson(source.sourceUrl), sourceUrl: source.sourceUrl };
		case 'fis-broker':
			if (!source.typeName) throw new Error(`${slug}: typeName required for fis-broker`);
			return {
				raw: await fetchFisBrokerWfs(source.sourceUrl, source.typeName),
				sourceUrl: source.sourceUrl
			};
		case 'overpass':
			if (!source.overpassQL) throw new Error(`${slug}: overpassQL required for overpass`);
			return { raw: await fetchOverpass(source.sourceUrl, source.overpassQL), sourceUrl: source.sourceUrl };
		default:
			throw new Error(`Unsupported kind for layer source: ${slug}`);
	}
}

async function processLayer(slug: string, fetchedAt: string): Promise<LayerEntry> {
	const source = SOURCES.find((s) => s.slug === slug)!;
	const { raw } = await fetchSource(slug);
	const parsed = JSON.parse(raw);
	const wgs84 = reprojectGeoJSON(parsed, 'EPSG:4326', 'EPSG:4326');
	const simplified = await simplifyGeoJSON(JSON.stringify(wgs84), source.simplifyProfile);
	const buf = Buffer.from(simplified);
	const entry = buildLayerEntry(source, buf, fetchedAt);
	await writeFile(join(OUT_LAYERS, entry.filename), buf);
	return entry;
}

async function processClimateStation(station: (typeof DWD_STATIONS)[number]): Promise<void> {
	const fetchedAt = new Date().toISOString();
	const zip = await fetchDwdZip(station.id, 'historical');
	const csv = extractProduktTageswerteCsv(zip);
	const daily = parseDwdKlCsv(csv);
	const agg = aggregateYearly(daily);
	const bundle: ClimateBundle = {
		stationId: station.id,
		name: station.name,
		coordinates: station.coordinates,
		elevation: station.elevation,
		firstYear: station.firstYear,
		source: `DWD CDC daily KL ${station.id} historical`,
		fetchedAt,
		summerDays: agg.summerDays,
		frostDays: agg.frostDays,
		hotDays: agg.hotDays
	};
	const target = join(OUT_CLIMATE, `${station.slug}-${station.id}.json`);
	await writeFile(target, JSON.stringify(bundle, null, 2));
}

async function main(): Promise<void> {
	await ensureDirs();
	const fetchedAt = new Date().toISOString();
	const entries: LayerEntry[] = [];
	for (const source of SOURCES) {
		console.log(`[fetch] ${source.slug} (${source.kind})`);
		try {
			entries.push(await processLayer(source.slug, fetchedAt));
		} catch (err) {
			console.error(`[fetch] FAILED ${source.slug}:`, err);
			throw err;
		}
	}
	for (const station of DWD_STATIONS) {
		console.log(`[climate] ${station.slug}`);
		try {
			await processClimateStation(station);
		} catch (err) {
			console.error(`[climate] FAILED ${station.slug}:`, err);
			throw err;
		}
	}
	const manifest = buildManifest(entries, fetchedAt);
	validateManifest(manifest);
	await writeFile(join(OUT_LAYERS, 'MANIFEST.json'), JSON.stringify(manifest, null, 2));
	console.log(`[manifest] wrote ${entries.length} layers`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
	main().catch((err) => {
		console.error(err);
		process.exit(1);
	});
}
