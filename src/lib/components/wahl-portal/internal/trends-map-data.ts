/**
 * Story 8 (Trends/Volatilität): Join-Logik für die Trend-/Volatilitäts-Karte
 * (Muster `wechsel-map-data.ts` -- Farbe nach Metrik statt Partei, MapLibre-
 * frei, kein Netzwerk-Zugriff).
 *
 * Farb-Rampen (Boundary ux-blueprint.md Z. 30: „niemals Partei-Farbe für
 * Nicht-Partei-Metriken"):
 * - Volatilität: dieselbe 3-Stufen-Strukturell-Indigo-Rampe wie die
 *   Wechsel-Häufigkeits-Karte (`WECHSEL_NEUTRAL_FARBE`/`_STUFE_1`/
 *   `_STUFE_2_PLUS`, bereits kontrastgeprüft, siehe dort).
 * - Trend: dieselbe Rampe gespiegelt für „steigend" (Indigo) + eine
 *   luminanz-identische Vermillion-Variante für „fallend" (Werte per
 *   `blendOverBasemap`/`contrastRatio`-Bisektion auf exakt dieselbe
 *   relative Luminanz wie die Indigo-Stufen gebracht -- Kontrast zwischen
 *   Nachbarstufen ist dadurch pro Konstruktion identisch zur Wechsel-Rampe,
 *   siehe `trends-map-data.test.ts`), damit Richtung (Hue) und Stärke
 *   (Helligkeit) beide ablesbar bleiben, ohne eine der beiden Richtungen an
 *   „gut/schlecht"-Rampen (`scaleGut`/`scaleLast`) zu hängen.
 */
import type { Feature, FeatureCollection, Geometry } from 'geojson';
import { m } from '$lib/paraglide/messages.js';
import {
	formatPercent,
	formatPercentagePointsDelta,
	type LocaleFormatOptions
} from '$lib/i18n/format.js';
import { formatDeltaLabel } from './ergebnis-panel-data.js';
import {
	WECHSEL_FARBE_STUFE_1,
	WECHSEL_FARBE_STUFE_2_PLUS,
	WECHSEL_FILL_OPACITY,
	WECHSEL_NEUTRAL_FARBE
} from './wechsel-map-data.js';

export type TrendsToggle = 'trend' | 'volatilitaet';

/** Deckkraft für beide Karten -- identisch zur Wechsel-Karte (gleiche
 * Kontrast-Herleitung, siehe Modul-Doc). */
export const TRENDS_FILL_OPACITY = WECHSEL_FILL_OPACITY;

export const TREND_NEUTRAL_FARBE = WECHSEL_NEUTRAL_FARBE;
export const TREND_STEIGEND_HELL = WECHSEL_FARBE_STUFE_1;
export const TREND_STEIGEND_DUNKEL = WECHSEL_FARBE_STUFE_2_PLUS;
/** Luminanz-identisch zu `TREND_STEIGEND_HELL` (Vermillion-Hue statt Indigo). */
export const TREND_FALLEND_HELL = '#B05F24';
/** Luminanz-identisch zu `TREND_STEIGEND_DUNKEL` (Vermillion-Hue statt Indigo). */
export const TREND_FALLEND_DUNKEL = '#321B0A';

export const VOLATILITAET_NEUTRAL_FARBE = WECHSEL_NEUTRAL_FARBE;
export const VOLATILITAET_FARBE_STUFE_1 = WECHSEL_FARBE_STUFE_1;
export const VOLATILITAET_FARBE_STUFE_2_PLUS = WECHSEL_FARBE_STUFE_2_PLUS;

/** Schwellen in Pp./Jahr (bereits `slope × 100`, siehe `docs/wahldaten-methodik.md`). */
export const TREND_SCHWELLE_LEICHT = 0.2;
export const TREND_SCHWELLE_STARK = 1.0;

/**
 * Klassengrenzen der Volatilitäts-Karte: Terzile der angezeigten Reihe statt
 * fester Schwellen. Feste Schwellen (früher 5/12 Pp.) lagen unter dem
 * Minimum jeder Reihe und färbten ganz Berlin „hoch“ (Live-Fund 23.09.).
 * Die Karte zeigt damit, welche Kieze relativ zum Rest Berlins stabiler oder
 * wechselhafter wählen.
 */
