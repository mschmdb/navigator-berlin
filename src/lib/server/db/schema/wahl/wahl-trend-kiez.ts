import { pgTable, real, integer, text, timestamp, primaryKey } from 'drizzle-orm/pg-core';
import { wahlTypEnum, wahlStimmtypEnum } from './wahl.js';
import { partei } from './partei.js';

/**
 * Build-Zeit-Aggregat (ADR-013): Trend (Steigung der linearen Regression
 * des Anteils über Jahre) pro Kiez, Wahl-Reihe und Partei. Siehe
 * `wahl-analytik-kiez.ts` für Wechsel/Volatilität derselben Reihe.
 */
export const wahlTrendKiez = pgTable(
	'wahl_trend_kiez',
	{
		kiezSlug: text('kiez_slug').notNull(),
		typ: wahlTypEnum('typ').notNull(),
		stimmtyp: wahlStimmtypEnum('stimmtyp').notNull(),
		parteiId: integer('partei_id')
			.notNull()
			.references(() => partei.id, { onDelete: 'restrict' }),
		slope: real('slope').notNull(),
		computedAt: timestamp('computed_at', { withTimezone: true }).notNull().defaultNow()
	},
	(t) => ({
		pk: primaryKey({ columns: [t.kiezSlug, t.typ, t.stimmtyp, t.parteiId] })
	})
);
