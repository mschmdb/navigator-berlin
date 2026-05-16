import { pgTable, text, jsonb, timestamp } from 'drizzle-orm/pg-core';
import type {
	LaermAggregat,
	LuftAggregat,
	GruenAggregat,
	KlimaAggregat,
	WohnenAggregat,
	OepnvAggregat,
	BildungAggregat,
	HeritageAggregat
} from './aggregate-types.js';

/**
 * Cross-Layer-Aggregat pro Bezirk (12 Zeilen, PK: kebab-case slug).
 * Befüllt von `scripts/aggregate-data.ts` (Story 2.0).
 */
export const bezirkStats = pgTable('bezirk_stats', {
	slug: text('slug').primaryKey(),
	laerm: jsonb('laerm').$type<LaermAggregat>().notNull(),
	luft: jsonb('luft').$type<LuftAggregat>().notNull(),
	gruen: jsonb('gruen').$type<GruenAggregat>().notNull(),
	klima: jsonb('klima').$type<KlimaAggregat>().notNull(),
	wohnen: jsonb('wohnen').$type<WohnenAggregat>().notNull(),
	oepnv: jsonb('oepnv').$type<OepnvAggregat>().notNull(),
	bildung: jsonb('bildung').$type<BildungAggregat>().notNull(),
	heritage: jsonb('heritage').$type<HeritageAggregat>().notNull(),
	computedAt: timestamp('computed_at', { withTimezone: true }).notNull().defaultNow()
});
