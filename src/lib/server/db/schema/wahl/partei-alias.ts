import { pgTable, serial, integer, text, uniqueIndex } from 'drizzle-orm/pg-core';
import { partei } from './partei.js';

export const parteiAlias = pgTable(
	'partei_alias',
	{
		id: serial('id').primaryKey(),
		parteiId: integer('partei_id')
			.notNull()
			.references(() => partei.id, { onDelete: 'cascade' }),
		aliasLabel: text('alias_label').notNull(),
		jahr: integer('jahr')
	},
	(t) => ({
		uniqLabelJahr: uniqueIndex('partei_alias_label_jahr_uniq').on(t.aliasLabel, t.jahr)
	})
);
