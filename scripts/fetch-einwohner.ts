import { createHash } from 'node:crypto';
import { mkdir, readdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Feature, FeatureCollection } from 'geojson';
import { assertAllowed } from './lib/allowlist.js';
import { withRetry } from './lib/retry.js';
import { USER_AGENT } from './lib/user-agent.js';
import type { LayerEntry } from './lib/types.js';
import {
	aggregateEinwohner,
	joinEinwohnerToLor,
	type AggregatedEinwohnerRecord,
	type LorAreaFeature,
	type LorEinwohnerRecord
} from './lib/einwohner/einwohner.js';
import { parseEinwohnerCsv } from './lib/einwohner/parse-csv.js';
import { buildKiezSlugs } from '../src/lib/data/internal/kiez-slug.js';
import { normalizeSlug } from '../src/lib/data/internal/slug.js';

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
		const res = await fetch(DOWNLOAD, {
			headers: { 'User-Agent': USER_AGENT, Accept: 'text/csv' }
		});
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
	const fc = JSON.parse(
		await readFile(join(LAYERS_DIR, entry.filename), 'utf-8')
	) as FeatureCollection;
	return fc.features ?? [];
}

async function loadFcBySlug(manifest: Manifest, slug: string): Promise<FeatureCollection> {
	const entry = manifest.layers.find((l) => l.slug === slug);
	if (!entry) throw new Error(`MANIFEST ohne ${slug}`);
	return JSON.parse(await readFile(join(LAYERS_DIR, entry.filename), 'utf-8')) as FeatureCollection;
}

/** Bezirk-Code (2-stellig, = plrId.slice(0,2)) → Gemeinde_name aus dem Bezirke-Layer. */
function bezCodeToName(bezFc: FeatureCollection): Map<string, string> {
	const m = new Map<string, string>();
	for (const f of bezFc.features) {
		const p = (f.properties ?? {}) as Record<string, unknown>;
		const schluessel = p.Schluessel_gesamt;
		const name = p.Gemeinde_name;
		if (typeof schluessel === 'string' && typeof name === 'string')
			m.set(schluessel.slice(-2), name);
	}
	return m;
}

/**
 * BZR_ID (6-stellig, = plrId.slice(0,6)) → disambiguierter Kiez-Slug. Reuse
 * buildKiezSlugs über ALLE Bezirksregionen, damit die Slugs exakt den von
 * resolveSpatialLevel erzeugten entsprechen (Heerstraße-Disambiguierung).
 */
function bzrIdToSlug(bzrFc: FeatureCollection, bezNames: Map<string, string>): Map<string, string> {
	const props = bzrFc.features.map((f) => (f.properties ?? {}) as Record<string, unknown>);
	const refs = props.map((p) => ({
		name: typeof p.BZR_NAME === 'string' ? p.BZR_NAME : '',
		bezirk: bezNames.get(typeof p.BEZ === 'string' ? p.BEZ : '') ?? ''
	}));
	const slugs = buildKiezSlugs(refs);
	const m = new Map<string, string>();
	props.forEach((p, i) => {
		if (typeof p.BZR_ID === 'string') m.set(p.BZR_ID, slugs[i]);
	});
	return m;
}

function remapToSlug(
	agg: Map<string, AggregatedEinwohnerRecord>,
	idToSlug: Map<string, string>
): Record<string, AggregatedEinwohnerRecord> {
	const out: Record<string, AggregatedEinwohnerRecord> = {};
	for (const [id, rec] of agg) {
		const slug = idToSlug.get(id);
		if (slug) out[slug] = rec;
	}
	return out;
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
	const [csv, lorFeatures, bzrFc, bezFc] = await Promise.all([
		fetchCsv(),
		loadLorFeatures(manifest),
		loadFcBySlug(manifest, 'lor-bezirksregion'),
		loadFcBySlug(manifest, 'bezirke')
	]);
	const rows = parseEinwohnerCsv(csv);
	const areaFeatures = lorFeatures.map(lorAreaOf);
	const records = joinEinwohnerToLor(rows, areaFeatures);

	// Flächengewichtete Aggregate auf Kiez (BZR_ID = plrId[0:6]) + Bezirk (= plrId[0:2]),
	// gekeyed mit denselben Slugs wie resolveSpatialLevel (Story 10.5 Scope-Umschaltung).
	const areaByPlr = new Map<string, number | null>(areaFeatures.map((a) => [a.plrId, a.areaM2]));
	const bezNames = bezCodeToName(bezFc);
	const kiezAgg = aggregateEinwohner(rows, areaByPlr, (id) =>
		id.length >= 6 ? id.slice(0, 6) : null
	);
	const bezirkAgg = aggregateEinwohner(rows, areaByPlr, (id) =>
		id.length >= 2 ? id.slice(0, 2) : null
	);
	const kiez = remapToSlug(kiezAgg, bzrIdToSlug(bzrFc, bezNames));
	const bezCodeToSlug = new Map<string, string>(
		[...bezNames].map(([code, name]) => [code, normalizeSlug(name)])
	);
	const bezirk = remapToSlug(bezirkAgg, bezCodeToSlug);

	const generatedAt = new Date().toISOString();
	await mkdir(OUT_DIR, { recursive: true });
	await writeFile(
		OUT_FILE,
		JSON.stringify(
			{ schemaVersion: 2, generatedAt, stichtag: STICHTAG, records, kiez, bezirk },
			null,
			2
		)
	);
	console.log(
		`[einwohner] wrote ${records.length} PLR · ${Object.keys(kiez).length} Kiez · ${Object.keys(bezirk).length} Bezirk`
	);

	await augmentManifest(manifest, buildDichteLayer(lorFeatures, records), generatedAt);
}

if (import.meta.url === `file://${process.argv[1]}`) {
	main().catch((err) => {
		console.error(err);
		process.exit(1);
	});
}
