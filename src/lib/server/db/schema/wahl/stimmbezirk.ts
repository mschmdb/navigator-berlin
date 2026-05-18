import { pgTable, integer, text, char, primaryKey } from 'drizzle-orm/pg-core';
import { wahl } from './wahl.js';

export const stimmbezirk = pgTable(
	'stimmbezirk',
	{
		wahlId: integer('wahl_id')
			.notNull()
			.references(() => wahl.id, { onDelete: 'cascade' }),
		uwbId: text('uwb_id').notNull(),
		wahlkreis: text('wahlkreis').notNull(),
		wahlbezirk: text('wahlbezirk').notNull(),
		bezirkCode: char('bezirk_code', { length: 2 }).notNull(),
		bezirksart: text('bezirksart')
	},
	(t) => ({
		pk: primaryKey({ columns: [t.wahlId, t.uwbId] })
	})
);
