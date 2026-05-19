import { pgTable, integer, real, timestamp, primaryKey } from 'drizzle-orm/pg-core';
import { wahl } from './wahl.js';
import { partei } from './partei.js';

export const wahlAggregatBerlin = pgTable(
	'wahl_aggregat_berlin',
	{
		wahlId: integer('wahl_id')
			.notNull()
			.references(() => wahl.id, { onDelete: 'cascade' }),
		parteiId: integer('partei_id')
			.notNull()
			.references(() => partei.id, { onDelete: 'restrict' }),
		stimmen: integer('stimmen').notNull(),
		anteil: real('anteil').notNull(),
		computedAt: timestamp('computed_at', { withTimezone: true }).notNull().defaultNow()
	},
	(t) => ({
		pk: primaryKey({ columns: [t.wahlId, t.parteiId] })
	})
);
