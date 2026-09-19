/**
 * Wahl→Geometrie-Wissen: einzige Quelle für Wahl-Slug-Bildung,
 * Wahl→Geo-Layer-Mapping und uwbId-Format-Konvertierung (Story: Geo-Mapping
 * auf eine Quelle konsolidieren).
 *
 * Pures TS ohne `$lib`/`$app`/`$env`-Imports, damit `tsx`-Build-Skripte
 * dieses Modul relativ importieren können (Vorbild: internal/slug.ts).
 * `scripts/wahlen/lib/sbb-geo-sources.ts`, `scripts/wahlen/lib/kiez-mapper.ts`
 * und alle API-Routen/Komponenten delegieren hierher.
 *
 * Wahlen ohne Eintrag (btw13, agh11, bvv11) haben keine Geometrie →
 * Choropleth fällt auf Bezirks-12-Polygone zurück.
 *
 * agh23/bvv23 = Wiederholungswahl Sept 2023 auf den unveränderten
 * Wahlbezirken vom Sept 2021 → mapping auf ah21 (Polygone). Der eigene
 * ah23-Layer enthält Wahllokal-Punkte statt Polygone und ist für
 * Choropleth ungeeignet.
 */
export const WAHL_TO_GEO: ReadonlyMap<string, string> = new Map([
	['btw17', 'btw17'],
	['btw21', 'ah21'],
	['btw25', 'bt25'],
	['agh16', 'ah16'],
	['agh21', 'ah21'],
	['agh23', 'ah21'],
	['bvv16', 'ah16'],
	['bvv21', 'ah21'],
	['bvv23', 'ah21']
]);

export function wahlSlugFromTypJahr(typ: 'btw' | 'agh' | 'bvv', jahr: number): string {
	const jj = String(jahr).slice(-2);
	return `${typ}${jj}`;
}

/** Geo-Layer-Slug für einen Wahl-Slug, oder `null` ohne verfügbare Geometrie. */
export function geoSlugForWahl(wahlSlug: string): string | null {
	return WAHL_TO_GEO.get(wahlSlug) ?? null;
}

/** Ob für einen Wahl-Slug eine Stimmbezirks-Geometrie existiert. */
export function hasGeometry(wahlSlug: string): boolean {
	return WAHL_TO_GEO.has(wahlSlug);
}

/**
 * Umkehrung von WAHL_TO_GEO: alle Wahl-Slugs, die einen Geo-Slug konsumieren.
 * Quelle für `GeoSource.consumesWahlen` in sbb-geo-sources.ts, damit dort
 * keine zweite, manuell gepflegte Kopie entsteht.
 */
export function wahlenForGeo(geoSlug: string): string[] {
	const out: string[] = [];
	for (const [wahlSlug, g] of WAHL_TO_GEO) {
		if (g === geoSlug) out.push(wahlSlug);
	}
	return out;
}

/**
 * Jahr → Geo-Layer-Slug, für die geometry-Route, die nur `year` (nicht
 * `typ`) kennt. Vergleicht jahr-exakt gegen das Volljahr der Wahl-Slugs
 * (2000er-Jahrhundert), Out-of-Range-Jahre liefern `null`. Bricht, sobald
 * ein Jahr zwei unterschiedliche Geometrien für btw/agh/bvv hätte —
 * aktuell (2016/2017/2021/2023/2025) ist das nicht der Fall.
 */
export function geoSlugForYear(year: number): string | null {
	for (const [wahlSlug, geoSlug] of WAHL_TO_GEO) {
		if (2000 + Number(wahlSlug.slice(-2)) === year) return geoSlug;
	}
	return null;
}

/** Roh-Properties eines Wahlbezirks-Geo-Features (Shapefile-Spaltennamen). */
export type GeoUwbProps = Record<string, unknown>;

/**
 * Extrahiert die 3-stellige Wahlbezirksnummer aus den Geo-Feature-Properties.
 * Reihenfolge: UWB3 (falls vorhanden) → UWB (5-stellig wird auf die letzten
 * 3 Stellen geslict, kürzere Werte unverändert) → WB (AH23-Wahllokale-Format).
 */
