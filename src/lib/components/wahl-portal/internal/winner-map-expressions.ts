/**
 * Story 7 (Zeit-Animation mit Wechsel-Markierung): Kiez/Bezirk backen ALLE
 * Jahre einer Reihe einmal als flache Feature-Properties (Muster
 * `kiez-finder-engine.ts`: Metriken vorab in die FeatureCollection backen,
 * ein Jahr-Wechsel ist danach nur noch `setPaintProperty`, kein `setData`,
 * kein Netz-Request). `winnerForJahrJs` ist der JS-Zwilling der
 * MapLibre-Expressions (Tooltip/Tests); ein Klammer-Test hält beide an
 * denselben Property-Keys fest.
 *
 * Stimmbezirk bleibt außen vor (Boundary: nie Zeit-Animation dort) und
 * nutzt weiter `joinStimmbezirkWinners`/`joinWinnersToFeatures`
 * (winner-map-data.ts) mit generischen `farbe`/`anteil`/`has_winner`-Keys.
 */
import type { Feature, FeatureCollection, Geometry } from 'geojson';
import { parteiColor } from '$lib/data/partei-farben.js';
import { patternImageId } from './partei-pattern-images.js';
import { wechselJahreSetByGebiet } from './wechsel-data.js';
import {
	ANTEIL_OPACITY_RAMP,
	NEUTRAL_FARBE,
	NEUTRAL_OPACITY,
	type WinnerApiRow
} from './winner-map-data.js';

export interface BakedWinnerProperties {
	readonly gebiet_slug: string;
	readonly gebiet_name: string;
	readonly [key: string]: unknown;
}

export type BakedWinnerFeatureCollection = FeatureCollection<Geometry, BakedWinnerProperties>;

export interface JahrPropKeys {
	readonly farbe: string;
	readonly partei: string;
	readonly anteil: string;
	readonly hw: string;
	readonly wechsel: string;
	readonly patternImageId: string;
}

/** Flache Property-Key-Namen für ein Jahr (`w_<jahr>_farbe` usw.). */
export function jahrPropKeys(jahr: number): JahrPropKeys {
	return {
		farbe: `w_${jahr}_farbe`,
		partei: `w_${jahr}_partei`,
		anteil: `w_${jahr}_anteil`,
		hw: `w_${jahr}_hw`,
		wechsel: `w_${jahr}_wechsel`,
		patternImageId: `w_${jahr}_pattern_image_id`
	};
}

function distinctJahre(rows: readonly WinnerApiRow[]): number[] {
	const set = new Set<number>();
	for (const r of rows) if (r.jahr !== null) set.add(r.jahr);
	return Array.from(set).sort((a, b) => a - b);
}

function winnersByJahrAndGebiet(
	rows: readonly WinnerApiRow[]
): Map<number, Map<string, WinnerApiRow>> {
	const out = new Map<number, Map<string, WinnerApiRow>>();
	for (const r of rows) {
		if (r.jahr === null) continue;
		let inner = out.get(r.jahr);
		if (!inner) {
			inner = new Map();
			out.set(r.jahr, inner);
		}
		inner.set(r.gebiet_slug, r);
	}
	return out;
}

/**
 * Backt alle Jahre der übergebenen Bulk-Winners-Response (eine Reihe) als
 * flache Properties in die Geometrie-FeatureCollection. `slugs`/`names` sind
 * index-aligned zu `fc.features` (Muster `joinWinnersToFeatures`). Wechsel-
 * Flags kommen aus dem Client-Zwilling der Wiederholungs-Merge-Regel
 * (`wechsel-data.ts`) und beziehen sich auf die effektive Legislatur-Reihe,
 * nicht auf reale Kalenderjahre 1:1 (Boundary: 2021→2023 zählt nie als
 * eigener Wechsel).
 *
 * `suppressWechsel` (Story 9, Partei-Modus): die Wechsel-Semantik gehört zur
 * Sieger-Ansicht (Führungswechsel der stärksten Partei) und ergibt für eine
 * einzelne Partei-Anteils-Reihe keinen Sinn -- die Flags bleiben dann
 * konstant 0, ohne `wechselJahreSetByGebiet` überhaupt zu berechnen.
 * `bakeParteiJahrProperties` ist der benannte Aufrufer dafür.
 */
