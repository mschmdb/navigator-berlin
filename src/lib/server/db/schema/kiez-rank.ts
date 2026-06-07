import { pgTable, text, integer, timestamp, primaryKey } from 'drizzle-orm/pg-core';

/**
 * Rang + Quartil pro Kiez (LOR-Bezirksregion) und Metrik (Story 11.0).
 *
 * Generisch keyed by (slug, metricKey): deckt Score-Dimensionen (composite,
 * ruheLuft, gruenHitze, mobilitaet, versorgung, wohnschutz) UND numerische
 * stats-Metriken (gruenanlagenCount, stopsPerKm2, ...) ab. `rang`/`quartil` sind
 * nullable für Kieze ohne Wert in der Metrik. Befüllt von
 * `scripts/aggregate-ranks.ts` (TRUNCATE+Insert, idempotent).
 *
 * Rang 1 = bester Wert je Metrik-Richtung. Quartil 1..4 (1 = bestes Viertel),
 * rang-basiert. Anti-Stigma (ADR-015): Render zeigt Quartil statt exaktem letztem
 * Rang bei schwachen Werten.
 */
export const kiezRank = pgTable(
	'kiez_rank',
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
