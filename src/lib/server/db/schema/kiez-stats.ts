import { pgTable, text, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { bezirkStats } from './bezirk-stats.js';
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
 * Cross-Layer-Aggregat pro Kiez = LOR-Bezirksregion (143 Zeilen, PK: kebab-case slug).
 * FK `bezirk_slug` referenziert `bezirk_stats.slug`.
 * Befüllt von `scripts/aggregate-data.ts` (Story 2.0).
 */
export const kiezStats = pgTable('kiez_stats', {
	slug: text('slug').primaryKey(),
	bezirkSlug: text('bezirk_slug')
		.notNull()
		.references(() => bezirkStats.slug, { onDelete: 'restrict' }),
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
