import { sql } from 'drizzle-orm';
import { getDb } from '../../index.js';

export type StimmbezirkResult = {
	parteiKurzname: string;
	parteiVollname: string;
	farbeHex: string;
	stimmen: number;
	anteil: number;
};

export type StimmbezirkGruppeResults = {
	/** `null`, wenn die Urne keiner Gruppe zugeordnet ist (Wahl ohne Geometrie/Gruppen-Build). */
	gruppeId: string | null;
	results: StimmbezirkResult[];
};

/**
 * Punkt → Urne → Gruppe → Gruppen-Ergebnis (Story 17): liefert die
 * Top-`limit`-Parteien der Briefwahl-Gruppe, der die übergebene Urnen-uwbId
 * angehört (`wahl_stimmbezirk_gruppe`), NICHT mehr nur die einzelne Urne.
 * Löst die frühere reine Urnen-Sicht ab (ergebnis WHERE uwb_id = uwbId).
 */
export async function getResultsForStimmbezirk(
	wahlId: number,
	uwbId: string,
	limit = 5
): Promise<StimmbezirkGruppeResults> {
	if (!process.env.DATABASE_URL) return { gruppeId: null, results: [] };
	const rows = await getDb().execute<{
		gruppe_id: string;
		kurzname: string;
		vollname: string;
		farbe_hex: string;
		stimmen: number;
		anteil: number;
	}>(sql`
		WITH gruppe AS (
			SELECT gruppe_id FROM wahl_stimmbezirk_gruppe
			WHERE wahl_id = ${wahlId} AND uwb_id = ${uwbId}
		),
		mitglieder AS (
			SELECT g.uwb_id, g.gruppe_id FROM wahl_stimmbezirk_gruppe g
			WHERE g.wahl_id = ${wahlId} AND g.gruppe_id = (SELECT gruppe_id FROM gruppe)
		),
		summen AS (
			SELECT m.gruppe_id, e.partei_id, SUM(e.stimmen)::int AS stimmen
			FROM ergebnis e
			JOIN mitglieder m ON m.uwb_id = e.uwb_id
			WHERE e.wahl_id = ${wahlId}
			GROUP BY m.gruppe_id, e.partei_id
		)
		SELECT
			s.gruppe_id,
			p.kurzname,
			p.vollname,
			p.farbe_hex,
			s.stimmen,
			(s.stimmen::float / NULLIF(SUM(s.stimmen) OVER (PARTITION BY s.gruppe_id), 0))::real AS anteil
		FROM summen s
		JOIN partei p ON p.id = s.partei_id
		ORDER BY s.stimmen DESC
		LIMIT ${limit}
	`);

	if (rows.length === 0) return { gruppeId: null, results: [] };
	return {
		gruppeId: rows[0].gruppe_id,
		results: rows.map((r) => ({
			parteiKurzname: r.kurzname,
			parteiVollname: r.vollname,
			farbeHex: r.farbe_hex,
			stimmen: r.stimmen,
			anteil: r.anteil
		}))
	};
}
