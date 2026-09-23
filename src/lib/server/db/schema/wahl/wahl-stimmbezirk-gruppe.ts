import { pgTable, integer, text, primaryKey, index } from 'drizzle-orm/pg-core';
import { wahl } from './wahl.js';

/**
 * Story 17 (Briefwahl-Gruppen als kleinste Kartenebene): Ordnet jeden
 * Stimmbezirk (Urne ODER Briefwahlbezirk) einer Wahl seiner Briefwahl-Gruppe
 * zu. Eine Gruppe besteht aus allen Urnen-Stimmbezirken mit demselben
 * Briefwahlbezirk PLUS diesem Briefwahlbezirk selbst -- der Briefwahl-Row
 * zeigt dafür auf sich selbst (`uwbId === gruppeId`, Design Notes).
 *
 * Gefüllt im Kiez-Build (`build-wahl-kiez-aggregat.ts`) aus der
 * Stimmbezirks-Geometrie (`gruppeIdFromGeo`, `wahl-geo-mapping.ts`) --
 * ausschließlich für Wahlen mit Geometrie (siehe `WAHL_TO_GEO`). Build bricht
 * ab (statt still wegzulassen), wenn ein Briefwahl-Stimmbezirk keiner Gruppe
 * zugeordnet werden kann oder eine Urne ohne Gruppe bleibt (Boundary
 * "Always").
 */
export const wahlStimmbezirkGruppe = pgTable(
	'wahl_stimmbezirk_gruppe',
	{
		wahlId: integer('wahl_id')
			.notNull()
			.references(() => wahl.id, { onDelete: 'cascade' }),
		uwbId: text('uwb_id').notNull(),
		gruppeId: text('gruppe_id').notNull()
	},
	(t) => ({
		pk: primaryKey({ columns: [t.wahlId, t.uwbId] }),
		gruppeIdx: index('wahl_stimmbezirk_gruppe_gruppe_idx').on(t.wahlId, t.gruppeId)
	})
);
