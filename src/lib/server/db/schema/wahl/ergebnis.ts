import { pgTable, integer, real, boolean, text, primaryKey } from 'drizzle-orm/pg-core';
import { wahl } from './wahl.js';
import { partei } from './partei.js';

export const ergebnis = pgTable(
	'ergebnis',
	{
		wahlId: integer('wahl_id')
			.notNull()
			.references(() => wahl.id, { onDelete: 'cascade' }),
		uwbId: text('uwb_id').notNull(),
		parteiId: integer('partei_id')
			.notNull()
			.references(() => partei.id, { onDelete: 'restrict' }),
		stimmen: integer('stimmen').notNull(),
		anteil: real('anteil').notNull(),
		istBriefwahlAggregat: boolean('ist_briefwahl_aggregat').notNull().default(false)
	},
	(t) => ({
		pk: primaryKey({ columns: [t.wahlId, t.uwbId, t.parteiId] })
	})
);
