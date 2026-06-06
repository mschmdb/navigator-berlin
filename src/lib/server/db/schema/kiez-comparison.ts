import { pgTable, text, doublePrecision, timestamp, primaryKey } from 'drizzle-orm/pg-core';

/**
 * Vergleichswerte pro Kiez (LOR-Bezirksregion) und Score-Metrik (Story 11.4):
 * Kiez-Wert, Schnitt des Eltern-Bezirks, Berlin-Median über alle 143 Kieze.
 * Befüllt von `scripts/aggregate-comparison.ts` (TRUNCATE+Insert, idempotent).
 * `null` möglich bei fehlenden Dimensionen.
 */
export const kiezComparison = pgTable(
	'kiez_comparison',
	{
		slug: text('slug').notNull(),
		metricKey: text('metric_key').notNull(),
		kiezValue: doublePrecision('kiez_value'),
		bezirkMean: doublePrecision('bezirk_mean'),
		berlinMedian: doublePrecision('berlin_median'),
		computedAt: timestamp('computed_at', { withTimezone: true }).notNull().defaultNow()
	},
	(t) => [primaryKey({ columns: [t.slug, t.metricKey] })]
);
