import { sql } from 'drizzle-orm';
import { getDb } from '../../index.js';

export type StimmbezirkWinner = {
	gruppeId: string;
	parteiKurzname: string;
	parteiVollname: string;
	farbeHex: string;
	stimmen: number;
	anteil: number;
};

/**
 * Liefert pro Briefwahl-Gruppe (Story 17: kleinste Kartenebene) die
 * stärkste Partei einer Wahl. Eine Gruppe = alle Urnen-Stimmbezirke mit
 * demselben Briefwahlbezirk PLUS dieser Briefwahlbezirk selbst
 * (`wahl_stimmbezirk_gruppe`, gefüllt im Kiez-Build). Ersetzt die frühere
 * Urnen-only-Sicht (`ist_briefwahl_aggregat = false`-Filter) -- Briefwahl
 * ist jetzt Teil der Gruppen-Summe, keine separate ausgefilterte Row mehr.
 *
 * Wahlen/Jahre ohne `wahl_stimmbezirk_gruppe`-Rows (keine Geometrie, siehe
 * `WAHL_TO_GEO`) liefern eine leere Liste -- der Aufrufer (`winners/+server.ts`)
 * prüft `geoSlugForWahl` vorher bereits und ruft diese Funktion in dem Fall
 * gar nicht erst auf.
 *
 * Performance-Hinweis: bei BTW25 1275 Gruppen aus ~3.598 Stimmbezirken
 * (Urne + Brief, siehe `static/layers/MANIFEST.json#wahlgruppen-bt25`).
 * `DISTINCT ON (gruppe_id)` ist Postgres-spezifisch und liefert pro Gruppe
 * die Row mit höchstem `stimmen`-Wert; bei Gleichstand entscheidet
 * `p.kurzname ASC` (Review-Fund: Gleichstand war zuvor plan-abhängig/
 * nicht-deterministisch, z. B. AGH26 Gruppe 03B3F Linke=AfD=325 -- gleicher
 * Tie-Break wie `get-winners-bulk.ts`/die Analytik).
 */
export async function getStimmbezirksWinners(wahlId: number): Promise<StimmbezirkWinner[]> {
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
		SELECT DISTINCT ON (m.gruppe_id)
			m.gruppe_id,
			p.kurzname,
			p.vollname,
			p.farbe_hex,
			m.stimmen,
			m.anteil
		FROM mit_anteil m
		JOIN partei p ON p.id = m.partei_id
		ORDER BY m.gruppe_id, m.stimmen DESC, p.kurzname ASC
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