export function pickUwb3(props: GeoUwbProps): string | null {
	if (typeof props.UWB3 === 'string') return props.UWB3;
	if (typeof props.UWB === 'string') {
		const u = props.UWB;
		return u.length === 5 ? u.slice(2) : u;
	}
	if (typeof props.WB === 'string') return props.WB;
	return null;
}

/**
 * Baut die DB-uwbId aus Geo-Feature-Properties für einen Wahl-Slug.
 *
 * | Wahl          | DB-Format                          |
 * |---------------|-------------------------------------|
 * | BTW 21/25     | `${BWK}-${BEZ}-${UWB3}-0`            |
 * | BTW 17        | `${BWK}-${BEZ}-${BEZ}W${UWB3}-0`     |
 * | AGH/BVV 16-23 | `${BEZ}W${UWB3}` (ohne `-W`-Suffix)  |
 *
 * Die Forward-Richtung liefert für AGH/BVV bewusst ohne `-W`-Suffix; das
 * Matching funktioniert, weil die DB ohne Suffix speichert. Nur die
 * geometry-Route macht einen Reverse-Lookup und deckt über
 * `candidateDbUwbIds` zusätzlich die `-W`-Variante ab.
 */
export function dbUwbIdFromGeo(props: GeoUwbProps, wahlSlug: string): string | null {
	const bez = typeof props.BEZ === 'string' ? props.BEZ.padStart(2, '0') : null;
	const uwb3 = pickUwb3(props);
	if (!bez || !uwb3) return null;

	if (wahlSlug === 'btw21' || wahlSlug === 'btw25') {
		const bwk = typeof props.BWK === 'string' ? props.BWK.padStart(3, '0') : null;
		if (!bwk) return null;
		return `${bwk}-${bez}-${uwb3}-0`;
	}

	if (wahlSlug === 'btw17') {
		const bwk = typeof props.BWK === 'string' ? props.BWK.padStart(3, '0') : null;
		if (!bwk) return null;
		return `${bwk}-${bez}-${bez}W${uwb3}-0`;
	}

	if (
		wahlSlug === 'agh16' ||
		wahlSlug === 'agh21' ||
		wahlSlug === 'agh23' ||
		wahlSlug === 'bvv16' ||
		wahlSlug === 'bvv21' ||
		wahlSlug === 'bvv23'
	) {
		return `${bez}W${uwb3}`;
	}

	return null;
}

/**
 * Reverse-Lookup für die geometry-Route: alle plausiblen DB-uwbId-Varianten
 * für ein Geo-Feature, unabhängig vom Wahl-Slug (die Route kennt nur `year`).
 * Deckt sowohl BTW-Formate (mit/ohne `BEZ`W-Infix) als auch AGH/BVV-Formate
 * (mit/ohne `-W`-Suffix) ab. Der `-W`-Kandidat wird bewusst bedingungslos
 * angehängt, auch für 16er-Wahlen: harmlos (matcht dort nie) und hält die
 * Funktion wahl-slug-frei.
 */
export function candidateDbUwbIds(props: GeoUwbProps): string[] {
	const bez = typeof props.BEZ === 'string' ? props.BEZ.padStart(2, '0') : null;
	const uwb3 = pickUwb3(props);
	if (!bez || !uwb3) return [];
	const bwk = typeof props.BWK === 'string' ? props.BWK.padStart(3, '0') : null;
	const out: string[] = [];
	if (bwk) {
		out.push(`${bwk}-${bez}-${uwb3}-0`);
		out.push(`${bwk}-${bez}-${bez}W${uwb3}-0`);
	}
	out.push(`${bez}W${uwb3}-W`);
	out.push(`${bez}W${uwb3}`);
	return out;
}

/** Hinweis-Text für district_not_found-Fehler (API-Route + WebMCP-Tool). */
export const UWB_FORMAT_HINT =
	'Verify district_id format. BTW21/25: 075-01-100-0. BTW17: 078-05-05W221-0. AGH/BVV21/23: 01W100-W. AGH/BVV16: 01W100.';
