import { createHash } from 'node:crypto';
import { mkdir, readdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Feature, FeatureCollection } from 'geojson';
import { assertAllowed } from './lib/allowlist.js';
import { withRetry } from './lib/retry.js';
import { USER_AGENT } from './lib/user-agent.js';
import type { LayerEntry } from './lib/types.js';
import {
	joinEinwohnerToLor,
	type LorAreaFeature,
	type LorEinwohnerRecord
} from './lib/einwohner/einwohner.js';
import { parseEinwohnerCsv } from './lib/einwohner/parse-csv.js';

const LAYERS_DIR = 'static/layers';
const MANIFEST_PATH = join(LAYERS_DIR, 'MANIFEST.json');
const OUT_DIR = 'static/data';
const OUT_FILE = join(OUT_DIR, 'einwohner-lor.json');
const STICHTAG = '2024-12-31';
const DICHTE_SLUG = 'einwohner-dichte-2024';

// Amt für Statistik Berlin-Brandenburg, EWR-Matrix 31.12.2024 (CC BY 4.0).
// Die /opendata/-URL ist ein JS-Redirect (Scrivito-CMS) und liefert HTML statt CSV.
// DOWNLOAD ist die echte Hash-CDN-URL (Recon via Playwright gegen LIVE).
// Wenn DOWNLOAD HTML statt CSV liefert: Hash veraltet, Recon gegen LIVE neu ausführen.
const LIVE = 'https://www.statistik-berlin-brandenburg.de/opendata/EWR_L21_202412E_Matrix.csv';
const DOWNLOAD =
	'https://download.statistik-berlin-brandenburg.de/bf57f8f2d002dca0/cf0bcd27e257/EWR_L21_202412E_Matrix.csv';

interface Manifest {
	schemaVersion: number;
	generatedAt: string;
	layers: LayerEntry[];
}

async function fetchCsv(): Promise<string> {
	assertAllowed(DOWNLOAD);
	return withRetry(async () => {
		const res = await fetch(DOWNLOAD, { headers: { 'User-Agent': USER_AGENT, Accept: 'text/csv' } });
		if (!res.ok) throw new Error(`Einwohner-CSV ${DOWNLOAD} HTTP ${res.status}`);
		const text = await res.text();
		if (!/RAUMID/i.test(text.slice(0, 500))) {
			throw new Error(
				`Einwohner-CSV: kein RAUMID-Header (Hash-URL veraltet?). Recon gegen ${LIVE} neu ausführen.`
			);
		}
		return text;
	});
}

async function loadManifest(): Promise<Manifest> {
	return JSON.parse(await readFile(MANIFEST_PATH, 'utf-8')) as Manifest;
}

async function loadLorFeatures(manifest: Manifest): Promise<Feature[]> {
	const entry = manifest.layers.find((l) => l.slug === 'lor-planungsraum');
	if (!entry) throw new Error('MANIFEST ohne lor-planungsraum');
	const fc = JSON.parse(await readFile(join(LAYERS_DIR, entry.filename), 'utf-8')) as FeatureCollection;
	return fc.features ?? [];
}

function lorAreaOf(f: Feature): LorAreaFeature {
	const p = (f.properties ?? {}) as Record<string, unknown>;
	return {
		plrId: typeof p.PLR_ID === 'string' ? p.PLR_ID : '',
		areaM2: typeof p.GROESSE_M2 === 'number' ? p.GROESSE_M2 : null
	};
}

/** Choropleth-Layer: LOR-Polygone, die nur den Dichte-Wert tragen. Map-only, neutral. */
function buildDichteLayer(
	lorFeatures: Feature[],
	records: LorEinwohnerRecord[]
): FeatureCollection {
	const dichteByPlr = new Map(records.map((r) => [r.plrId, r.dichtePro_km2]));
	const features = lorFeatures.map((f): Feature => {
		const p = (f.properties ?? {}) as Record<string, unknown>;
		const plrId = typeof p.PLR_ID === 'string' ? p.PLR_ID : '';
		return {
			type: 'Feature',
			geometry: f.geometry,
			properties: { plr_id: plrId, dichte: dichteByPlr.get(plrId) ?? null }
		};
	});
	return { type: 'FeatureCollection', features };
}

async function purgeOldHashes(slug: string): Promise<void> {
	const files = await readdir(LAYERS_DIR).catch(() => []);
	for (const f of files) {
		if (new RegExp(`^${slug}\\.[0-9a-f]{8}\\.geojson$`).test(f)) await unlink(join(LAYERS_DIR, f));
	}
}

async function augmentManifest(
	manifest: Manifest,
	fc: FeatureCollection,
	generatedAt: string
): Promise<void> {
	const buf = Buffer.from(JSON.stringify(fc), 'utf-8');
	const sha = createHash('sha256').update(buf).digest('hex');
	const filename = `${DICHTE_SLUG}.${sha.slice(0, 8)}.geojson`;
	await purgeOldHashes(DICHTE_SLUG);
	await writeFile(join(LAYERS_DIR, filename), buf);
	const entry: LayerEntry = {
		slug: DICHTE_SLUG,
		filename,
		// Echte Quelle (CC BY verlangt Namensnennung): Amt für Statistik via daten.berlin.de.
		// Kein "derived"-Dummy, damit die Layer-Page korrekt den Datenanbieter verlinkt.
		sourceUrl:
			'https://daten.berlin.de/datensaetze/einwohnerinnen-und-einwohner-in-berlin-in-lor-planungsraumen-am-31-12-2024',
		fetchedAt: generatedAt,
		sourceUpdatedAt: `${STICHTAG}T00:00:00.000Z`,
		license: 'CC BY 4.0',
		sha256: sha,
		bundleGroup: 'I: Demografie',
		zoomThresholds: { min: 9, max: 18 },
		geometryType: 'MultiPolygon',
		featureCount: fc.features.length,
		inspectorRelevant: false,
		mapRelevant: true
	};
	const merged = [...manifest.layers.filter((l) => l.slug !== DICHTE_SLUG), entry];
	const next: Manifest = { schemaVersion: 1, generatedAt: manifest.generatedAt, layers: merged };
	await writeFile(MANIFEST_PATH, JSON.stringify(next, null, 2));
	console.log(`[einwohner] augmented MANIFEST.json with ${DICHTE_SLUG}`);
}

async function main(): Promise<void> {
	const manifest = await loadManifest();
	const [csv, lorFeatures] = await Promise.all([fetchCsv(), loadLorFeatures(manifest)]);
	const rows = parseEinwohnerCsv(csv);
	const records = joinEinwohnerToLor(rows, lorFeatures.map(lorAreaOf));

	const generatedAt = new Date().toISOString();
	await mkdir(OUT_DIR, { recursive: true });
	await writeFile(
		OUT_FILE,
		JSON.stringify({ schemaVersion: 1, generatedAt, stichtag: STICHTAG, records }, null, 2)
	);
	console.log(`[einwohner] wrote ${records.length} records`);

	await augmentManifest(manifest, buildDichteLayer(lorFeatures, records), generatedAt);
}

if (import.meta.url === `file://${process.argv[1]}`) {
	main().catch((err) => {
		console.error(err);
		process.exit(1);
	});
}