export function bakeJahrProperties(
	fc: FeatureCollection,
	slugs: readonly string[],
	names: readonly string[],
	winnersAlleJahre: readonly WinnerApiRow[],
	options?: { readonly suppressWechsel?: boolean }
): BakedWinnerFeatureCollection {
	const jahre = distinctJahre(winnersAlleJahre);
	const byJahr = winnersByJahrAndGebiet(winnersAlleJahre);
	const wechselByGebiet = options?.suppressWechsel
		? null
		: wechselJahreSetByGebiet(winnersAlleJahre);

	const features: Feature<Geometry, BakedWinnerProperties>[] = fc.features.map((f, i) => {
		const slug = slugs[i] ?? '';
		const name = names[i] ?? '';
		const props: Record<string, unknown> = { gebiet_slug: slug, gebiet_name: name };
		const wechselJahre = wechselByGebiet?.get(slug);
		for (const jahr of jahre) {
			const keys = jahrPropKeys(jahr);
			const row = byJahr.get(jahr)?.get(slug);
			if (row) {
				props[keys.farbe] = parteiColor(row.partei);
				props[keys.partei] = row.partei;
				props[keys.anteil] = row.anteil;
				props[keys.hw] = 1;
				props[keys.patternImageId] = patternImageId(row.partei);
			} else {
				props[keys.farbe] = NEUTRAL_FARBE;
				props[keys.partei] = null;
				props[keys.anteil] = 0;
				props[keys.hw] = 0;
				props[keys.patternImageId] = null;
			}
			props[keys.wechsel] = wechselJahre?.has(jahr) ? 1 : 0;
		}
		return { type: 'Feature', geometry: f.geometry, properties: props as BakedWinnerProperties };
	});

	return { type: 'FeatureCollection', features };
}

/** Partei-Modus-Bake (Story 9): identisch zu `bakeJahrProperties`, Wechsel-
 * Flags konstant 0 (Boundary: nie Wechsel-Outline im Partei-Modus). */
export function bakeParteiJahrProperties(
	fc: FeatureCollection,
	slugs: readonly string[],
	names: readonly string[],
	winnersAlleJahre: readonly WinnerApiRow[]
): BakedWinnerFeatureCollection {
	return bakeJahrProperties(fc, slugs, names, winnersAlleJahre, { suppressWechsel: true });
}

/** MapLibre-`fill-color`-Expression für ein Jahr (baked Properties). */
export function fillColorExpression(jahr: number): unknown[] {
	return ['coalesce', ['get', jahrPropKeys(jahr).farbe], NEUTRAL_FARBE];
}

/**
 * MapLibre-`fill-opacity`-Expression für ein Jahr: identische Anteils-Rampe
 * wie der Stimmbezirks-/Erst-Init-Pfad (`winner-map-maplibre.svelte.ts`),
 * nur über den jahr-gebundenen Property-Key statt dem generischen `anteil`.
 */
export function fillOpacityExpression(jahr: number): unknown[] {
	const keys = jahrPropKeys(jahr);
	return [
		'case',
		['==', ['get', keys.hw], 1],
		[
			'interpolate',
			['linear'],
			['to-number', ['get', keys.anteil], 0],
			ANTEIL_OPACITY_RAMP.minAnteil,
			ANTEIL_OPACITY_RAMP.minOpacity,
			ANTEIL_OPACITY_RAMP.maxAnteil,
			ANTEIL_OPACITY_RAMP.maxOpacity
		],
		NEUTRAL_OPACITY
	];
}

/** MapLibre-`fill-pattern`-Expression für ein Jahr (Achromatopsie-Fallback). */
export function fillPatternExpression(jahr: number, neutralPatternId: string): unknown[] {
	return ['coalesce', ['get', jahrPropKeys(jahr).patternImageId], neutralPatternId];
}

/** MapLibre-Filter für den Wechsel-Outline-Layer: nur Gebiete mit Flag=1 im aktiven Jahr. */
export function wechselOutlineExpression(jahr: number): unknown[] {
	return ['==', ['get', jahrPropKeys(jahr).wechsel], 1];
}

export interface WinnerForJahr {
	readonly gebietName: string;
	readonly partei: string | null;
	readonly farbe: string;
	readonly anteil: number;
	readonly hasWinner: boolean;
	readonly wechsel: boolean;
}

