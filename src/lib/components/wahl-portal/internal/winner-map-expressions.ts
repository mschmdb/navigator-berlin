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
 */
export function bakeJahrProperties(
	fc: FeatureCollection,
	slugs: readonly string[],
	names: readonly string[],
	winnersAlleJahre: readonly WinnerApiRow[]
): BakedWinnerFeatureCollection {
	const jahre = distinctJahre(winnersAlleJahre);
	const byJahr = winnersByJahrAndGebiet(winnersAlleJahre);
	const wechselByGebiet = wechselJahreSetByGebiet(winnersAlleJahre);

	const features: Feature<Geometry, BakedWinnerProperties>[] = fc.features.map((f, i) => {
		const slug = slugs[i] ?? '';
		const name = names[i] ?? '';
		const props: Record<string, unknown> = { gebiet_slug: slug, gebiet_name: name };
		const wechselJahre = wechselByGebiet.get(slug);
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
 * JS-Zwilling der obigen Expressions: liest dieselben `w_<jahr>_*`-Keys wie
 * `fillColorExpression`/`fillOpacityExpression`/`wechselOutlineExpression`
 * aus gebackenen Feature-Properties. Für Tooltip (Hover-Feature-Properties
 * kommen roh aus MapLibre) und Tests.
 */
export function winnerForJahrJs(props: Record<string, unknown>, jahr: number): WinnerForJahr {
	const keys = jahrPropKeys(jahr);
	const gebietName = typeof props.gebiet_name === 'string' ? props.gebiet_name : '';
	const hasWinner = props[keys.hw] === 1;
	const farbe = typeof props[keys.farbe] === 'string' ? (props[keys.farbe] as string) : NEUTRAL_FARBE;
	const partei = typeof props[keys.partei] === 'string' ? (props[keys.partei] as string) : null;
	const anteil = typeof props[keys.anteil] === 'number' ? (props[keys.anteil] as number) : 0;
	const wechsel = props[keys.wechsel] === 1;
	return { gebietName, partei, farbe, anteil, hasWinner, wechsel };
}
