/**
 * Story 8 (Trends/Volatilität): backt Volatilität + Trend ALLER anzeigbaren
 * Parteien einmal als flache Feature-Properties in die Kiez-Geometrie
 * (Muster `winner-map-expressions.ts#jahrPropKeys`/`bakeJahrProperties`).
 * Ein Toggle- oder Partei-Chip-Wechsel ist danach nur noch
 * `setPaintProperty` mit einer neuen `['get', <key>]`-Expression, kein
 * `setData`, kein zweiter Analytik-Request (AC: „ohne neuen
 * `/api/wahl/analytik`-Request").
 */
import type { Feature, FeatureCollection, Geometry } from 'geojson';
import {
	farbeForTrendSlope,
	farbeForVolatilitaet,
	TREND_NEUTRAL_FARBE,
	VOLATILITAET_NEUTRAL_FARBE,
	type TrendsGebietInput,
	type TrendsToggle
} from './trends-map-data.js';

export interface TrendPropKeys {
	readonly wert: string;
	readonly farbe: string;
	readonly hatDaten: string;
}

/** Flache Property-Key-Namen für eine Partei (`trend_SPD_farbe` usw.). */
export function trendPropKeys(partei: string): TrendPropKeys {
	return {
		wert: `trend_${partei}_wert`,
		farbe: `trend_${partei}_farbe`,
		hatDaten: `trend_${partei}_hat_daten`
	};
}

export const VOLATILITAET_WERT_KEY = 'volatilitaet_wert';
export const VOLATILITAET_FARBE_KEY = 'volatilitaet_farbe';
export const VOLATILITAET_HAT_DATEN_KEY = 'volatilitaet_hat_daten';

export interface BakedTrendsProperties {
	readonly gebiet_slug: string;
	readonly gebiet_name: string;
	readonly [key: string]: unknown;
}

export type BakedTrendsFeatureCollection = FeatureCollection<Geometry, BakedTrendsProperties>;

/**
 * Backt Volatilität + Trend jeder übergebenen Partei in die Geometrie.
 * `slugs`/`names` sind index-aligned zu `fc.features` (Muster
 * `joinWinnersToFeatures`). Gebiete ohne Analytik-Eintrag bleiben neutral
 * (`*_hat_daten: 0`), kein Crash (Boundary DB-los/leer).
 */
export function bakeTrendsProperties(
	fc: FeatureCollection,
	slugs: readonly string[],
	names: readonly string[],
	gebieteBySlug: ReadonlyMap<string, TrendsGebietInput>,
	parteien: readonly string[]
): BakedTrendsFeatureCollection {
	const features: Feature<Geometry, BakedTrendsProperties>[] = fc.features.map((f, i) => {
		const slug = slugs[i] ?? '';
		const name = names[i] ?? '';
		const gebiet = gebieteBySlug.get(slug);
		const props: Record<string, unknown> = {
			gebiet_slug: slug,
			gebiet_name: name,
			[VOLATILITAET_WERT_KEY]: gebiet?.volatilitaet ?? 0,
			[VOLATILITAET_FARBE_KEY]: gebiet ? farbeForVolatilitaet(gebiet.volatilitaet) : VOLATILITAET_NEUTRAL_FARBE,
			[VOLATILITAET_HAT_DATEN_KEY]: gebiet ? 1 : 0
		};
		for (const partei of parteien) {
			const keys = trendPropKeys(partei);
			const trend = gebiet?.trends.find((t) => t.partei === partei);
			props[keys.wert] = trend?.slope ?? 0;
			props[keys.farbe] = trend ? farbeForTrendSlope(trend.slope) : TREND_NEUTRAL_FARBE;
			props[keys.hatDaten] = trend ? 1 : 0;
		}
		return { type: 'Feature', geometry: f.geometry, properties: props as BakedTrendsProperties };
	});
	return { type: 'FeatureCollection', features };
}

/** `fill-color`-Expression für den aktiven Toggle/Chip-Stand. */
export function trendsFillColorExpression(toggle: TrendsToggle, aktivePartei: string): unknown[] {
	const key = toggle === 'volatilitaet' ? VOLATILITAET_FARBE_KEY : trendPropKeys(aktivePartei).farbe;
	return ['get', key];
}

/** `fill-opacity`-Expression: volle Deckkraft nur für Gebiete mit Daten. */
export function trendsFillOpacityExpression(
	toggle: TrendsToggle,
	aktivePartei: string,
	volleDeckkraft: number,
	neutraleDeckkraft: number
): unknown[] {
	const key = toggle === 'volatilitaet' ? VOLATILITAET_HAT_DATEN_KEY : trendPropKeys(aktivePartei).hatDaten;
	return ['case', ['==', ['get', key], 1], volleDeckkraft, neutraleDeckkraft];
}
