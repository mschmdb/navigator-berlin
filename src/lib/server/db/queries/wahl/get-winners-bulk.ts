import { eq, and, sql } from 'drizzle-orm';
import { getDb } from '../../index.js';
import { wahl } from '../../schema/index.js';

export type WinnerBulkRow = {
	wahlId: number;
	gebietSlug: string;
	parteiKurzname: string;
	farbeHex: string;
	anteil: number;
};

/**
 * Stärkste Partei pro Jahr × Gebiet für eine Wahl-Reihe (typ × stimmtyp),
 * in einem Rutsch für die Zeit-Animation (Vorbild: `DISTINCT ON` in
 * `get-stimmbezirks-winners.ts`, hier über alle Wahlen der Reihe statt nur
 * eine). `ebene` wählt zwischen `wahl_aggregat_kiez` und
 * `wahl_aggregat_bezirk` (Code-Map: „Bezirk analog"); Tabellen-/Spaltennamen
 * sind fest verdrahtete Literale, kein User-Input fließt in die Identifier.
 */
export async function getWinnersBulk(
	ebene: 'kiez' | 'bezirk',
	typ: 'btw' | 'agh' | 'bvv',
	stimmtyp: 'erststimme' | 'zweitstimme' | 'einstimme'
): Promise<WinnerBulkRow[]> {
	if (!process.env.DATABASE_URL) return [];
	const db = getDb();

	const wahlenInReihe = await db
		.select({ id: wahl.id })
		.from(wahl)
		.where(and(eq(wahl.typ, typ), eq(wahl.stimmtyp, stimmtyp)));
	if (wahlenInReihe.length === 0) return [];
	const wahlIds = wahlenInReihe.map((w) => w.id);

	const tableIdent =
		ebene === 'bezirk' ? sql.raw('wahl_aggregat_bezirk') : sql.raw('wahl_aggregat_kiez');
	const slugIdent = ebene === 'bezirk' ? sql.raw('bezirk_slug') : sql.raw('kiez_slug');

	const rows = await db.execute<{
		wahl_id: number;
		gebiet_slug: string;
		kurzname: string;
		farbe_hex: string;
		anteil: number;
	}>(sql`
		SELECT DISTINCT ON (a.wahl_id, a.${slugIdent})
			a.wahl_id,
			a.${slugIdent} AS gebiet_slug,
			p.kurzname,
			p.farbe_hex,
			a.anteil
		FROM ${tableIdent} a
		JOIN partei p ON p.id = a.partei_id
		WHERE a.wahl_id IN ${wahlIds}
		ORDER BY a.wahl_id, a.${slugIdent}, a.anteil DESC, p.kurzname ASC
	`);

	return rows.map((r) => ({
		wahlId: r.wahl_id,
		gebietSlug: r.gebiet_slug,
		parteiKurzname: r.kurzname,
		farbeHex: r.farbe_hex,
		anteil: r.anteil
	}));
}
