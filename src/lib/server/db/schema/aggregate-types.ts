/**
 * Aggregate-Cluster-Shapes für JSONB-Spalten in bezirk_stats / kiez_stats.
 *
 * FR40 verlangt Quellen-Attribution pro Datenwert. Jeder Aggregat-Wert ist
 * deshalb ein `AggregateValue<T>`-Triple mit `value`, `layer` (Quell-Slug)
 * und `sourceUpdatedAt` (ISO-8601, aus MANIFEST.layers[].sourceUpdatedAt).
 *
 * Datenrealität der Phase-1-MVP-Layer (laerm/luft/gruenversorgung):
 * Diese Layer publizieren ordinal-kategoriale Werte pro LOR-Planungsraum
 * (`kategorie: 'hoch' | 'mittel' | 'niedrig' | ...`), keine numerischen Mittel
 * (dB, NO2). Aggregat-Schema reflektiert das mit `dominantCategory` +
 * `categoryDistribution` statt `meanXxx`. Memory:
 * project_compare_editorial_profiles.md (laerm-2023 = ordinal-kategorisch).
 */

export interface AggregateValue<T> {
	readonly value: T;
	readonly layer: string;
	readonly sourceUpdatedAt: string;
}

export type CategoryDistribution = Record<string, number>;

export interface LaermAggregat {
	readonly dominantCategory: AggregateValue<string> | null;
	readonly categoryDistribution: AggregateValue<CategoryDistribution> | null;
}

export interface LuftAggregat {
	readonly dominantCategory: AggregateValue<string> | null;
	readonly categoryDistribution: AggregateValue<CategoryDistribution> | null;
}

export interface GruenAggregat {
	readonly dominantVersorgung: AggregateValue<string> | null;
	readonly versorgungDistribution: AggregateValue<CategoryDistribution> | null;
	readonly gruenanlagenCount: AggregateValue<number> | null;
	readonly spielplaetzeCount: AggregateValue<number> | null;
}

export interface KlimaAggregat {
	readonly meanPet: AggregateValue<number> | null;
	readonly shareSehrHeiss: AggregateValue<number> | null;
}

export interface WohnenAggregat {
	readonly dominantWohnlage: AggregateValue<string> | null;
	readonly wohnlageDistribution: AggregateValue<CategoryDistribution> | null;
	readonly dominantMss: AggregateValue<string> | null;
	readonly mssDistribution: AggregateValue<CategoryDistribution> | null;
}

export interface OepnvAggregat {
	readonly stopsPerKm2: AggregateValue<number> | null;
	readonly uBahnCount: AggregateValue<number> | null;
	readonly sBahnCount: AggregateValue<number> | null;
	readonly tramCount: AggregateValue<number> | null;
	readonly busCount: AggregateValue<number> | null;
}

export interface BildungAggregat {
	readonly kitasPerKm2: AggregateValue<number> | null;
	readonly schulenPerKm2: AggregateValue<number> | null;
}

/**
 * Heritage-Cluster. Hinweis: `denkmal-2024`-Layer hat nach Mapshaper-Simplify
 * eine ~24%-Feature-Loss (Story 1.25-Bias: keep-shapes eliminiert reine Sliver-
 * Polygone). Die Dichte ist daher leicht unterschätzt; Bias dokumentiert in
 * scripts/aggregate/heritage.ts und docs/runbooks/local-postgres-setup.md.
 */
export interface HeritageAggregat {
	readonly denkmalPerKm2: AggregateValue<number> | null;
	readonly stolpersteinePerKm2: AggregateValue<number> | null;
}
