import type { ShapefilePack } from './sbb-geo-fetcher.js';
import { pickUwb3 } from '../../../src/lib/data/wahl-geo-mapping.js';

interface MapshaperApi {
	applyCommands: (
		cmd: string,
		input: Record<string, Buffer | Uint8Array | string>
	) => Promise<Record<string, Uint8Array>>;
}

/**
 * SBB schreibt teilweise `ANSI 1252` in die .cpg statt iconv-kompatibler Codepage-Namen.
 * Map auf `windows-1252` damit mapshaper's iconv-lite decoder durchläuft.
 */
function normalizeCpg(cpg: Buffer): Buffer {
	const txt = cpg.toString('utf-8').trim().toLowerCase();
	if (txt.startsWith('ansi') && txt.includes('1252')) {
		return Buffer.from('windows-1252', 'utf-8');
	}
	return cpg;
}

/** Feld-Name der Briefwahlbezirks-Nummer im Shapefile, je Geo-Slug (Story 17,
 * Recon 23.09. gegen echte Shapefile-Spalten verifiziert). `ah23` fehlt
 * bewusst -- Wahllokale-Format, nicht Choropleth-tauglich. */
const BWB_FIELD_BY_GEO_SLUG: Readonly<Record<string, string>> = {
	ah16: 'BWB',
	btw17: 'BWB2',
	ah21: 'BWB3',
	ah26: 'BWB3',
	bt25: 'BWB3'
};

/**
 * Roh-Dissolve-Schlüssel für eine Urnen-Fläche: BEZ + der Briefwahlbezirks-
 * Rohwert (Feld variiert je Geo-Slug). Bewusst wahl-slug-frei -- eine
 * Geometrie-Generation (z. B. ah21) trägt EINE physische Briefwahlbezirk-
 * Einteilung, die für alle Wahlen dieser Generation gleich ist (BTW21 UND
 * AGH21/23 UND BVV21/23 teilen sich denselben Layer). Kein Format-Match
 * gegen die DB-uwbId nötig -- das übernimmt `gruppeIdFromGeo` zur Laufzeit
 * pro Wahl-Slug auf denselben (dissolvierten) Properties.
 */
export function rawGruppeSchluessel(
	props: Record<string, unknown>,
	geoSlug: string
): string | null {
	const field = BWB_FIELD_BY_GEO_SLUG[geoSlug];
	if (!field) return null;
	const bez = typeof props.BEZ === 'string' ? props.BEZ.padStart(2, '0') : null;
	const raw = props[field];
	if (!bez || typeof raw !== 'string' || raw.trim() === '') return null;
	return `${bez}_${raw.trim().toUpperCase()}`;
}

/**
 * Dissolviert eine Urnen-Stimmbezirks-GeoJSON zu Briefwahl-Gruppen (Story 17:
 * Briefwahl-Gruppen als kleinste Kartenebene). Jede Fläche = alle
 * Urnen-Stimmbezirke mit demselben Briefwahlbezirk. Bewahrt BEZ/BWK/BWB/
 * BWB2/BWB3 auf der dissolvierten Fläche (erster Wert je Gruppe -- innerhalb
 * einer Gruppe identisch, weil der Dissolve-Schlüssel `_GRP` selbst schon
 * `BEZ` enthält, siehe `rawGruppeSchluessel`: zwei Urnen mit demselben
 * `_GRP` haben also zwangsläufig dasselbe `BEZ`), damit `gruppeIdFromGeo`
 * zur Laufzeit pro Wahl-Slug denselben Schlüssel wie auf den Urnen-Flächen
 * bilden kann.
 *
 * Wirft, wenn eine Fläche keinen Dissolve-Schlüssel bilden kann (leere BWB-
 * Spalte, Preflight-Edge-Case "leere BWB") -- kein stilles Weglassen.
 */
