/**
 * Kiez-Finder-Engine: aus Slider-Gewichten wird eine Passungs-Karte.
 *
 * Kern der Live-Mechanik (Spec _user-input/spec-kiez-finder-2026-08-22.md):
 * Alle Metriken werden EINMAL als normalisierte Properties (0..1) in eine
 * FeatureCollection der 542 Planungsräume gebacken. Die Passung rechnet dann
 * eine MapLibre-Paint-Expression auf der GPU; ein Slider-Move ist nur ein
 * setPaintProperty. computeFitJs ist der JS-Zwilling derselben Formel für die
 * Top-Liste; beide teilen die Gewichts-Terme, der Test verklammert sie.
 *
 * Formel: fit_i = m_i wenn w_i > 0, sonst 1 - m_i.
 * Passung = 100 · Σ |w_i| · fit_i / Σ |w_i|. Fehlende Metriken sind neutral
 * (0.5), damit Datenlücken nicht als „schlecht" lesen.
 */

import type { Feature, FeatureCollection, MultiPolygon, Polygon } from 'geojson';
import { COLORS } from './colors.js';

export interface FinderWeights {
	/** Score-Dimensionen und Dichte: -2..2 (möglichst wenig .. möglichst viel). */
	readonly ruheLuft: number;
	readonly gruenHitze: number;
	readonly mobilitaet: number;
	readonly versorgung: number;
	readonly wohnschutz: number;
	readonly kultur: number;
	readonly dichte: number;
	/** Nähe-Kriterien: 0..2 (egal .. möglichst nah/ähnlich). */
	readonly sbahn: number;
	readonly partei: number;
}

export type FinderMetricKey =
	| 'm_ruhe_luft'
	| 'm_gruen_hitze'
	| 'm_mobilitaet'
	| 'm_versorgung'
	| 'm_wohnschutz'
	| 'm_kultur'
	| 'm_dichte'
	| 'm_sbahn'
	| 'm_partei';

export const WEIGHT_TO_METRIC: Record<keyof FinderWeights, FinderMetricKey> = {
	ruheLuft: 'm_ruhe_luft',
	gruenHitze: 'm_gruen_hitze',
	mobilitaet: 'm_mobilitaet',
	versorgung: 'm_versorgung',
	wohnschutz: 'm_wohnschutz',
	kultur: 'm_kultur',
	dichte: 'm_dichte',
	sbahn: 'm_sbahn',
	partei: 'm_partei'
};

export const FINDER_METRIC_KEYS = Object.values(WEIGHT_TO_METRIC) as readonly FinderMetricKey[];

/** Fehlender Wert liest neutral, nicht als schlechtester Fall. */
export const NEUTRAL_METRIC = 0.5;

export const FINDER_SOURCE_ID = 'navigator-finder';
export const FINDER_LAYER_ID = 'navigator-finder-fill';

/**
 * Passungs-Rampe: Strukturell-Indigo hell→dunkel. Der Finder ersetzt die
 * Wertkarten, es gibt keine Hue-Kollision mit aktiven Choroplethen.
 */
export const FINDER_RAMP: readonly [string, string, string, string, string] = [
	COLORS.scaleStrukturell1,
	COLORS.scaleStrukturell2,
	COLORS.scaleStrukturell3,
	COLORS.scaleStrukturell4,
	COLORS.scaleStrukturell5
];

export function neutralWeights(): FinderWeights {
	return {
		ruheLuft: 0,
		gruenHitze: 0,
		mobilitaet: 0,
		versorgung: 0,
		wohnschutz: 0,
		kultur: 0,
		dichte: 0,
		sbahn: 0,
		partei: 0
	};
}

export function hasActiveWeights(weights: FinderWeights): boolean {
	return Object.values(weights).some((w) => w !== 0);
}

/** Rangbasierte Normalisierung auf 0..1, robust gegen schiefe Verteilungen. */
export function rankNormalize(values: ReadonlyMap<string, number>): Map<string, number> {
	const entries = [...values.entries()].sort((a, b) => a[1] - b[1]);
	const out = new Map<string, number>();
	if (entries.length === 1) {
		out.set(entries[0][0], NEUTRAL_METRIC);
		return out;
	}
	entries.forEach(([key], index) => {
		out.set(key, index / (entries.length - 1));
	});
	return out;
}

