import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import center from '@turf/center';
import type { Feature, FeatureCollection, Point } from 'geojson';
import { SOURCES } from './lib/sources.js';
import { fetchFisBrokerWfs } from './lib/fetchers/fis-broker.js';
import { mergeFeatureCollections } from './lib/merge-geojson.js';
import { reprojectGeoJSON, detectGeoJsonCrs } from './lib/reproject.js';

/**
 * Story 10.10: klima-pet-2022 wird als PMTiles publiziert (Map). Die Build-Konsumenten
 * (build-kiez-scores, aggregate-data) brauchen aber PET-Werte als lesbare Features. Dieses
 * Script leitet ein kompaktes Punkt-Set ab: pro PET-Polygon ein Centroid mit `pet14h`.
 * Ausgabe `static/data/klima-pet-points.geojson` ist Build-Input, kein Client-Layer.
 */
const SLUG = 'klima-pet-2022';
const OUT_DIR = 'static/data';
const OUT_FILE = join(OUT_DIR, 'klima-pet-points.geojson');

function round(n: number, digits: number): number {
	const f = 10 ** digits;
	return Math.round(n * f) / f;
}

async function main(): Promise<void> {
	const source = SOURCES.find((s) => s.slug === SLUG);
	if (!source?.typeName) throw new Error(`${SLUG}: Source oder typeName fehlt`);
	const typeNames = [source.typeName, ...(source.additionalTypeNames ?? [])];
	const raws = await Promise.all(typeNames.map((tn) => fetchFisBrokerWfs(source.sourceUrl, tn)));
	const merged = mergeFeatureCollections(raws.map((r) => JSON.parse(r) as FeatureCollection));
	const wgs84 = reprojectGeoJSON(merged, detectGeoJsonCrs(merged), 'EPSG:4326');

	const points: Feature<Point>[] = [];
	for (const feat of wgs84.features) {
		const pet = feat.properties?.pet14h;
		const petNum = typeof pet === 'number' ? pet : Number.parseFloat(String(pet));
		if (!Number.isFinite(petNum)) continue;
		if (!feat.geometry) continue;
		const c = center(feat as Feature);
		const [lng, lat] = c.geometry.coordinates as [number, number];
		points.push({
			type: 'Feature',
			geometry: { type: 'Point', coordinates: [round(lng, 5), round(lat, 5)] },
			properties: { pet14h: round(petNum, 1) }
		});
	}

	await mkdir(OUT_DIR, { recursive: true });
	const fc: FeatureCollection = { type: 'FeatureCollection', features: points };
	await writeFile(OUT_FILE, JSON.stringify(fc));
	console.log(`[pet-points] wrote ${points.length} PET-Centroids → ${OUT_FILE}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
	main().catch((err) => {
		console.error(err);
		process.exit(1);
	});
}
