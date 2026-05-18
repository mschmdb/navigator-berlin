import { pgTable, serial, integer, text } from 'drizzle-orm/pg-core';

export const partei = pgTable('partei', {
	id: serial('id').primaryKey(),
	kurzname: text('kurzname').notNull().unique(),
	vollname: text('vollname').notNull(),
	farbeHex: text('farbe_hex').notNull(),
	firstSeenYear: integer('first_seen_year'),
	lastSeenYear: integer('last_seen_year')
});
