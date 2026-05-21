import { pgTable, text, doublePrecision, timestamp } from 'drizzle-orm/pg-core';
import { bezirkStats } from './bezirk-stats.js';

/**
 * Kiez-Score-Aggregat (143 Zeilen, LOR-Bezirksregion). Schema-only in Story 2.0;
 * Befüllung in Story 2.9a via Aggregation 542 PLR → 143 BZR (flächen-gewichtet).
 *
 * FK `bezirk_slug` referenziert `bezirk_stats.slug`.
 */
export const kiezScore = pgTable('kiez_score', {
	slug: text('slug').primaryKey(),
	bezirkSlug: text('bezirk_slug')
		.notNull()
		.references(() => bezirkStats.slug, { onDelete: 'restrict' }),
	composite: doublePrecision('composite').notNull(),
	ruheLuft: doublePrecision('ruhe_luft'),
	gruenHitze: doublePrecision('gruen_hitze'),
	mobilitaet: doublePrecision('mobilitaet'),
	versorgung: doublePrecision('versorgung'),
	wohnschutz: doublePrecision('wohnschutz'),
	computedAt: timestamp('computed_at', { withTimezone: true }).notNull().defaultNow()
});
