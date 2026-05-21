// Story 8.2a · Schema der Build-Time-Layer-Aggregate (static JSON, ADR-014 Abschnitt 8).
// Single-Source-of-Truth für die Shape; von der Build-Pipeline (scripts) UND den
// Konsumenten (8.2b Section-Adapter, 8.5 WebMCP) importiert.

export type AggregateType =
	| 'numeric-median'
	| 'ordinal-distribution'
	| 'coverage-share'
	| 'area-share';

export interface NumericMedianAggregate {
	readonly type: 'numeric-median';
	readonly median: number | null;
	readonly min: number | null;
	readonly max: number | null;
	readonly contributingMembers: number;
	readonly totalMembers: number;
	readonly coverage: string;
}

export interface DistributionClass {
	readonly label: string;
	readonly share: number;
}

export interface OrdinalDistributionAggregate {
	readonly type: 'ordinal-distribution';
	readonly classes: readonly DistributionClass[];
	readonly dominant: string | null;
	readonly contributingMembers: number;
	readonly totalMembers: number;
	readonly coverage: string;
}

export interface CoverageShareAggregate {
	readonly type: 'coverage-share';
	readonly share: number;
}

export interface AreaShareAggregate {
	readonly type: 'area-share';
	readonly share: number;
}

export type LayerAggregate =
	| NumericMedianAggregate
	| OrdinalDistributionAggregate
	| CoverageShareAggregate
	| AreaShareAggregate;

export interface LayerAggregateEntry {
	readonly type: AggregateType;
	/** Stigma-Lock: Konsum ohne Severity-Wertung (ADR-014 Abschnitt 5). */
	readonly neutral?: boolean;
	readonly kiez: Record<string, LayerAggregate>;
	readonly bezirk: Record<string, LayerAggregate>;
	readonly berlin: LayerAggregate;
}

export interface LayerAggregatesFile {
	readonly schemaVersion: 1;
	readonly generatedAt: string;
	readonly aggregates: Record<string, LayerAggregateEntry>;
}
