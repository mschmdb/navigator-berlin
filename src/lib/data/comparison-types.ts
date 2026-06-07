/**
 * Geteilter Typ für die Score-Vergleichs-Zeile (Story 11.4). Genutzt von
 * Server-Load, Hero-Komponente und ScoreComparisonTable.
 */
export interface ComparisonDimRow {
	readonly label: string;
	readonly value: number | null;
	readonly bezirkMean?: number | null;
	readonly berlinMedian: number | null;
	readonly rang: number | null;
	readonly quartil: number | null;
	readonly total: number;
}
