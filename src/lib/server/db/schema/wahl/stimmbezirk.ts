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
		bezirksart: text('bezirksart'),
		/**
		 * Story 17 (Briefwahl-Gruppen): Zahl der Wahlberechtigten dieses
		 * Stimmbezirks, bereits im Row-Transformer geparst (`wahlberechtigte`),
		 * bis hierher aber nie persistiert. Grundlage für die anteilige
		 * Briefwahl-Verteilung im Kiez-Aggregat (Design Notes: `brief_u =
		 * brief_g × wb_u / Σ wb(g)`). `null` für ältere Wahlen/Re-Ingests ohne
		 * diese Spalte, bis ein Re-Fetch sie befüllt.
		 */
		wahlberechtigte: integer('wahlberechtigte')
	},
	(t) => ({
		pk: primaryKey({ columns: [t.wahlId, t.uwbId] })
	})
);
