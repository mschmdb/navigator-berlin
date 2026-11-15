import type { LabelValues, MetricValues } from './topics';

/**
 * Kiez- und Bezirksseiten (NAV-104): Themenwerte, Vergleich und Lesehilfe.
 * Eine Region ist ein Kiez oder ein Bezirk, mit Score-Dimensionen und Rohwerten.
 */
export const DIMS = [
	'composite',
	'ruheLuft',
	'gruenHitze',
	'mobilitaet',
	'versorgung',
	'wohnschutz',
	'kultur',
	'kriminalitaet'
] as const;
export type Dim = (typeof DIMS)[number];

/** Dimensionen mit Wertung (höher = mehr davon, im Score-Sinn besser). */
export const RATED_DIMS = [
	'ruheLuft',
	'gruenHitze',
	'mobilitaet',
	'versorgung',
	'wohnschutz',
	'kultur'
] as const satisfies readonly Dim[];

export type DimValues = Readonly<Record<Dim, number | null>>;

export interface RegionSnapshot {
	readonly slug: string;
	readonly name: string;
	/** Bezirk eines Kiezes, `null` bei Bezirken. */
	readonly parentSlug: string | null;
	readonly parentName: string | null;
	readonly dims: DimValues;
	/** Themenwerte in echten Einheiten (Kapitel). */
	readonly metrics: MetricValues;
	readonly labels: LabelValues;
}

export type ReferenceKind = 'berlin' | 'bezirk' | 'nachbar' | 'aehnlich' | 'frei';

export interface ReferenceChoice {
	readonly kind: ReferenceKind;
	readonly slug: string | null;
}

export interface ReferenceProfile {
	readonly id: string;
	/** Name im Satz: „Berlin“, „Neukölln“, „Rixdorf“. */
	readonly label: string;
	/** Erklärt, woraus der Wert besteht: „Median aller 143 Kieze“. */
	readonly note: string | null;
	/** Slug, wenn die Referenz selbst eine Region ist (Hervorhebung in Verteilungen). */
	readonly slug: string | null;
	readonly dims: DimValues;
	readonly metrics: MetricValues;
	readonly labels: LabelValues;
}