/** S-Bahn-Fußweg → Fit: 1 bei ≤5 min, linear auf 0 bei ≥30 min. */
export function sbahnFit(minutes: number): number {
	if (minutes <= 5) return 1;
	if (minutes >= 30) return 0;
	return 1 - (minutes - 5) / 25;
}

export type FinderMetricInput = Partial<Record<FinderMetricKey, ReadonlyMap<string, number>>>;

/**
 * Basis-Geometrie (lor-planungsraum) + Metrik-Maps (plrId → 0..1) →
 * FeatureCollection mit allen Metriken als Properties.
 */
export function buildFinderCollection(
	plrFc: FeatureCollection,
	metrics: FinderMetricInput,
	kiezNames?: ReadonlyMap<string, string>
): FeatureCollection<Polygon | MultiPolygon> {
	const features: Feature<Polygon | MultiPolygon>[] = [];
	for (const feature of plrFc.features) {
		if (feature.geometry?.type !== 'Polygon' && feature.geometry?.type !== 'MultiPolygon') {
			continue;
		}
		const props = (feature.properties ?? {}) as Record<string, unknown>;
		const plrId = typeof props.PLR_ID === 'string' ? props.PLR_ID : null;
		if (!plrId) continue;
		const out: Record<string, unknown> = {
			PLR_ID: plrId,
			PLR_NAME: typeof props.PLR_NAME === 'string' ? props.PLR_NAME : plrId,
			kiez_name: kiezNames?.get(plrId.slice(0, 6)) ?? ''
		};
		for (const key of FINDER_METRIC_KEYS) {
			out[key] = metrics[key]?.get(plrId) ?? NEUTRAL_METRIC;
		}
		features.push({
			type: 'Feature',
			properties: out,
			geometry: feature.geometry
		});
	}
	return { type: 'FeatureCollection', features };
}

function activeTerms(weights: FinderWeights): { key: FinderMetricKey; weight: number }[] {
	return (Object.keys(WEIGHT_TO_METRIC) as (keyof FinderWeights)[])
		.filter((k) => weights[k] !== 0)
		.map((k) => ({ key: WEIGHT_TO_METRIC[k], weight: weights[k] }));
}

/** JS-Zwilling der Karten-Expression, für Top-Liste und Tests. */
export function computeFitJs(
	props: Partial<Record<FinderMetricKey, number>>,
	weights: FinderWeights
): number {
	const terms = activeTerms(weights);
	if (terms.length === 0) return 0;
	let sum = 0;
	let weightSum = 0;
	for (const { key, weight } of terms) {
		const metric = props[key] ?? NEUTRAL_METRIC;
		const fit = weight > 0 ? metric : 1 - metric;
		sum += Math.abs(weight) * fit;
		weightSum += Math.abs(weight);
	}
	return Math.round(((100 * sum) / weightSum) * 10) / 10;
}

export interface FitDomain {
	readonly lo: number;
	readonly hi: number;
}

/**
 * Kontrast-Spreizung: reale Passungen clustern oft in einem schmalen Band,
 * eine feste 0..100-Rampe ergäbe eine uniforme Fläche. P5..Maximum der
 * tatsächlichen Verteilung spannen die Rampe dorthin, wo die Unterschiede
 * liegen. Degeneriert (leer oder ohne Spannweite) → 0..100.
 */
export function fitDomain(fits: readonly number[]): FitDomain {
	if (fits.length < 2) return { lo: 0, hi: 100 };
	const sorted = [...fits].sort((a, b) => a - b);
	const at = (q: number): number => {
		const pos = q * (sorted.length - 1);
		const base = Math.floor(pos);
		const rest = pos - base;
		return sorted[base] + rest * ((sorted[base + 1] ?? sorted[base]) - sorted[base]);
	};
	const lo = at(0.05);
	// Oben das echte Maximum: eine P95-Kappe kollabiert die ganze
	// Spitzengruppe in eine Einheits-Farbe und macht Rang-Verschiebungen
	// unsichtbar. Die P5-Klammer unten bleibt gegen Ausreißer.
	const hi = sorted[sorted.length - 1];
	if (hi - lo < 1) return { lo: 0, hi: 100 };
	return { lo, hi };
}

