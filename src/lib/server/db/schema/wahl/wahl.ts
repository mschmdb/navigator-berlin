import {
	pgTable,
	serial,
	integer,
	boolean,
	text,
	timestamp,
	pgEnum,
	uniqueIndex,
	type AnyPgColumn
} from 'drizzle-orm/pg-core';

export const wahlTypEnum = pgEnum('wahl_typ', ['btw', 'agh', 'bvv']);
export const wahlStimmtypEnum = pgEnum('wahl_stimmtyp', ['erststimme', 'zweitstimme', 'einstimme']);

export const wahl = pgTable(
	'wahl',
	{
		id: serial('id').primaryKey(),
		jahr: integer('jahr').notNull(),
		typ: wahlTypEnum('typ').notNull(),
		stimmtyp: wahlStimmtypEnum('stimmtyp').notNull(),
		isRepeatElection: boolean('is_repeat_election').notNull().default(false),
		parentElectionId: integer('parent_election_id').references((): AnyPgColumn => wahl.id),
		sourceUrl: text('source_url').notNull(),
		license: text('license').notNull().default('dl-de/by-2.0'),
		sourceUpdatedAt: timestamp('source_updated_at', { withTimezone: true }),
		/**
		 * Vorläufiges Ergebnis (Matze-Entscheidung 23.09., 1B). Explizites
		 * Config-Flag aus `WahlSource.vorlaeufig`, keine Text-Heuristik.
		 * Re-Ingest beim Endergebnis muss das Flag auf `false` zurücksetzen.
		 */
		vorlaeufig: boolean('vorlaeufig').notNull().default(false),
		computedAt: timestamp('computed_at', { withTimezone: true }).notNull().defaultNow()
	},
	(t) => ({
		uniqJahrTypStimmtyp: uniqueIndex('wahl_jahr_typ_stimmtyp_uniq').on(t.jahr, t.typ, t.stimmtyp)
	})
);
