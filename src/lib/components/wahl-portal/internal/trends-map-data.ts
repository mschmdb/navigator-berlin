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

/** Schwellen der Volatilität (Rohwert, mittlere L1-Distanz aufeinanderfolgender Anteils-Vektoren). */
export const VOLATILITAET_SCHWELLE_LEICHT = 0.05;
export const VOLATILITAET_SCHWELLE_STARK = 0.12;

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

/** Farbe für die Volatilitäts-Karte (Strukturell-Indigo, 3 Stufen). */
export function farbeForVolatilitaet(volatilitaet: number): string {
	if (volatilitaet < VOLATILITAET_SCHWELLE_LEICHT) return VOLATILITAET_NEUTRAL_FARBE;
	if (volatilitaet < VOLATILITAET_SCHWELLE_STARK) return VOLATILITAET_FARBE_STUFE_1;
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
	const features: Feature<Geometry, TrendsFeatureProperties>[] = fc.features.map((f, i) => {
		const slug = slugs[i] ?? '';
		const name = names[i] ?? '';
		const gebiet = gebieteBySlug.get(slug);
		if (!gebiet) {
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
					farbe: farbeForVolatilitaet(gebiet.volatilitaet),
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
export function buildTrendsTableRows(fc: TrendsFeatureCollection, toggle: TrendsToggle): TrendsTableRow[] {
	return fc.features
		.filter((f) => f.properties.hat_daten === 1)
		.map((f) => ({
			gebiet: f.properties.gebiet_name,
			wert: toggle === 'trend' ? formatTrendWertLabel(f.properties.wert * 100) : formatVolatilitaetLabel(f.properties.wert)
		}))
		.sort((a, b) => a.gebiet.localeCompare(b.gebiet, 'de'));
}

function formatTrendWertLabel(ppJahr: number): string {
	if (Math.abs(ppJahr) < TREND_ROUNDING_CLAMP_PP) return '0,0 Pp.';
	return formatDeltaLabel(ppJahr);
}

/**
 * `x,x Pp. Gesamtverschiebung` (kein Vorzeichen, Volatilität ist eine
 * Magnitude): `volatilitaet × 100` ist die L1-SUMME der Anteils-Differenzen
 * über ALLE Parteien zwischen zwei Legislaturen, keine Verschiebung einer
 * einzelnen Partei -- „Gesamtverschiebung" macht das im Label explizit
 * (Review Triage Log #5, vorher methodisch irreführend als bloßes „x,x Pp.").
 */
export function formatVolatilitaetLabel(volatilitaet: number): string {
	return `${(volatilitaet * 100).toFixed(1).replace('.', ',')} Pp. Gesamtverschiebung`;
}

/** Coverage-Fußnote: die LOR-Kiez-Geometrie selbst ist über alle Jahre
 * stabil (Boundary), es fehlen die STIMMBEZIRKS-Geometrien vor 2016/2017, aus
 * denen das Kiez-Flächen-Aggregat gebildet wird (siehe
 * `docs/wahldaten-methodik.md`) -- geteilt zwischen Sankey (nur bei
 * `ebene==='kiez'`) und Trends-Kapitel (kein Doppel-Text). */
export const KIEZ_COVERAGE_HINWEIS =
	'Auf Kiez-Ebene fehlen frühere Wahljahre, weil die zugrunde liegenden Stimmbezirks-Geometrien erst ab 2016/2017 vorliegen (siehe Methodik).';

const EMPTY_TREND_TAKEAWAY = 'Für diese Partei liegen noch keine Trend-Daten vor.';
const EMPTY_VOLATILITAET_TAKEAWAY = 'Für diese Auswahl liegen noch keine Volatilitäts-Daten vor.';

/**
 * Takeaway-Satz Trend-Karte: nennt die Anzahl steigender/fallender Kieze
 * (I/O-Matrix „Trend-Karte"). `lint:wahl`-konform: reine Anteils-Fakten.
 */
export function buildTrendTakeaway(fc: TrendsFeatureCollection, partei: string): string {
	const mitDaten = fc.features.filter((f) => f.properties.hat_daten === 1);
	if (mitDaten.length === 0) return EMPTY_TREND_TAKEAWAY;
	const steigend = mitDaten.filter((f) => f.properties.wert * 100 >= TREND_SCHWELLE_LEICHT).length;
	const fallend = mitDaten.filter((f) => f.properties.wert * 100 <= -TREND_SCHWELLE_LEICHT).length;
	return `${partei}: ${steigend} von ${mitDaten.length} Kiezen mit steigendem, ${fallend} mit fallendem Anteil (Pp./Jahr).`;
}

/**
 * Takeaway-Satz Volatilitäts-Karte: nennt die Spanne stabilste/wechselhafteste
 * Kieze, neutral formuliert (`lint:wahl`-konform, keine Wertungs-Sprache).
 * Bei Gleichstand ALLER Werte (nicht nur bei genau einem Kiez mit Daten) ein
 * eigener Satz statt willkürlich benannter Extreme (Review Triage Log #18:
 * gleiche Werte, unterschiedliche Gebiete, hätten sonst als „stabilster"
 * bzw. „wechselhaftester" benannt -- obwohl beide identisch liegen).
 */
export function buildVolatilitaetTakeaway(fc: TrendsFeatureCollection): string {
	const mitDaten = fc.features.filter((f) => f.properties.hat_daten === 1);
	if (mitDaten.length === 0) return EMPTY_VOLATILITAET_TAKEAWAY;
	const sorted = [...mitDaten].sort((a, b) => a.properties.wert - b.properties.wert);
	const stabilste = sorted[0];
	const wechselhafteste = sorted[sorted.length - 1];
	if (mitDaten.length === 1) {
		return `1 Kiez mit Volatilitäts-Daten: ${stabilste.properties.gebiet_name} (${formatVolatilitaetLabel(stabilste.properties.wert)} je Wahl).`;
	}
	if (stabilste.properties.wert === wechselhafteste.properties.wert) {
		return `Alle ${mitDaten.length} Kieze liegen bei ${formatVolatilitaetLabel(stabilste.properties.wert)} je Wahl.`;
	}
	return `Stabilster Kiez: ${stabilste.properties.gebiet_name} (${formatVolatilitaetLabel(stabilste.properties.wert)} je Wahl). Wechselhaftester Kiez: ${wechselhafteste.properties.gebiet_name} (${formatVolatilitaetLabel(wechselhafteste.properties.wert)} je Wahl).`;
}