/** Deckkraft-Spanne: schwache Passung tritt zurück, starke leuchtet. */
export const FINDER_OPACITY_RANGE = { min: 0.15, max: 0.8 } as const;

/**
 * MapLibre-fill-opacity-Expression: dieselbe gewichtete Passung wie die
 * Farbe steuert die Deckkraft. Schwache Passung wird fast transparent,
 * damit ein Rang-Absturz sichtbar verblasst statt nur den Blauton zu
 * wechseln.
 */
export function fitOpacityExpression(
	weights: FinderWeights,
	domain: FitDomain = { lo: 0, hi: 100 }
): unknown[] | number {
	if (!hasActiveWeights(weights)) return FINDER_OPACITY_RANGE.min;
	const expr = fitColorExpression(weights, domain);
	if (typeof expr === 'string') return FINDER_OPACITY_RANGE.min;
	// Gleiche Fit-Formel wie die Farbe: Expression bis vor die Farb-Stops
	// übernehmen (['interpolate', ['linear'], fit, ...]), nur mit
	// Opacity-Stops an den Domain-Grenzen.
	const fit = expr[2];
	return [
		'interpolate',
		['linear'],
		fit,
		+domain.lo.toFixed(2),
		FINDER_OPACITY_RANGE.min,
		+domain.hi.toFixed(2),
		FINDER_OPACITY_RANGE.max
	];
}

/**
 * MapLibre-fill-color-Expression: gewichtete Summe der Metrik-Properties,
 * interpoliert über die Passungs-Rampe (Domain = Kontrast-Spreizung).
 * Ein Slider-Move ist damit ein einzelnes setPaintProperty; die GPU wertet
 * pro Fläche aus.
 */
export function fitColorExpression(
	weights: FinderWeights,
	domain: FitDomain = { lo: 0, hi: 100 }
): unknown[] | string {
	// Ohne aktive Gewichte gibt es keine Passung: konstante Grundfarbe
	// statt Division durch die Gewichts-Summe 0.
	if (!hasActiveWeights(weights)) return FINDER_RAMP[0];
	const terms = activeTerms(weights);
	const weightSum = terms.reduce((acc, t) => acc + Math.abs(t.weight), 0);
	const summands = terms.map(({ key, weight }) =>
		weight > 0
			? ['*', Math.abs(weight), ['to-number', ['get', key], NEUTRAL_METRIC]]
			: ['*', Math.abs(weight), ['-', 1, ['to-number', ['get', key], NEUTRAL_METRIC]]]
	);
	const sum = summands.length === 1 ? summands[0] : ['+', ...summands];
	const fit = ['*', 100 / weightSum, sum];
	const span = domain.hi - domain.lo;
	const stop = (q: number): number => +(domain.lo + span * q).toFixed(2);
	return [
		'interpolate',
		['linear'],
		fit,
		stop(0),
		FINDER_RAMP[0],
		stop(0.25),
		FINDER_RAMP[1],
		stop(0.5),
		FINDER_RAMP[2],
		stop(0.75),
		FINDER_RAMP[3],
		stop(1),
		FINDER_RAMP[4]
	];
}

export interface FinderResult {
	readonly plrId: string;
	readonly name: string;
	readonly kiez: string;
	readonly fit: number;
}

export function topResults(
	fc: FeatureCollection<Polygon | MultiPolygon>,
	weights: FinderWeights,
	n = 5
): FinderResult[] {
	if (!hasActiveWeights(weights)) return [];
	return fc.features
		.map((f) => {
			const props = (f.properties ?? {}) as Record<string, unknown>;
			return {
				plrId: String(props.PLR_ID ?? ''),
				name: String(props.PLR_NAME ?? ''),
				kiez: String(props.kiez_name ?? ''),
				fit: computeFitJs(props as Partial<Record<FinderMetricKey, number>>, weights)
			};
		})
		.sort((a, b) => b.fit - a.fit)
		.slice(0, n);
}
