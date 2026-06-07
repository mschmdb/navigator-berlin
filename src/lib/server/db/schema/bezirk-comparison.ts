import { pgTable, text, doublePrecision, timestamp, primaryKey } from 'drizzle-orm/pg-core';

/**
 * Vergleichswerte pro Bezirk (12) und Score-Metrik (Story 11.4): Bezirks-Wert
 * + Berlin-Median über alle 12 Bezirke. Befüllt von
 * `scripts/aggregate-comparison.ts`.
 */
export const bezirkComparison = pgTable(
	'bezirk_comparison',
	{
		slug: text('slug').notNull(),
		metricKey: text('metric_key').notNull(),
		bezirkValue: doublePrecision('bezirk_value'),
		berlinMedian: doublePrecision('berlin_median'),
		computedAt: timestamp('computed_at', { withTimezone: true }).notNull().defaultNow()
	},
	(t) => [primaryKey({ columns: [t.slug, t.metricKey] })]
);
