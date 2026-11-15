/**
 * Kompakte Seitendaten (NAV-105): Die Kiez- und Bezirksseiten brauchen die Werte aller Orte
 * für Verteilungen und Vergleiche. Statt 143 Objekte mit wiederholten Schlüsseln und Namen
 * gehen Spalten über die Leitung: ein Array je Kennzahl, Namen und Texte nur einmal.
 */
import { LABELS, METRICS, METRIC_SPECS, type LabelValues, type MetricValues } from './topics';
import { DIMS, type DimValues, type RegionSnapshot } from './types';
import type { WahlArt, WahlBundle, WahlPunkt } from './wahl-types';

export interface PackedRegions {
	readonly slugs: readonly string[];
	readonly names: readonly string[];
	/** Index in `parents`, -1 ohne Bezirk. */
	readonly parent: readonly number[];
	readonly parents: readonly { readonly slug: string; readonly name: string }[];
	readonly dims: readonly (readonly (number | null)[])[];
	/** Ganze Zahlen: Wert mal 10^exps[k] (höchstens Nachkommastellen + 2, siehe `compactMetrics`). */
	readonly metrics: readonly (readonly (number | null)[])[];
	readonly exps: readonly number[];
	/** Index in `texts`, -1 ohne Wert. */
	readonly labels: readonly (readonly number[])[];
	readonly texts: readonly string[];
}

function indexer<T>(key: (v: T) => string) {
	const items: T[] = [];
	const at = new Map<string, number>();
	return {
		items,
		index(v: T): number {
			const k = key(v);
			let i = at.get(k);
			if (i === undefined) {
				i = items.length;
				items.push(v);
				at.set(k, i);
			}
			return i;
		}
	};
}

/** Kleinste Zehnerpotenz, mit der alle Werte ganze Zahlen werden (höchstens Nachkommastellen + 2). */
function scaleFor(id: (typeof METRICS)[number], values: readonly (number | null)[]): number {
	const max = METRIC_SPECS[id].digits + 2;
	for (let e = 0; e < max; e++) {
		const f = 10 ** e;
		if (values.every((v) => v === null || Math.abs(Math.round(v * f) - v * f) < 1e-6)) return e;
	}
	return max;
}

export function packRegions(regions: readonly RegionSnapshot[]): PackedRegions {
	const parents = indexer<{ slug: string; name: string }>((p) => p.slug);
	const texts = indexer<string>((t) => t);
	const exps = METRICS.map((id) =>
		scaleFor(
			id,
			regions.map((r) => r.metrics[id])
		)
	);
	return {
		slugs: regions.map((r) => r.slug),
		names: regions.map((r) => r.name),
		parent: regions.map((r) =>
			r.parentSlug === null ? -1 : parents.index({ slug: r.parentSlug, name: r.parentName ?? '' })
		),
		parents: parents.items,
		// Score-Punkte mit einer Nachkommastelle, als ganze Zehntel.
		dims: DIMS.map((d) =>
			regions.map((r) => {
				const v = r.dims[d];
				return v === null ? null : Math.round(v * 10);
			})
		),
		metrics: METRICS.map((id, k) =>
			regions.map((r) => {
				const v = r.metrics[id];
				return v === null ? null : Math.round(v * 10 ** exps[k]);
			})
		),
		exps,
		labels: LABELS.map((l) =>
			regions.map((r) => (r.labels[l] === null ? -1 : texts.index(r.labels[l])))
		),
		texts: texts.items
	};
}

export function unpackRegions(p: PackedRegions): RegionSnapshot[] {
	return p.slugs.map((slug, i) => {
		const parent = p.parent[i] >= 0 ? p.parents[p.parent[i]] : null;
		return {
			slug,
			name: p.names[i],
			parentSlug: parent?.slug ?? null,
			parentName: parent?.name ?? null,
			dims: Object.fromEntries(
				DIMS.map((d, k) => {
					const v = p.dims[k][i];
					return [d, v === null ? null : v / 10];
				})
			) as DimValues,
			metrics: Object.fromEntries(
				METRICS.map((id, k) => {
					const v = p.metrics[k][i];
					return [id, v === null ? null : v / 10 ** p.exps[k]];
				})
			) as MetricValues,
			labels: Object.fromEntries(
				LABELS.map((l, k) => [l, p.labels[k][i] >= 0 ? p.texts[p.labels[k][i]] : null])
			) as LabelValues
		};
	});
}

/** Wahlpunkte als `[jahr, parteiIndex, anteil]`, Partei und Farbe einmal. */
export interface PackedWahl {
	readonly parties: readonly { readonly name: string; readonly farbe: string }[];
	readonly points: Readonly<Record<WahlArt, readonly (readonly [number, number, number])[]>>;
}

const ARTEN: readonly WahlArt[] = ['btw', 'agh', 'bvv'];

export function packWahl(bundle: WahlBundle): PackedWahl {
	const parties = indexer<{ name: string; farbe: string }>((p) => `${p.name}\u0000${p.farbe}`);
	const points = Object.fromEntries(
		ARTEN.map((art) => [
			art,
			bundle[art].map(
				(p) => [p.jahr, parties.index({ name: p.partei, farbe: p.farbe }), p.anteil] as const
			)
		])
	) as unknown as PackedWahl['points'];
	return { parties: parties.items, points };
}

export function unpackWahl(p: PackedWahl): WahlBundle {
	return Object.fromEntries(
		ARTEN.map((art) => [
			art,
			p.points[art].map(
				([jahr, i, anteil]): WahlPunkt => ({
					jahr,
					partei: p.parties[i].name,
					farbe: p.parties[i].farbe,
					anteil
				})
			)
		])
	) as unknown as WahlBundle;
}
