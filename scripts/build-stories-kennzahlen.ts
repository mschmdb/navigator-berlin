/**
 * Data Stories (gh-161): Kennzahlen pro Kiez und Bezirk, offline vorberechnet.
 * Quellen: vorhandene Layer und Daten plus `static/data/zensus-gehweite-lor.json`
 * (`pnpm fetch:zensus-gehweite`). Planungsraeume sind nur Rechengrundlage und
 * erscheinen nicht in der Ausgabe. Ausgabe: `static/data/stories-kennzahlen.json`.
 *
 * Run: `pnpm data:stories-kennzahlen`.
 */
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { Feature, FeatureCollection, MultiPolygon, Point, Polygon } from 'geojson';
import { isMainEntry } from './lib/is-main-entry.js';
import { loadFcBySlug, loadManifest } from './fetch-einwohner.js';
import { createPlrLocator } from './lib/stories/gehweite.js';
import {
	GRUEN_SCORE,
	HITZE_SCORE,
	buildKennzahlen,
	ordinalScore,
	type PlrKennzahlInput
} from './lib/stories/kennzahlen.js';

const EINWOHNER_FILE = 'static/data/einwohner-lor.json';
const LAERM_FILE = 'static/data/laerm-db-lor.json';
const GEHWEITE_FILE = 'static/data/zensus-gehweite-lor.json';
/** Referenzjahr der Strategischen Lärmkarte, die Datei trägt kein eigenes Datum der Quelle. */
const LAERM_STAND = '2022';
const LAERM_WFS_URL = 'https://gdi.berlin.de/services/wfs/ua_stratlaerm_2022';
export const OUT_FILE = 'static/data/stories-kennzahlen.json';

interface Source {
	name: string;
	url?: string;
	file?: string;
	stand: string;
}

type Props = Record<string, unknown>;

const str = (v: unknown): string | null => (typeof v === 'string' && v !== '' ? v : null);
const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);

async function readJson<T>(path: string, hint: string): Promise<T> {
	if (!existsSync(path)) throw new Error(`${path} fehlt. ${hint}`);
	return JSON.parse(await readFile(path, 'utf-8')) as T;
}

function propsByPlr(fc: FeatureCollection, idKey: string): Map<string, Props> {
	const map = new Map<string, Props>();
	for (const f of fc.features) {
		const p = (f.properties ?? {}) as Props;
		const id = str(p[idKey]);
		if (id) map.set(id, p);
	}
	return map;
}

function byPlrId<T extends { plrId: string }>(records: readonly T[]): Map<string, T> {
	return new Map(records.map((r) => [r.plrId, r] as const));
}

function warn(message: string): void {
	console.warn(`[stories-kennzahlen] Warnung: ${message}`);
}

function warnMissing(
	lor: Map<string, unknown>,
	altbau: Map<string, unknown>,
	ew: Map<string, unknown>,
	lm: Map<string, unknown>,
	gw: Map<string, unknown>,
	bio: Map<string, Props>,
	gruen: Map<string, Props>,
	clubsNotPoint: number
): void {
	const missing = (ids: Iterable<string>, other: Map<string, unknown>) =>
		[...ids].filter((id) => !other.has(id)).length;
	const unmapped = (layer: Map<string, Props>, scores: Readonly<Record<string, number>>) =>
		[...layer.values()].filter((p) => ordinalScore(str(p['kategorie']), scores) === null).length;

	const checks: [number, string][] = [
		[unmapped(bio, HITZE_SCORE), 'Planungsräume mit unbekannter Bioklima-Kategorie'],
		[unmapped(gruen, GRUEN_SCORE), 'Planungsräume mit unbekannter Grünversorgung-Kategorie'],
		[clubsNotPoint, 'Club-Features ohne Point-Geometrie'],
		[missing(lor.keys(), altbau), 'Planungsräume aus lor-planungsraum fehlen im Altbau-Layer'],
		[missing(altbau.keys(), ew), 'Planungsräume ohne Einwohner (einwohner-lor)'],
		[missing(altbau.keys(), lm), 'Planungsräume ohne Lärmwert (laerm-db-lor)'],
		[missing(altbau.keys(), gw), 'Planungsräume ohne Gehweite (zensus-gehweite-lor)']
	];
	for (const [count, text] of checks) if (count > 0) warn(`${count} ${text}`);
}