export interface VolatilitaetTerzile {
	readonly untere: number;
	readonly obere: number;
}

function quantil(sorted: readonly number[], p: number): number {
	const pos = (sorted.length - 1) * p;
	const lo = Math.floor(pos);
	const hi = Math.ceil(pos);
	return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

/** Terzil-Grenzen (lineare Interpolation); `null` bei < 3 Werten oder ohne Streuung. */
export function computeVolatilitaetTerzile(werte: readonly number[]): VolatilitaetTerzile | null {
	if (werte.length < 3) return null;
	const sorted = [...werte].sort((a, b) => a - b);
	if (sorted[0] === sorted[sorted.length - 1]) return null;
	return { untere: quantil(sorted, 1 / 3), obere: quantil(sorted, 2 / 3) };
}

/**
 * Farbe für die Trend-Karte aus `slope` (Anteil/Jahr, roh aus der API).
 * `slope × 100` = Pp./Jahr (Methodik-Konvention).
 */
export function farbeForTrendSlope(slope: number): string {
	const ppJahr = slope * 100;
	if (Math.abs(ppJahr) < TREND_SCHWELLE_LEICHT) return TREND_NEUTRAL_FARBE;
	if (ppJahr > 0) {
		return ppJahr >= TREND_SCHWELLE_STARK ? TREND_STEIGEND_DUNKEL : TREND_STEIGEND_HELL;
	}
	return ppJahr <= -TREND_SCHWELLE_STARK ? TREND_FALLEND_DUNKEL : TREND_FALLEND_HELL;
}

/**
 * Farbe für die Volatilitäts-Karte (Strukturell-Indigo, 3 Stufen nach
 * Terzilen). Ohne Terzile eine einheitliche Mittelstufe: bei zu wenigen
 * Kiezen wäre jede Drittelung Scheingenauigkeit.
 */
export function farbeForVolatilitaet(
	volatilitaet: number,
	terzile: VolatilitaetTerzile | null
): string {
	if (!terzile) return VOLATILITAET_FARBE_STUFE_1;
	if (volatilitaet < terzile.untere) return VOLATILITAET_NEUTRAL_FARBE;
	if (volatilitaet < terzile.obere) return VOLATILITAET_FARBE_STUFE_1;
	return VOLATILITAET_FARBE_STUFE_2_PLUS;
}

/** `slope` einer Partei aus den API-Trends eines Gebiets, `0` ohne Eintrag
 * (Boundary: „< 2 Datenpunkte -> slope = 0" ist bereits Server-Semantik). */
export function slopeForPartei(
	trends: ReadonlyArray<{ readonly partei: string; readonly slope: number }>,
	partei: string
): number {
	return trends.find((t) => t.partei === partei)?.slope ?? 0;
}

export interface TrendsFeatureProperties {
	readonly gebiet_slug: string;
	readonly gebiet_name: string;
	readonly wert: number;
	readonly farbe: string;
	readonly hat_daten: 0 | 1;
}

export type TrendsFeatureCollection = FeatureCollection<Geometry, TrendsFeatureProperties>;

export interface TrendsGebietInput {
	readonly kiez_slug: string;
	readonly volatilitaet: number;
	readonly trends: ReadonlyArray<{ readonly partei: string; readonly slope: number }>;
}

/**
 * Volatilität 0 ist die Server-Semantik für „< 2 Legislaturen“ und damit
 * kein Messwert: solche Gebiete gelten als ohne Daten.
 */
export function hatVolatilitaetsDaten(
	gebiet: TrendsGebietInput | undefined
): gebiet is TrendsGebietInput {
	return gebiet !== undefined && gebiet.volatilitaet > 0;
}

/**
 * Terzile nur aus Gebieten, die die Karte auch zeigt (`slugs` der
 * Geometrie) und die echte Werte haben. Karte, Legende und Takeaway rechnen
 * damit auf derselben Menge.
 */
export function volatilitaetTerzileFor(
	gebieteBySlug: ReadonlyMap<string, TrendsGebietInput>,
	slugs: readonly string[]
): VolatilitaetTerzile | null {
	const werte: number[] = [];
	for (const slug of new Set(slugs)) {
		const gebiet = gebieteBySlug.get(slug);
		if (hatVolatilitaetsDaten(gebiet)) werte.push(gebiet.volatilitaet);
	}
	return computeVolatilitaetTerzile(werte);
}

export interface VolatilitaetLegendeEintrag {
	readonly label: string;
	readonly farbe: string;
	readonly keineDaten?: true;
}

/** Prozent-Zahl OHNE Einheit (kein `%`, kein Leerzeichen) -- die Legenden-
 * Zeilen setzen das `%`-Zeichen selbst an der passenden Stelle im Satz
 * (Bestandsverhalten: „Mittel: 18,5 bis 21,7 %" trägt das Zeichen nur einmal). */
function bareProzent(anteil: number, opts?: LocaleFormatOptions): string {
	return formatPercent(anteil, { decimals: 1, locale: opts?.locale }).replace(/\s?%$/, '');
}

/**
 * Legende mit den echten Spannen der Reihe. „Keine Daten” nur, wenn die
 * Karte solche Gebiete zeigt: sonst ähnelt der Eintrag der hellen Stufe
 * „Stabiler” und verwirrt (Gestalt-Ähnlichkeit). Grenzen, die gerundet
 * gleich aussehen, ergeben keine lesbare Drittelung und fallen auf eine Stufe
 * zurück.
 */
export function buildVolatilitaetLegende(
	terzile: VolatilitaetTerzile | null,
	hatGebieteOhneDaten: boolean,
	opts?: LocaleFormatOptions
): VolatilitaetLegendeEintrag[] {
	const options = { locale: opts?.locale };
	const eintraege: VolatilitaetLegendeEintrag[] = [];
	// Bare Zahl (ohne Einheit): das „%" sitzt in der Legende nur EINMAL, am
	// Ende der „Mittel"-Zeile (Bestandsverhalten, DE-Byte-Identität).
	const u = terzile ? bareProzent(terzile.untere, opts) : null;
	const o = terzile ? bareProzent(terzile.obere, opts) : null;
	if (u === null || o === null || u === o) {
		eintraege.push({
			label: m.wahl_portal_volatilitaet_legende_einzelstufe(undefined, options),
			farbe: VOLATILITAET_FARBE_STUFE_1
		});
	} else {
		eintraege.push(
			{
				label: m.wahl_portal_volatilitaet_stabiler({ u }, options),
				farbe: VOLATILITAET_NEUTRAL_FARBE
			},
			{
				label: m.wahl_portal_volatilitaet_mittel({ u, o }, options),
				farbe: VOLATILITAET_FARBE_STUFE_1
			},
			{
				label: m.wahl_portal_volatilitaet_wechselhafter({ o }, options),
				farbe: VOLATILITAET_FARBE_STUFE_2_PLUS
			}
		);
	}
	if (hatGebieteOhneDaten) {
		eintraege.push({
			label: m.wahl_portal_keine_daten_label(undefined, options),
			farbe: VOLATILITAET_NEUTRAL_FARBE,
			keineDaten: true
		});
	}
	return eintraege;
}

/**
 * Joint Kiez-Geometrie mit der Analytik (Muster `buildWechselFeatureCollection`).
 * `toggle==='trend'` braucht die aktive Partei; ohne Partei-Eintrag (kein
 * Datenpunkt für diese Partei in diesem Kiez) bleibt das Gebiet neutral
 * (`hat_daten: 0`), NICHT stillschweigend 0-Wert (Boundary: kein erfundener
 * Vergleich).
 */
export function buildTrendsFeatureCollection(
	fc: FeatureCollection,
	slugs: readonly string[],
	names: readonly string[],
	gebieteBySlug: ReadonlyMap<string, TrendsGebietInput>,
	toggle: TrendsToggle,
	aktivePartei: string
): TrendsFeatureCollection {
	const terzile = toggle === 'volatilitaet' ? volatilitaetTerzileFor(gebieteBySlug, slugs) : null;
	const features: Feature<Geometry, TrendsFeatureProperties>[] = fc.features.map((f, i) => {
		const slug = slugs[i] ?? '';
		const name = names[i] ?? '';
		const gebiet = gebieteBySlug.get(slug);
		if (!gebiet || (toggle === 'volatilitaet' && !hatVolatilitaetsDaten(gebiet))) {
			return {
				type: 'Feature',
				geometry: f.geometry,
				properties: {
					gebiet_slug: slug,
					gebiet_name: name,
					wert: 0,
					farbe: toggle === 'trend' ? TREND_NEUTRAL_FARBE : VOLATILITAET_NEUTRAL_FARBE,
					hat_daten: 0
				}
			};
		}
		if (toggle === 'volatilitaet') {
			return {
				type: 'Feature',
				geometry: f.geometry,
				properties: {
					gebiet_slug: slug,
					gebiet_name: name,
					wert: gebiet.volatilitaet,
					farbe: farbeForVolatilitaet(gebiet.volatilitaet, terzile),
					hat_daten: 1
				}
			};
		}
		const trendEintrag = gebiet.trends.find((t) => t.partei === aktivePartei);
		const slope = trendEintrag?.slope ?? 0;
		return {
			type: 'Feature',
			geometry: f.geometry,
			properties: {
				gebiet_slug: slug,
				gebiet_name: name,
				wert: slope,
				farbe: trendEintrag ? farbeForTrendSlope(slope) : TREND_NEUTRAL_FARBE,
				hat_daten: trendEintrag ? 1 : 0
			}
		};
	});
	return { type: 'FeatureCollection', features };
}

export interface TrendsTableRow {
	readonly gebiet: string;
	readonly wert: string;
}

/** Rundungs-Clamp für die Trend-Tabelle: Werte, die bei einer Nachkommastelle
 * auf 0,0 runden würden, tragen kein Vorzeichen (sonst „+0,0"/„−0,0 Pp.",
 * EC-18). */
const TREND_ROUNDING_CLAMP_PP = 0.05;

/** Tabellen-Rows für die Karten-Alternative (nur Gebiete mit Daten). */
export function buildTrendsTableRows(
	fc: TrendsFeatureCollection,
	toggle: TrendsToggle,
	opts?: LocaleFormatOptions
): TrendsTableRow[] {
	return fc.features
		.filter((f) => f.properties.hat_daten === 1)
		.map((f) => ({
			gebiet: f.properties.gebiet_name,
			wert:
				toggle === 'trend'
					? formatTrendWertLabel(f.properties.wert * 100, opts)
					: formatVolatilitaetLabel(f.properties.wert, opts)
		}))
		.sort((a, b) => a.gebiet.localeCompare(b.gebiet, 'de'));
}

/** Rundungs-Clamp-Fall OHNE Vorzeichen: `formatPercentagePointsDelta(0, ...)`
 * liefert immer ein `+` (0 ist nicht `< 0`) -- das fuehrende Zeichen wird
 * deshalb entfernt, DE-Ausgabe bleibt `0,0 Pp.` wie zuvor. */
function formatTrendWertLabel(ppJahr: number, opts?: LocaleFormatOptions): string {
	if (Math.abs(ppJahr) < TREND_ROUNDING_CLAMP_PP) {
		return formatPercentagePointsDelta(0, { locale: opts?.locale }).replace(/^\+/, '');
	}
	return formatDeltaLabel(ppJahr, opts);
}

/**
 * `x,x % Netto-Verschiebung` (kein Vorzeichen, Volatilität ist eine
 * Magnitude): Pedersen-Index, die Summe aller Anteilsgewinne zwischen zwei
 * Legislaturen (gleich der Summe der Verluste). Bewusst nicht
 * „Wählerwanderung”: das meint im Wahljournalismus Bruttoströme.
 */
export function formatVolatilitaetLabel(volatilitaet: number, opts?: LocaleFormatOptions): string {
	return m.wahl_portal_volatilitaet_label(
		{ pct: formatPercent(volatilitaet, { decimals: 1, locale: opts?.locale }) },
		{ locale: opts?.locale }
	);
}

/** Coverage-Fußnote: die LOR-Kiez-Geometrie selbst ist über alle Jahre
 * stabil (Boundary), es fehlen die STIMMBEZIRKS-Geometrien vor 2016/2017, aus
 * denen das Kiez-Flächen-Aggregat gebildet wird (siehe
 * `docs/wahldaten-methodik.md`) -- geteilt zwischen Sankey (nur bei
 * `ebene==='kiez'`) und Trends-Kapitel (kein Doppel-Text). */
export function kiezCoverageHinweisText(opts?: LocaleFormatOptions): string {
	return m.wahl_portal_kiez_coverage_hinweis(undefined, { locale: opts?.locale });
}

/**
 * Takeaway-Satz Trend-Karte: nennt die Anzahl steigender/fallender Kieze
 * (I/O-Matrix „Trend-Karte”). `lint:wahl`-konform: reine Anteils-Fakten.
 */
export function buildTrendTakeaway(
	fc: TrendsFeatureCollection,
	partei: string,
	opts?: LocaleFormatOptions
): string {
	const options = { locale: opts?.locale };
	const mitDaten = fc.features.filter((f) => f.properties.hat_daten === 1);
	if (mitDaten.length === 0) return m.wahl_portal_trend_takeaway_leer(undefined, options);
	const steigend = mitDaten.filter((f) => f.properties.wert * 100 >= TREND_SCHWELLE_LEICHT).length;
	const fallend = mitDaten.filter((f) => f.properties.wert * 100 <= -TREND_SCHWELLE_LEICHT).length;
	return m.wahl_portal_trend_takeaway(
		{ partei, steigend, total: mitDaten.length, fallend },
		options
	);
}

/**
 * Takeaway-Satz Volatilitäts-Karte: nennt die Spanne stabilste/wechselhafteste
 * Kieze, neutral formuliert (`lint:wahl`-konform, keine Wertungs-Sprache).
 * Bei Gleichstand ALLER Werte (nicht nur bei genau einem Kiez mit Daten) ein
 * eigener Satz statt willkürlich benannter Extreme (Review Triage Log #18:
 * gleiche Werte, unterschiedliche Gebiete, hätten sonst als „stabilster"
 * bzw. „wechselhaftester" benannt -- obwohl beide identisch liegen).
 */
export function buildVolatilitaetTakeaway(
	fc: TrendsFeatureCollection,
	opts?: LocaleFormatOptions
): string {
	const options = { locale: opts?.locale };
	const mitDaten = fc.features.filter((f) => f.properties.hat_daten === 1);
	if (mitDaten.length === 0) return m.wahl_portal_volatilitaet_takeaway_leer(undefined, options);
	const sorted = [...mitDaten].sort((a, b) => a.properties.wert - b.properties.wert);
	const stabilste = sorted[0];
	const wechselhafteste = sorted[sorted.length - 1];
	if (mitDaten.length === 1) {
		return m.wahl_portal_volatilitaet_takeaway_einzeln(
			{
				name: stabilste.properties.gebiet_name,
				wert: formatVolatilitaetLabel(stabilste.properties.wert, opts)
			},
			options
		);
	}
	if (stabilste.properties.wert === wechselhafteste.properties.wert) {
		return m.wahl_portal_volatilitaet_takeaway_gleichstand(
			{ count: mitDaten.length, wert: formatVolatilitaetLabel(stabilste.properties.wert, opts) },
			options
		);
	}
	const extreme = m.wahl_portal_volatilitaet_takeaway_extreme(
		{
			stabilName: stabilste.properties.gebiet_name,
			stabilWert: formatVolatilitaetLabel(stabilste.properties.wert, opts),
			wechselName: wechselhafteste.properties.gebiet_name,
			wechselWert: formatVolatilitaetLabel(wechselhafteste.properties.wert, opts)
		},
		options
	);
	const terzile = computeVolatilitaetTerzile(mitDaten.map((f) => f.properties.wert));
	if (!terzile) return extreme;
	const u = formatPercent(terzile.untere, { decimals: 1, locale: opts?.locale });
	const o = formatPercent(terzile.obere, { decimals: 1, locale: opts?.locale });
	if (u === o) return extreme;
	return `${extreme} ${m.wahl_portal_volatilitaet_takeaway_drittel({ u, o }, options)}`;
}
