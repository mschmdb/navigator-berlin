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
	['bvv23', 'ah21'],
	['agh26', 'ah26'],
	['bvv26', 'ah26']
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

	// AGH/BVV ab 2016 teilen sich ein Format (Adresse ohne `-W`-Suffix).
	// 2011 hat keine Stimmbezirks-Geometrie (siehe WAHL_TO_GEO) und bleibt
	// deshalb explizit ausgeschlossen. Generisch über den Jahrgang statt
	// Jahrgangs-Enumeration, damit neue AGH/BVV-Jahrgänge (z.B. agh26/bvv26)
	// ohne Code-Änderung funktionieren.
	const aghBvvMatch = wahlSlug.match(/^(agh|bvv)(\d{2})$/);
	if (aghBvvMatch && Number(aghBvvMatch[2]) >= 16) {
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
	'Verify district_id format (the individual voting-district uwbId, not a Briefwahl-Gruppe id such as winners/gebiet_slug). BTW21/25: 075-01-100-0. BTW17: 078-05-05W221-0. AGH/BVV21/23: 01W100-W. AGH/BVV16: 01W100. The resolved geometry is the dissolved Briefwahl-Gruppe polygon (voting district merged with its postal-voting district), see is_gruppe on the returned Feature.';

/**
 * Baut die Gruppen-ID (= DB-uwbId des Briefwahl-Stimmbezirks) aus den
 * Geo-Properties EINES Urnen-Feature. Die kleinste Kartenebene ist die
 * Briefwahl-Gruppe (Story: Briefwahl-Gruppen als kleinste Kartenebene):
 * alle Urnen-Stimmbezirke mit derselben Gruppen-ID plus der zugehörige
 * Briefwahl-Stimmbezirk bilden eine Fläche (Dissolve).
 *
 * Feld-Varianten für den Briefwahlbezirk-Code je Geo-Slug (per SQL-Sample
 * gegen echte `stimmbezirk`-Rows verifiziert, siehe Test):
 *
 * | Geo-Slug           | Feld  | Beispielwert                       |
 * |--------------------|-------|-------------------------------------|
 * | ah16               | BWB   | "011A" (BEZ + Suffix bereits verschmolzen) |
 * | btw17              | BWB2  | "2C"                                |
 * | ah21 / ah26 / bt25 | BWB3  | "1A"                                |
 *
 * DB-uwbId-Format der Briefwahl-Stimmbezirke:
 *
 * | Wahl          | Format                               |
 * |---------------|----------------------------------------|
 * | BTW 21/25     | `${BWK}-${BEZ}-${suffix}-5`             |
 * | BTW 17        | `${BWK}-${BEZ}-${BEZ}B${suffix}-5`      |
 * | AGH/BVV 16-26 | `${BEZ}B${suffix}` (kein `-5`/`-B`-Anhang) |
 *
 * `bezirksart` der Briefwahl-Stimmbezirke ist bei BTW `'5'`, bei AGH/BVV
 * `'B'`/`'Briefwahlbezirk'` -- hier irrelevant, weil die uwbId selbst
 * reicht (keine bezirksart-Kodierung im AGH/BVV-Format).
 */
export function gruppeIdFromGeo(props: GeoUwbProps, wahlSlug: string): string | null {
	const bez = typeof props.BEZ === 'string' ? props.BEZ.padStart(2, '0') : null;
	if (!bez) return null;

	if (wahlSlug === 'btw21' || wahlSlug === 'btw25') {
		const bwk = typeof props.BWK === 'string' ? props.BWK.padStart(3, '0') : null;
		const suffix = typeof props.BWB3 === 'string' ? props.BWB3 : null;
		if (!bwk || !suffix) return null;
		return `${bwk}-${bez}-${suffix.toUpperCase()}-5`;
	}

	if (wahlSlug === 'btw17') {
		const bwk = typeof props.BWK === 'string' ? props.BWK.padStart(3, '0') : null;
		const suffix = typeof props.BWB2 === 'string' ? props.BWB2 : null;
		if (!bwk || !suffix) return null;
		return `${bwk}-${bez}-${bez}B${suffix.toUpperCase()}-5`;
	}

	// AGH/BVV: 21er-Format (inkl. 23/26, teilen sich den ah21-Layer bzw.
	// haben ein eigenes BWB3-Feld) liest den Suffix direkt aus BWB3.
	const aghBvvMatch = wahlSlug.match(/^(agh|bvv)(\d{2})$/);
	if (aghBvvMatch && Number(aghBvvMatch[2]) >= 21) {
		const suffix = typeof props.BWB3 === 'string' ? props.BWB3 : null;
		if (!suffix) return null;
		return `${bez}B${suffix.toUpperCase()}`;
	}

	// AGH/BVV 2016: BWB trägt BEZ+Suffix bereits verschmolzen ("011A"),
	// der Suffix ist der Rest nach dem BEZ-Präfix. Bezirk 08 (Neukölln)
	// liefert den Suffix in dieser Geo-Generation kleingeschrieben
	// ("081a" statt "011A") -- DB-uwbIds sind über alle Wahlen durchgängig
	// großgeschrieben (Ground-Truth-Check gegen echte stimmbezirk-Rows,
	// Story 17: 40 von 653 Gruppen bei agh16/bvv16 verfehlten ohne
	// `toUpperCase()` den DB-Match).
	if (aghBvvMatch && Number(aghBvvMatch[2]) === 16) {
		const bwb = typeof props.BWB === 'string' ? props.BWB : null;
		if (!bwb || !bwb.toUpperCase().startsWith(bez)) return null;
		const suffix = bwb.slice(bez.length);
		if (!suffix) return null;
		return `${bez}B${suffix.toUpperCase()}`;
	}

	return null;
}