async function main(): Promise<void> {
	const manifest = await loadManifest();
	const entry = (slug: string) => {
		const e = manifest.layers.find((l) => l.slug === slug);
		if (!e) throw new Error(`MANIFEST ohne ${slug}`);
		return e;
	};

	const gehweite = await readJson<{
		stichtag: string;
		records: { plrId: string; einwohner: number; einwohnerMitHaltestelle: number }[];
	}>(GEHWEITE_FILE, 'Zuerst `pnpm fetch:zensus-gehweite` ausfuehren.');
	const einwohner = await readJson<{
		stichtag: string;
		records: { plrId: string; gesamt: number }[];
	}>(EINWOHNER_FILE, 'Zuerst `pnpm fetch:einwohner` ausfuehren.');
	const laerm = await readJson<{
		generatedAt: string;
		records: { plrId: string; dbDenMean: number | null; count: number }[];
	}>(LAERM_FILE, 'Zuerst `pnpm data:laerm-db` ausfuehren.');

	const [altbauFc, lorFc, bioFc, gruenFc, clubFc] = await Promise.all([
		loadFcBySlug(manifest, 'zensus-altbau-anteil-2022'),
		loadFcBySlug(manifest, 'lor-planungsraum'),
		loadFcBySlug(manifest, 'bioklima-2023'),
		loadFcBySlug(manifest, 'gruenversorgung-2023'),
		loadFcBySlug(manifest, 'kultur-club')
	]);

	const altbau = propsByPlr(altbauFc, 'plr_id');
	const lor = propsByPlr(lorFc, 'PLR_ID');
	const bio = propsByPlr(bioFc, 'plr_id');
	const gruen = propsByPlr(gruenFc, 'plr_id');
	const ew = byPlrId(einwohner.records);
	const lm = byPlrId(laerm.records);
	const gw = byPlrId(gehweite.records);

	const locate = createPlrLocator(lorFc.features as Feature<Polygon | MultiPolygon>[], (x, y) => [
		x,
		y
	]);
	const clubs = new Map<string, number>();
	let clubsOutside = 0;
	let clubsNotPoint = 0;
	for (const f of clubFc.features as Feature<Point | Polygon | MultiPolygon>[]) {
		if (f.geometry?.type !== 'Point') {
			clubsNotPoint++;
			continue;
		}
		const [lon, lat] = f.geometry.coordinates;
		const id = locate(lon, lat);
		if (id === null) clubsOutside++;
		else clubs.set(id, (clubs.get(id) ?? 0) + 1);
	}

	const inputs: PlrKennzahlInput[] = [...altbau.keys()].map((plrId) => {
		const a = altbau.get(plrId) ?? {};
		const l = lm.get(plrId);
		const g = gw.get(plrId);
		return {
			plrId,
			kiezSlug: str(a['kiez_slug']),
			bezirkSlug: str(a['bezirk_slug']),
			einwohner: ew.get(plrId)?.gesamt ?? null,
			flaecheM2: num(lor.get(plrId)?.['GROESSE_M2']),
			laermDb: l?.dbDenMean ?? null,
			laermCount: l?.count ?? null,
			altbauAnteil: num(a['altbau_anteil']),
			wohnungen: num(a['wohnungen']),
			bioklima: str(bio.get(plrId)?.['kategorie']),
			gruen: str(gruen.get(plrId)?.['kategorie']),
			clubs: clubs.get(plrId) ?? 0,
			gehweiteEinwohner: g?.einwohner ?? null,
			gehweiteMitHaltestelle: g?.einwohnerMitHaltestelle ?? null
		};
	});

	warnMissing(lor, altbau, ew, lm, gw, bio, gruen, clubsNotPoint);
	const result = buildKennzahlen(inputs);
	if (result.ohneKiez > 0) {
		console.warn(
			`[stories-kennzahlen] Warnung: ${result.ohneKiez} Planungsräume ohne Kiez oder Bezirk, nicht gezählt`
		);
	}
	if (clubsOutside > 0) {
		console.warn(
			`[stories-kennzahlen] Warnung: ${clubsOutside} Club-Punkte ausserhalb der Planungsraeume`
		);
	}

	const sourceOf = (slug: string, name: string): Source => {
		const e = entry(slug);
		return {
			name,
			url: e.sourceUrl,
			file: e.filename,
			stand: (e.sourceUpdatedAt ?? e.fetchedAt).slice(0, 10)
		};
	};
	const sources: Source[] = [
		{ name: 'Einwohner pro Planungsraum', file: EINWOHNER_FILE, stand: einwohner.stichtag },
		{
			name: 'Strategische Lärmkarte 2022 (L_DEN)',
			url: LAERM_WFS_URL,
			file: LAERM_FILE,
			stand: LAERM_STAND
		},
		sourceOf('zensus-altbau-anteil-2022', 'Zensus 2022, Altbau-Anteil'),
		sourceOf('lor-planungsraum', 'LOR-Planungsräume, Fläche'),
		sourceOf('bioklima-2023', 'Umweltatlas Bioklima 2023'),
		sourceOf('gruenversorgung-2023', 'Umweltatlas Grünversorgung 2023'),
		sourceOf('kultur-club', 'Clubs (OpenStreetMap)'),
		{
			name: 'Zensus 2022, Einwohner mit Haltestelle in 400 m',
			file: GEHWEITE_FILE,
			stand: gehweite.stichtag
		}
	];

	await mkdir(dirname(OUT_FILE), { recursive: true });
	await writeFile(
		OUT_FILE,
		`${JSON.stringify(
			{
				schemaVersion: 1,
				generatedAt: new Date().toISOString(),
				sources,
				bezirke: result.bezirke,
				kieze: result.kieze
			},
			null,
			2
		)}\n`
	);
	console.log(
		`[stories-kennzahlen] ${result.bezirke.length} Bezirke, ${result.kieze.length} Kieze → ${OUT_FILE}`
	);
}

if (isMainEntry(import.meta.url, process.argv[1])) {
	main().catch((err) => {
		console.error(err instanceof Error ? err.message : err);
		process.exit(1);
	});
}
