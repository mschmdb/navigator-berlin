import type { SpatialLevel } from '$lib/state/inspector-level-context.svelte.js';
import type {
	AggregateType,
	LayerAggregate,
	LayerAggregatesFile
} from '$lib/data/layer-aggregates-types.js';

export type LayerLevelKind =
	| 'address'
	| 'aggregate'
	| 'point-density'
	| 'not-aggregatable'
	| 'below-threshold'
	| 'no-data';

export type LayerVisualType = AggregateType | 'point-density' | 'distance-ring';

export interface SpatialContextSlugs {
	readonly kiezSlug: string | null;
	readonly bezirkSlug: string | null;
}

export interface LayerLevelView {
	readonly kind: LayerLevelKind;
	readonly level: SpatialLevel;
	readonly visualType?: LayerVisualType;
	readonly aggregate?: LayerAggregate;
	/** Stigma-Lock: Konsum ohne Severity-Wertung. */
	readonly neutral?: boolean;
	readonly disclaimer?: 'brw-not-aggregatable';
	readonly coverageNote?: string;
}

function isBelowThreshold(agg: LayerAggregate): boolean {
	if (agg.type === 'numeric-median') return agg.median === null;
	if (agg.type === 'ordinal-distribution') return agg.dominant === null;
	return false;
}

/**
 * Story 8.2b · Adapter Pure-Function.
 *
 * Wählt pro Level die Darstellung eines Layers:
 * - address → Passthrough (heutige Layer-Hit-Row, Backwards-Compat AC #4).
 * - kiez/bezirk/berlin → liest Pre-Aggregat aus 8.2a (kein Live-Spatial).
 * - kein Aggregat + Point-Layer → point-density (Caller zählt via count-points-in-polygon).
 * - kein Aggregat + Polygon → not-aggregatable (Disclaimer, z.B. BRW).
 * - Aggregat unter Threshold → below-threshold (coverageNote, kein Fake-Wert).
 */
export function aggregateLayerForLevel(
	layerSlug: string,
	level: SpatialLevel,
	ctx: SpatialContextSlugs,
	aggregates: LayerAggregatesFile | null,
	geometryType: string
): LayerLevelView {
	if (level === 'address') {
		return { kind: 'address', level, visualType: 'distance-ring' };
	}

	const entry = aggregates?.aggregates[layerSlug];

	if (!entry) {
		// Point-Layer laufen über Runtime-Count, brauchen kein Pre-Aggregat.
		if (geometryType === 'Point') {
			return { kind: 'point-density', level, visualType: 'point-density' };
		}
		// Aggregat-JSON noch nicht geladen → unbekannt (Lazy-Load), nicht „not-aggregatable".
		if (aggregates === null) return { kind: 'no-data', level };
		// Geladen, aber kein Eintrag für diesen Polygon-Layer → methodisch nicht aggregierbar.
		return { kind: 'not-aggregatable', level, disclaimer: 'brw-not-aggregatable' };
	}

	let agg: LayerAggregate | undefined;
	if (level === 'berlin') {
		agg = entry.berlin;
	} else if (level === 'kiez') {
		const slug = ctx.kiezSlug;
		if (!slug) return { kind: 'no-data', level };
		// Aggregate keyen mit disambiguiertem Slug (Duplikat-BZR-Namen → `-${bezirkSlug}`),
		// resolve-spatial-level (8.1) liefert die plain Form → Fallback-Lookup.
		agg = entry.kiez[slug] ?? (ctx.bezirkSlug ? entry.kiez[`${slug}-${ctx.bezirkSlug}`] : undefined);
	} else {
		const slug = ctx.bezirkSlug;
		if (!slug) return { kind: 'no-data', level };
		agg = entry.bezirk[slug];
	}

	if (!agg) return { kind: 'no-data', level };

	if (isBelowThreshold(agg)) {
		const coverageNote =
			agg.type === 'numeric-median' || agg.type === 'ordinal-distribution'
				? agg.coverage
				: undefined;
		return { kind: 'below-threshold', level, visualType: entry.type, coverageNote };
	}

	return {
		kind: 'aggregate',
		level,
		visualType: entry.type,
		aggregate: agg,
		neutral: entry.neutral
	};
}
