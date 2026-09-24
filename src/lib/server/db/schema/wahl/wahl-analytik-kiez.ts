import { pgTable, real, integer, text, jsonb, timestamp, primaryKey } from 'drizzle-orm/pg-core';
import { wahlTypEnum, wahlStimmtypEnum } from './wahl.js';

/**
 * Build-Zeit-Aggregat (ADR-013): Wechsel + Volatilität pro Kiez und
 * Wahl-Reihe (typ × stimmtyp), berechnet vom pure Rechenkern in
 * `$lib/server/wahl/analytik.ts` (siehe `scripts/build-wahl-analytik.ts`).
 * Wiederholungswahlen bereits in `wechsel_count`/`wechsel_jahre` gemergt
 * (letztgültiger Stand pro Legislatur).
 */
export const wahlAnalytikKiez = pgTable(
	'wahl_analytik_kiez',
	{
		kiezSlug: text('kiez_slug').notNull(),
		typ: wahlTypEnum('typ').notNull(),
		stimmtyp: wahlStimmtypEnum('stimmtyp').notNull(),
		wechselCount: integer('wechsel_count').notNull(),
		wechselJahre: jsonb('wechsel_jahre').$type<number[]>().notNull(),
		/** Mittlerer Pedersen-Index (halbe L1-Distanz) je Legislatur-Übergang, 0..1; 0 = < 2 Legislaturen. */
		volatilitaet: real('volatilitaet').notNull(),
		computedAt: timestamp('computed_at', { withTimezone: true }).notNull().defaultNow()
	},
	(t) => ({
		pk: primaryKey({ columns: [t.kiezSlug, t.typ, t.stimmtyp] })
	})
);
