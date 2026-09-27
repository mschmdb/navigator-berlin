import type { KiezScoreDimension } from '$lib/data';

/**
 * Geteilter Typ für die Score-Vergleichs-Zeile (Story 11.4). Genutzt von
 * Server-Load, Hero-Komponente und ScoreComparisonTable.
 *
 * i18n Block B4a: `label` (fester DE-String) → `key` (`KiezScoreDimension`,
 * Datenschlüssel). Der Client löst das Anzeige-Label über
 * `dimensionLabel(key, opts)` auf (`kiez-score-display.ts`, bereits
 * locale-fähig aus Block B3a). `score-comparison-table.svelte` erkennt die
 * Kriminalitäts-Zeile am `key`, nicht mehr am (jetzt lokalisierten) Label.
 */
export interface ComparisonDimRow {
	readonly key: KiezScoreDimension;
	readonly value: number | null;
	readonly bezirkMean?: number | null;
	readonly berlinMedian: number | null;
	readonly rang: number | null;
	readonly quartil: number | null;
	readonly total: number;
}

export interface ScoreDimensionKey {
	/** camelCase-Datenschlüssel (`KiezScore`-Feld/DB-`metricKey`), unverändert (Boundary). */
	readonly field: string;
	/** Hyphenierter Anzeige-Schlüssel, siehe `dimensionLabel()` (`kiez-score-display.ts`). */
	readonly key: KiezScoreDimension;
}

/**
 * Kanonische Zuordnung camelCase-Datenschlüssel → hyphenierter
 * `KiezScoreDimension`-Anzeige-Schlüssel. Eine Quelle für `kiez/[slug]` und
 * `bezirk/[slug]` `+page.server.ts` (Vergleichstabelle, alle 7 Dimensionen)
 * und `kiez-hero.svelte` (Score-Summary, nur die `COMPOSITE_DIMENSIONS`-
 * Teilmenge, siehe `scripts/lib/kiez-score/types.ts`). Vormals 3x dupliziert
 * (Review-Fund i18n Block B4a).
 */
export const SCORE_DIMENSION_KEYS: readonly ScoreDimensionKey[] = [
	{ field: 'ruheLuft', key: 'ruhe-luft' },
	{ field: 'gruenHitze', key: 'gruen-hitze' },
	{ field: 'mobilitaet', key: 'mobilitaet' },
	{ field: 'versorgung', key: 'versorgung' },
	{ field: 'wohnschutz', key: 'wohnschutz' },
	// Option C: Kultur ist eigenständig (nicht im Gesamt-Score), wird aber als Vergleichszeile gezeigt.
	{ field: 'kultur', key: 'kultur' },
	// Story 14.9: Kriminalität als Kontext-Vergleichszeile (Option C). Kein Rang (nicht in METRICS),
	// Strukturell-Indigo/neutral, BR-Granularität (ADR-019). NICHT in der Prosa (14.8).
	{ field: 'kriminalitaet', key: 'kriminalitaet' }
];