export interface ZeitJahrOption {
	readonly jahr: number;
	readonly isRepeatElection: boolean;
}

/** Aufsteigend sortierte, reale Jahre mit Kiez/Bezirk-Daten -- Grundlage der
 * Zeit-Leiste (Play/Slider) in `winner-map.svelte`. */
export function buildZeitJahrOptions(winnersAlleJahre: readonly WinnerApiRow[]): ZeitJahrOption[] {
	const jahre = distinctJahre(winnersAlleJahre);
	return jahre.map((jahr) => ({
		jahr,
		isRepeatElection: winnersAlleJahre.some((w) => w.jahr === jahr && w.is_repeat_election)
	}));
}

/**
 * Review-Fund #8: Zeit-Leiste-Optionen für kiez/bezirk. Gewinner-Tab:
 * Schnittmenge aus geladenen Winners-Jahren UND den offiziellen Jahren der
 * Reihe (Boundary: `setJahr` akzeptiert nur Jahre aus `jahreForReihe`).
 * Partei-Modus: unabhängig von den (evtl. lückenhaften) Partei-Rows direkt
 * ALLE Jahre der Reihe, sonst schrumpft die Leiste auf die Jahre MIT Daten
 * dieser Partei (z. B. BSW nur 2023/2025).
 */
export function resolveZeitJahrOptions(params: {
	readonly reiheJahre: readonly ZeitJahrOption[];
	readonly aktivePartei: string | null;
	readonly winnersAlleJahre: readonly WinnerApiRow[];
}): ZeitJahrOption[] {
	const { reiheJahre, aktivePartei, winnersAlleJahre } = params;
	if (aktivePartei) return reiheJahre.map((w) => ({ jahr: w.jahr, isRepeatElection: w.isRepeatElection }));
	const gueltigeJahre = new Set(reiheJahre.map((w) => w.jahr));
	return buildZeitJahrOptions(winnersAlleJahre).filter((o) => gueltigeJahre.has(o.jahr));
}

/**
 * JS-Zwilling der obigen Expressions: liest dieselben `w_<jahr>_*`-Keys wie
 * `fillColorExpression`/`fillOpacityExpression`/`wechselOutlineExpression`
 * aus gebackenen Feature-Properties. Für Tooltip (Hover-Feature-Properties
 * kommen roh aus MapLibre) und Tests.
 */
export interface AnteilSpanne {
	readonly min: number;
	readonly max: number;
}

/** Minimaler Abstand, damit eine (fast) konstante Reihe keine 0-Spanne ergibt
 * (Division-durch-0 in der Interpolate-Expression). */
const MIN_SPANNE = 0.02;

/**
 * Partei-relative Anteils-Spanne (Story 9 Design Notes): normiert die
 * Deckkraft-Rampe auf die tatsächliche Anteils-Verteilung EINER Partei in
 * der geladenen Reihe (alle Jahre × Gebiete), statt der festen
 * Sieger-Rampe (`ANTEIL_OPACITY_RAMP`, 0,15-0,45) -- die würde eine
 * durchgängig schwache Partei (z. B. FDP) flächig auf Minimal-Deckkraft
 * zeigen. Degeneriert auf 0..1 ohne Rows.
 */
export function parteiAnteilSpanne(rows: readonly WinnerApiRow[]): AnteilSpanne {
	if (rows.length === 0) return { min: 0, max: 1 };
	let min = Infinity;
	let max = -Infinity;
	for (const r of rows) {
		if (r.anteil < min) min = r.anteil;
		if (r.anteil > max) max = r.anteil;
	}
	if (max - min < MIN_SPANNE) {
		const mid = (min + max) / 2;
		return { min: Math.max(0, mid - MIN_SPANNE / 2), max: Math.min(1, mid + MIN_SPANNE / 2) };
	}
	return { min, max };
}

