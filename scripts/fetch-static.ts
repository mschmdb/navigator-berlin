import { mkdir, readdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { FeatureCollection } from 'geojson';
import { SOURCES, DWD_STATIONS } from './lib/sources.js';
import { fetchOdisGeoJson } from './lib/fetchers/odis.js';
import { fetchFisBrokerWfs } from './lib/fetchers/fis-broker.js';
import { fetchOverpass } from './lib/fetchers/overpass.js';
import { fetchLocalGeoJson } from './lib/fetchers/local.js';
import { overpassToGeoJSON, isOverpassResponse } from './lib/fetchers/overpass-to-geojson.js';
import { runTippecanoe } from './lib/fetchers/tippecanoe.js';
import { fetchDwdZip, extractProduktTageswerteCsv } from './lib/fetchers/dwd-cdc.js';
import { parseDwdKlCsv, aggregateYearly } from './lib/dwd.js';
import { reprojectGeoJSON, detectGeoJsonCrs } from './lib/reproject.js';
import { simplifyGeoJSON } from './lib/simplify.js';
import { mergeFeatureCollections } from './lib/merge-geojson.js';
import { buildLayerEntry, buildManifest, validateManifest } from './lib/manifest.js';
import type { ClimateBundle, GeometryType, LayerEntry } from './lib/types.js';

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

export async function fetchSource(slug: string): Promise<{ raw: string; sourceUrl: string }> {
	const source = SOURCES.find((s) => s.slug === slug);
	if (!source) throw new Error(`Unknown source slug: ${slug}`);
	switch (source.kind) {
		case 'odis':
			return { raw: await fetchOdisGeoJson(source.sourceUrl), sourceUrl: source.sourceUrl };
		case 'fis-broker': {
			if (!source.typeName) throw new Error(`${slug}: typeName required for fis-broker`);
			const primary = await fetchFisBrokerWfs(source.sourceUrl, source.typeName);
			if (!source.additionalTypeNames?.length) {
				return { raw: primary, sourceUrl: source.sourceUrl };
			}
			// Story 10.9: mehrere typeNames am selben Endpoint zu einem Output mergen.
			const extras = await Promise.all(
				source.additionalTypeNames.map((tn) => fetchFisBrokerWfs(source.sourceUrl, tn))
			);
			const merged = mergeFeatureCollections(
				[primary, ...extras].map((r) => JSON.parse(r) as FeatureCollection)
			);
			console.log(
				`[fetch] ${slug}: merged ${1 + extras.length} typeNames → ${merged.features.length} features`
			);
			return { raw: JSON.stringify(merged), sourceUrl: source.sourceUrl };
		}
		case 'overpass':
			if (!source.overpassQL) throw new Error(`${slug}: overpassQL required for overpass`);
			return {
				raw: await fetchOverpass(source.sourceUrl, source.overpassQL),
				sourceUrl: source.sourceUrl
			};
		case 'local':
			if (!source.localPath) throw new Error(`${slug}: localPath required for local`);
			return { raw: await fetchLocalGeoJson(source.localPath), sourceUrl: source.sourceUrl };
		default:
			throw new Error(`Unsupported kind for layer source: ${slug}`);
	}
}

async function cleanStaleHashFiles(slug: string): Promise<void> {
	const files = await readdir(OUT_LAYERS).catch(() => []);
	const stale = files.filter(
		(f) => /^[a-z0-9-]+\.[0-9a-f]{8}\.(geojson|pmtiles)$/.test(f) && f.startsWith(`${slug}.`)
	);
	for (const f of stale) await unlink(join(OUT_LAYERS, f));
}

function detectGeoJsonStats(geojson: string): { geometryType: GeometryType; featureCount: number } {
	try {
		const fc = JSON.parse(geojson) as FeatureCollection;
		const first = fc.features?.[0]?.geometry?.type;
		const supported: ReadonlySet<GeometryType> = new Set([
			'Point',
			'Polygon',
			'MultiPolygon',
			'LineString'
		]);
		const geometryType = (
			first && supported.has(first as GeometryType) ? first : 'Point'
		) as GeometryType;
		return { geometryType, featureCount: fc.features?.length ?? 0 };
	} catch {
		return { geometryType: 'Point', featureCount: 0 };
	}
}

async function processLayer(slug: string, fetchedAt: string): Promise<LayerEntry> {
	const source = SOURCES.find((s) => s.slug === slug)!;
	const { raw } = await fetchSource(slug);
	const parsed = JSON.parse(raw);
	const asGeoJson = isOverpassResponse(parsed) ? overpassToGeoJSON(parsed) : parsed;
	const sourceCrs = detectGeoJsonCrs(asGeoJson);
	const wgs84 = reprojectGeoJSON(asGeoJson, sourceCrs, 'EPSG:4326');
	if (sourceCrs !== 'EPSG:4326') {
		console.log(`[fetch] ${slug}: reprojected ${sourceCrs} → EPSG:4326`);
	}
	const simplified = await simplifyGeoJSON(JSON.stringify(wgs84), source.simplifyProfile);

	if (source.simplifyProfile === 'tiles') {
		const stats = detectGeoJsonStats(simplified);
		const tmpGeoJson = join(CACHE_DIR, 'tippecanoe', `${slug}.geojson`);
		const tmpPmtiles = join(CACHE_DIR, 'tippecanoe', `${slug}.pmtiles`);
		await mkdir(join(CACHE_DIR, 'tippecanoe'), { recursive: true });
		await writeFile(tmpGeoJson, simplified);
		await runTippecanoe(tmpGeoJson, tmpPmtiles, {
			layerName: source.slug,
			minZoom: source.tileMinZoom ?? source.zoomThresholds.min,
			maxZoom: source.tileMaxZoom ?? source.zoomThresholds.max,
			includeProperties: source.tileIncludeProperties
		});
		const buf = await readFile(tmpPmtiles);
		const entry = buildLayerEntry(source, buf, fetchedAt, {
			format: 'pmtiles',
			geometryType: stats.geometryType,
			featureCount: stats.featureCount
		});
		await cleanStaleHashFiles(slug);
		await writeFile(join(OUT_LAYERS, entry.filename), buf);
		return entry;
	}

	const buf = Buffer.from(simplified);
	const entry = buildLayerEntry(source, buf, fetchedAt);
	await cleanStaleHashFiles(slug);
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

function parseSlugFilter(argv: readonly string[]): readonly string[] | null {
	const positional = argv
		.slice(2)
		.filter((a) => !a.startsWith('--'))
		.map((a) => a.trim())
		.filter((a) => a.length > 0);
	return positional.length > 0 ? positional : null;
}

async function main(): Promise<void> {
	await ensureDirs();
	const strict = !process.argv.includes('--graceful');
	const slugFilter = parseSlugFilter(process.argv);
	const fetchedAt = new Date().toISOString();
	const entries: LayerEntry[] = [];
	const failed: Array<{ slug: string; error: string }> = [];

	const targetSources = slugFilter ? SOURCES.filter((s) => slugFilter.includes(s.slug)) : SOURCES;
	if (slugFilter) {
		const unknown = slugFilter.filter((s) => !SOURCES.some((src) => src.slug === s));
		if (unknown.length > 0) throw new Error(`Unknown slug(s): ${unknown.join(', ')}`);
		console.log(`[fetch] slug-filter active: ${slugFilter.join(', ')}`);
	}

	for (const source of targetSources) {
		console.log(`[fetch] ${source.slug} (${source.kind})`);
		try {
			entries.push(await processLayer(source.slug, fetchedAt));
		} catch (err) {
			const msg = err instanceof Error ? err.message : String(err);
			console.error(`[fetch] FAILED ${source.slug}: ${msg}`);
			failed.push({ slug: source.slug, error: msg });
			if (strict) throw err;
		}
	}
	if (!slugFilter) {
		for (const station of DWD_STATIONS) {
			console.log(`[climate] ${station.slug}`);
			try {
				await processClimateStation(station);
			} catch (err) {
				const msg = err instanceof Error ? err.message : String(err);
				console.error(`[climate] FAILED ${station.slug}: ${msg}`);
				failed.push({ slug: `climate:${station.slug}`, error: msg });
				if (strict) throw err;
			}
		}
	}

	// Bei slug-filter: existierendes MANIFEST mergen statt überschreiben.
	let finalEntries = entries;
	const manifestPath = join(OUT_LAYERS, 'MANIFEST.json');
	if (slugFilter) {
		const existingRaw = await readFile(manifestPath, 'utf-8').catch(() => null);
		if (existingRaw) {
			const existing = JSON.parse(existingRaw) as { layers: LayerEntry[] };
			const updatedSlugs = new Set(entries.map((e) => e.slug));
			const kept = existing.layers.filter((l) => !updatedSlugs.has(l.slug));
			finalEntries = [...kept, ...entries];
		}
	}
	const manifest = buildManifest(finalEntries, fetchedAt);
	validateManifest(manifest);
	await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
	console.log(`[manifest] wrote ${finalEntries.length} layers`);
	if (failed.length > 0) {
		console.log(`\n[summary] ${entries.length} succeeded, ${failed.length} failed:`);
		for (const f of failed) console.log(`  - ${f.slug}: ${f.error}`);
	}
}

if (import.meta.url === `file://${process.argv[1]}`) {
	main().catch((err) => {
		console.error(err);
		process.exit(1);
	});
}
