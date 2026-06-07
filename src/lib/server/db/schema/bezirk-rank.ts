import { pgTable, text, integer, timestamp, primaryKey } from 'drizzle-orm/pg-core';

/**
 * Rang + Quartil pro Bezirk (12) und Metrik (Story 11.0). Analog `kiez_rank`,
 * Feld-Größe 12 statt 143. Befüllt von `scripts/aggregate-ranks.ts`.
 */
export const bezirkRank = pgTable(
	'bezirk_rank',
	{
		slug: text('slug').notNull(),
		metricKey: text('metric_key').notNull(),
		rang: integer('rang'),
		quartil: integer('quartil'),
		total: integer('total').notNull(),
		computedAt: timestamp('computed_at', { withTimezone: true }).notNull().defaultNow()
	},
	(t) => [primaryKey({ columns: [t.slug, t.metricKey] })]
);