/**
 * Deckkraft-Grenzen der Partei-relativen Rampe. Bewusst NICHT dieselben
 * Werte wie die Sieger-Rampe (`ANTEIL_OPACITY_RAMP.minOpacity` 0,4): am
 * Spannen-Minimum einer Partei (z. B. SPD-Schwächstes Gebiet) muss die
 * Fläche nahezu transparent bleiben, sonst zeigt die ganze Karte satte
 * Partei-Farbe unabhängig vom tatsächlichen Anteil (Live-Bug-Report 20.09.:
 * SPD BTW17, Spanne 8,9-34,9 %, komplette Karte satt rot). Ein niedriger
 * Floor macht die Deckkraft wieder informationstragend statt Flächenfarbe.
 *
 * `minOpacity` liegt bewusst ÜBER `NEUTRAL_OPACITY` (0,1, `winner-map-data.ts`):
 * ein Gebiet OHNE Daten darf nie präsenter wirken als das Gebiet mit dem
 * niedrigsten (aber vorhandenen) Anteil der Partei (Review-Fund #2).
 */
export const PARTEI_OPACITY_RANGE = { minOpacity: 0.15, maxOpacity: 0.9 } as const;

/**
 * JS-Zwilling der `parteiFillOpacityExpression`: lineare Interpolation
 * zwischen `minAnteil`/`maxAnteil` (Partei-Spanne), außerhalb geklemmt.
 * Für Legende (echte Spanne in Prozent) und Small-Multiples-Opacity.
 */
export function parteiOpacityForAnteil(
	anteil: number,
	minAnteil: number,
	maxAnteil: number
): number {
	const { minOpacity, maxOpacity } = PARTEI_OPACITY_RANGE;
	if (maxAnteil <= minAnteil) return minOpacity;
	if (anteil <= minAnteil) return minOpacity;
	if (anteil >= maxAnteil) return maxOpacity;
	const t = (anteil - minAnteil) / (maxAnteil - minAnteil);
	return minOpacity + t * (maxOpacity - minOpacity);
}

/**
 * MapLibre-`fill-opacity`-Expression für den Partei-Modus (Story 9): liest
 * denselben `w_<jahr>_anteil`-Key wie `fillOpacityExpression`, interpoliert
 * aber über die partei-relative Spanne statt der festen Sieger-Rampe.
 */
export function parteiFillOpacityExpression(
	jahr: number,
	minAnteil: number,
	maxAnteil: number
): unknown[] {
	const keys = jahrPropKeys(jahr);
	const { minOpacity, maxOpacity } = PARTEI_OPACITY_RANGE;
	const hi = maxAnteil > minAnteil ? maxAnteil : minAnteil + MIN_SPANNE;
	return [
		'interpolate',
		['linear'],
		['to-number', ['get', keys.anteil], 0],
		minAnteil,
		minOpacity,
		hi,
		maxOpacity
	];
}

/**
 * Generische Partei-Modus-Variante (Stimmbezirk, Story 9): identische
 * `case`/`has_winner`-Struktur wie `genericFillOpacityExpression`, aber mit
 * der partei-relativen Spanne statt der festen Sieger-Rampe. Für die
 * generischen `anteil`/`has_winner`-Property-Keys (nicht jahr-gebunden).
 */
export function genericParteiFillOpacityExpression(
	minAnteil: number,
	maxAnteil: number
): unknown[] {
	const { minOpacity, maxOpacity } = PARTEI_OPACITY_RANGE;
	const hi = maxAnteil > minAnteil ? maxAnteil : minAnteil + MIN_SPANNE;
	return [
		'case',
		['==', ['get', 'has_winner'], 1],
		['interpolate', ['linear'], ['get', 'anteil'], minAnteil, minOpacity, hi, maxOpacity],
		NEUTRAL_OPACITY
	];
}

export function winnerForJahrJs(props: Record<string, unknown>, jahr: number): WinnerForJahr {
	const keys = jahrPropKeys(jahr);
	const gebietName = typeof props.gebiet_name === 'string' ? props.gebiet_name : '';
	const hasWinner = props[keys.hw] === 1;
	const farbe =
		typeof props[keys.farbe] === 'string' ? (props[keys.farbe] as string) : NEUTRAL_FARBE;
	const partei = typeof props[keys.partei] === 'string' ? (props[keys.partei] as string) : null;
	const anteil = typeof props[keys.anteil] === 'number' ? (props[keys.anteil] as number) : 0;
	const wechsel = props[keys.wechsel] === 1;
	return { gebietName, partei, farbe, anteil, hasWinner, wechsel };
}
