import { pgTable, text, doublePrecision, timestamp } from 'drizzle-orm/pg-core';

/**
 * Bezirks-Score-Aggregat (12 Zeilen). Schema-only in Story 2.0;
 * Befüllung erfolgt in Story 2.9a (Score-Berechnung aus 1.28-PLR-Source).
 *
 * Komponenten = 5 Dimensionen aus ADR-015 (Umwelt- & Infrastruktur-Score):
 * ruhe-luft / gruen-hitze / mobilitaet / versorgung / wohnschutz.
 * Composite = gewichtetes Mittel (5 × 0.20).
 *
 * Number-Spalten statt JSONB hier, weil Story 2.9b Range-Queries
 * (ORDER BY composite DESC LIMIT 10) braucht.
 */
export const bezirkScore = pgTable('bezirk_score', {
	slug: text('slug').primaryKey(),
	composite: doublePrecision('composite').notNull(),
	ruheLuft: doublePrecision('ruhe_luft'),
	gruenHitze: doublePrecision('gruen_hitze'),
	mobilitaet: doublePrecision('mobilitaet'),
	versorgung: doublePrecision('versorgung'),
	wohnschutz: doublePrecision('wohnschutz'),
	computedAt: timestamp('computed_at', { withTimezone: true }).notNull().defaultNow()
});