export async function dissolveGruppen(geojsonStr: string, geoSlug: string): Promise<string> {
	const mapshaper = (await import('mapshaper')) as unknown as {
		default?: MapshaperApi;
	} & MapshaperApi;
	const api: MapshaperApi = mapshaper.default ?? (mapshaper as MapshaperApi);

	const fc = JSON.parse(geojsonStr) as { features: { properties: Record<string, unknown> }[] };
	let unresolved = 0;
	for (const f of fc.features) {
		const key = rawGruppeSchluessel(f.properties, geoSlug);
		if (!key) {
			unresolved++;
			continue;
		}
		f.properties._GRP = key;
	}
	if (unresolved > 0) {
		throw new Error(
			`dissolveGruppen(${geoSlug}): ${unresolved} Urnen-Fläche(n) ohne Briefwahlbezirk-Feld -- Build-Abbruch (Preflight "leere BWB")`
		);
	}

	// Mitglieds-Stimmbezirke je Gruppe (Tooltip/Ergebnis-Panel-Text "Stimmbezirke
	// 726, 727 und Briefwahl 7P", Boundary "Always"): vorab in JS gebündelt statt
	// über mapshapers `collect()`, weil UWB3 nicht auf allen Geo-Generationen
	// existiert (`pickUwb3`-Fallback-Kette übernimmt UWB/WB).
	const uwb3ByGrp = new Map<string, Set<string>>();
	for (const f of fc.features) {
		const grp = f.properties._GRP as string;
		const uwb3 = pickUwb3(f.properties);
		if (!uwb3) continue;
		const set = uwb3ByGrp.get(grp) ?? new Set<string>();
		set.add(uwb3);
		uwb3ByGrp.set(grp, set);
	}
	for (const f of fc.features) {
		const grp = f.properties._GRP as string;
		const members = [...(uwb3ByGrp.get(grp) ?? [])].sort();
		f.properties._MEMBERS = members.join(',');
	}

	const cmd =
		'-i in.json ' +
		'-dissolve _GRP copy-fields=BEZ,BWK,BWB,BWB2,BWB3,_MEMBERS ' +
		'-clean ' +
		'-o format=geojson precision=0.00001 out.json';

	const output = await api.applyCommands(cmd, { 'in.json': JSON.stringify(fc) });
	const file = output['out.json'];
	if (!file) throw new Error('mapshaper: dissolve out.json not produced');
	const outFc = JSON.parse(Buffer.from(file).toString('utf-8')) as {
		features: { properties: Record<string, unknown> }[];
	};
	// Interner Dissolve-Schlüssel, nicht Teil des öffentlichen Layer-Contracts
	// (Client baut den Gruppen-Join-Key selbst via `gruppeIdFromGeo`). `MEMBERS`
	// (ohne Unterstrich-Präfix) bleibt öffentlich -- Tooltip-/Panel-Text.
	for (const f of outFc.features) {
		f.properties.MEMBERS = f.properties._MEMBERS;
		delete f.properties._GRP;
		delete f.properties._MEMBERS;
	}
	return JSON.stringify(outFc);
}

/**
 * mapshaper-Pipeline: Shapefile (EPSG:25833) → WGS84-GeoJSON, simplified.
 * Pattern aus scripts/lib/simplify.ts, erweitert um Shapefile-Multi-Input.
 */
export async function shapefileToGeoJSON(pack: ShapefilePack): Promise<string> {
	const mapshaper = (await import('mapshaper')) as unknown as {
		default?: MapshaperApi;
	} & MapshaperApi;
	const api: MapshaperApi = mapshaper.default ?? (mapshaper as MapshaperApi);

	const inputs: Record<string, Buffer> = {
		'in.shp': pack.shp,
		'in.dbf': pack.dbf,
		'in.prj': pack.prj
	};
	if (pack.cpg) inputs['in.cpg'] = normalizeCpg(pack.cpg);
	if (pack.shx) inputs['in.shx'] = pack.shx;

	const cmd =
		'-i in.shp ' +
		'-proj wgs84 ' +
		'-simplify visvalingam weighted 8% keep-shapes ' +
		'-clean ' +
		'-o format=geojson precision=0.00001 out.json';

	const output = await api.applyCommands(cmd, inputs);
	const file = output['out.json'];
	if (!file) throw new Error('mapshaper: out.json not produced');
	return Buffer.from(file).toString('utf-8');
}
