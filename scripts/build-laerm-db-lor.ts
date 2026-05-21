import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Feature, FeatureCollection } from 'geojson';
import { assertAllowed } from './lib/allowlist.js';
import { USER_AGENT } from './lib/user-agent.js';
import { reprojectGeoJSON } from './lib/reproject.js';
import { defaultLorIdFor } from './lib/kiez-score/pipeline.js';
import { buildLorBboxIndex, LaermDbAggregator } from './lib/laerm/aggregate-db.js';

/**
 * Story 10.6b: Per-LOR-Mittel von ges_den (L_DEN) aus 3,8 Mio Fassadenpunkten der
 * Strategischen Lärmkarte 2022. WFS-Paging, Punkt→LOR (UTM33), Mittel je Planungsraum.
 * Ausgabe static/data/laerm-db-lor.json (Build-Input für den Ruhe-Luft-Score).
 */
const LAYERS_DIR = 'static/layers';
const OUT_DIR = 'static/data';
const OUT_FILE = join(OUT_DIR, 'laerm-db-lor.json');
const WFS = 'https://gdi.berlin.de/services/wfs/ua_stratlaerm_2022';
const TYPENAME = 'ua_stratlaerm_2022:aa_fp_gesamt2022';
const PAGE = 100_000;

async function loadLorUtm33(): Promise<Feature[]> {
	const manifest = JSON.parse(await readFile(join(LAYERS_DIR, 'MANIFEST.json'), 'utf-8')) as {
		layers: { slug: string; filename: string }[];
	};
	const entry = manifest.layers.find((l) => l.slug === 'lor-planungsraum');
	if (!entry) throw new Error('MANIFEST ohne lor-planungsraum');
	const fc = JSON.parse(await readFile(join(LAYERS_DIR, entry.filename), 'utf-8')) as FeatureCollection;
	const utm33 = reprojectGeoJSON(fc, 'EPSG:4326', 'EPSG:25833');
	return utm33.features ?? [];
}

async function fetchPage(startIndex: number): Promise<Feature[]> {
	const url =
		`${WFS}?SERVICE=WFS&REQUEST=GetFeature&VERSION=2.0.0&TYPENAMES=${TYPENAME}` +
		`&OUTPUTFORMAT=application/json&COUNT=${PAGE}&STARTINDEX=${startIndex}`;
	assertAllowed(url);
	const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' } });
	if (!res.ok) throw new Error(`Lärm-WFS HTTP ${res.status} @ startIndex ${startIndex}`);
	const fc = (await res.json()) as FeatureCollection;
	return fc.features ?? [];
}

async function main(): Promise<void> {
	const lorFeatures = await loadLorUtm33();
	const index = buildLorBboxIndex(lorFeatures, (f) => defaultLorIdFor(f) ?? '');
	const agg = new LaermDbAggregator(index);

	let startIndex = 0;
	let total = 0;
	for (;;) {
		const features = await fetchPage(startIndex);
		if (features.length === 0) break;
		for (const f of features) {
			if (f.geometry?.type !== 'Point') continue;
			const [x, y] = f.geometry.coordinates as [number, number];
			const ges = f.properties?.ges_den;
			agg.add(x, y, typeof ges === 'number' ? ges : null);
		}
		total += features.length;
		console.log(`[laerm-db] ${total} Punkte verarbeitet…`);
		if (features.length < PAGE) break;
		startIndex += PAGE;
	}

	const result = agg.result();
	const records = Object.entries(result)
		.map(([plrId, v]) => ({ plrId, dbDenMean: v.dbDenMean, count: v.count }))
		.sort((a, b) => a.plrId.localeCompare(b.plrId));

	await mkdir(OUT_DIR, { recursive: true });
	await writeFile(
		OUT_FILE,
		JSON.stringify(
			{
				schemaVersion: 1,
				generatedAt: new Date().toISOString(),
				source: 'Umweltatlas Strategische Lärmkarten 2022 (ua_stratlaerm_2022:aa_fp_gesamt2022)',
				metric: 'ges_den (L_DEN) Mittel pro LOR-Planungsraum',
				records
			},
			null,
			2
		)
	);
	console.log(`[laerm-db] wrote ${records.length} LOR (von ${total} Punkten) → ${OUT_FILE}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
	main().catch((err) => {
		console.error(err);
		process.exit(1);
	});
}
