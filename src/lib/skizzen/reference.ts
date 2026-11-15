import { mean, median, mostCommon, zeroAwareMedian } from './stats';
import { LABELS, METRICS, type LabelValues, type MetricValues } from './topics';
import {
	DIMS,
	type DimValues,
	type FigureValues,
	type ReferenceChoice,
	type ReferenceProfile,
	type RegionSnapshot
} from './types';

export interface ReferenceParseContext {
	readonly self: string;
	readonly hasParent: boolean;
	readonly neighbors: readonly string[];
	readonly similar: readonly string[];
	readonly all: ReadonlySet<string>;
}

const BERLIN: ReferenceChoice = { kind: 'berlin', slug: null };

/** URL-Parameter `vs` → Bezugspunkt. Unbekanntes fällt still auf Berlin zurück. */
export function parseReference(param: string | null, ctx: ReferenceParseContext): ReferenceChoice {
	if (!param || param === 'berlin') return BERLIN;
	if (param === 'bezirk') return ctx.hasParent ? { kind: 'bezirk', slug: null } : BERLIN;
	if (param === ctx.self || !ctx.all.has(param)) return BERLIN;
	if (ctx.neighbors.includes(param)) return { kind: 'nachbar', slug: param };
	if (ctx.similar.includes(param)) return { kind: 'aehnlich', slug: param };
	return { kind: 'frei', slug: param };
}

export function serializeReference(choice: ReferenceChoice): string | null {
	if (choice.kind === 'berlin') return null;
	if (choice.kind === 'bezirk') return 'bezirk';
	return choice.slug;
}

export function aggregateProfile(
	id: string,
	label: string,
	regions: readonly RegionSnapshot[],
	method: 'median' | 'mean',
	figures: FigureValues,
	note: string | null = null,
	/** Eigene Themenwerte eines Gebiets (Bezirk), statt Median oder Mittel seiner Kieze. */
	own: { metrics: MetricValues; labels: LabelValues } | null = null
): ReferenceProfile {
	const agg = method === 'median' ? median : mean;
	const dims = Object.fromEntries(
		DIMS.map((d) => [d, agg(regions.map((r) => r.dims[d]))])
	) as DimValues;
	// Median der Themenwerte ohne großen Nullstapel, wie in den Grafiken (Milieuschutz).
	const metricAgg = (xs: (number | null)[]) =>
		method === 'median' ? zeroAwareMedian(xs).value : mean(xs);
	const metrics =
		own?.metrics ??
		(Object.fromEntries(
			METRICS.map((m) => [m, metricAgg(regions.map((r) => r.metrics?.[m] ?? null))])
		) as MetricValues);
	const labels =
		own?.labels ??
		(Object.fromEntries(
			LABELS.map((l) => [l, mostCommon(regions.map((r) => r.labels?.[l] ?? null))])
		) as LabelValues);
	return { id, label, note, slug: null, dims, figures, metrics, labels };
}

export function regionProfile(r: RegionSnapshot): ReferenceProfile {
	return {
		id: r.slug,
		label: r.name,
		note: null,
		slug: r.slug,
		dims: r.dims,
		figures: r.figures,
		metrics: r.metrics,
		labels: r.labels
	};
}

export function resolveReference(
	choice: ReferenceChoice,
	ctx: {
		readonly berlin: ReferenceProfile;
		readonly bezirk: ReferenceProfile | null;
		readonly regions: ReadonlyMap<string, RegionSnapshot>;
	}
): ReferenceProfile {
	if (choice.kind === 'berlin') return ctx.berlin;
	if (choice.kind === 'bezirk') return ctx.bezirk ?? ctx.berlin;
	const r = choice.slug ? ctx.regions.get(choice.slug) : undefined;
	return r ? regionProfile(r) : ctx.berlin;
}
