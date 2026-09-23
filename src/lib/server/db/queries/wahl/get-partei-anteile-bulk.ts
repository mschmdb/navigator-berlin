import { eq, and, sql } from 'drizzle-orm';
import { getDb } from '../../index.js';
import { wahl } from '../../schema/index.js';

/** Identisches Row-Shape zu `WinnerBulkRow` (get-winners-bulk.ts): der
 * Response-Mapping-Code in `winners/+server.ts` bleibt dadurch 1:1
 * wiederverwendbar, egal ob die Rows Sieger- oder Partei-Anteile tragen. */
export type ParteiAnteilBulkRow = {
	wahlId: number;
	gebietSlug: string;
	parteiKurzname: string;
	farbeHex: string;
	anteil: number;
};

/**
 * Story 9 (Partei-Tabs): Anteil EINER Partei pro Jahr × Gebiet für eine
 * Wahl-Reihe, in einem Rutsch (Muster `get-winners-bulk.ts`, aber OHNE
 * `DISTINCT ON` -- hier gibt es genau eine Row je Wahl × Gebiet × Partei
 * statt eine Auswahl unter allen Parteien). `ebene`/Tabellen-Identifier
 * exakt wie im Bauplan; kein User-Input fließt in `sql.raw`-Identifier,
 * `partei` geht als gebundener Parameter in die WHERE-Klausel.
 */
export async function getParteiAnteileBulk(
	ebene: 'kiez' | 'bezirk',
	typ: 'btw' | 'agh' | 'bvv',
	stimmtyp: 'erststimme' | 'zweitstimme' | 'einstimme',
	partei: string
): Promise<ParteiAnteilBulkRow[]> {
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
		SELECT
			a.wahl_id,
			a.${slugIdent} AS gebiet_slug,
			p.kurzname,
			p.farbe_hex,
			a.anteil
		FROM ${tableIdent} a
		JOIN partei p ON p.id = a.partei_id
		WHERE a.wahl_id IN ${wahlIds} AND p.kurzname = ${partei}
		ORDER BY a.wahl_id, a.${slugIdent}
	`);

	return rows.map((r) => ({
		wahlId: r.wahl_id,
		gebietSlug: r.gebiet_slug,
		parteiKurzname: r.kurzname,
		farbeHex: r.farbe_hex,
		anteil: r.anteil
	}));
}

/** Identisches Row-Shape zu `StimmbezirkWinner` (get-stimmbezirks-winners.ts). */
export type StimmbezirkParteiAnteil = {
	gruppeId: string;
	parteiKurzname: string;
	parteiVollname: string;
	farbeHex: string;
	stimmen: number;
	anteil: number;
};

/**
 * Gruppen-Variante (Story 17, Muster `get-stimmbezirks-winners.ts`): Anteil
 * EINER Partei je Briefwahl-Gruppe einer Wahl, OHNE `DISTINCT ON` (eine Row
 * je Gruppe × Partei statt eine Auswahl unter allen Parteien).
 */
export async function getParteiAnteileStimmbezirk(
	wahlId: number,
	partei: string
): Promise<StimmbezirkParteiAnteil[]> {
	if (!process.env.DATABASE_URL) return [];
	const rows = await getDb().execute<{
		gruppe_id: string;
		kurzname: string;
		vollname: string;
		farbe_hex: string;
		stimmen: number;
		anteil: number;
	}>(sql`
		WITH gruppen_summen AS (
			SELECT
				g.gruppe_id,
				e.partei_id,
				SUM(e.stimmen)::int AS stimmen
			FROM ergebnis e
			JOIN wahl_stimmbezirk_gruppe g ON g.wahl_id = e.wahl_id AND g.uwb_id = e.uwb_id
			WHERE e.wahl_id = ${wahlId}
			GROUP BY g.gruppe_id, e.partei_id
		),
		mit_anteil AS (
			SELECT
				gruppe_id,
				partei_id,
				stimmen,
				(stimmen::float / NULLIF(SUM(stimmen) OVER (PARTITION BY gruppe_id), 0))::real AS anteil
			FROM gruppen_summen
		)
		SELECT m.gruppe_id, p.kurzname, p.vollname, p.farbe_hex, m.stimmen, m.anteil
		FROM mit_anteil m
		JOIN partei p ON p.id = m.partei_id
		WHERE p.kurzname = ${partei}
		ORDER BY m.gruppe_id
	`);
	return rows.map((r) => ({
		gruppeId: r.gruppe_id,
		parteiKurzname: r.kurzname,
		parteiVollname: r.vollname,
		farbeHex: r.farbe_hex,
		stimmen: r.stimmen,
		anteil: r.anteil
	}));
}
