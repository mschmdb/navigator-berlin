import { sql } from 'drizzle-orm';
import { getDb } from '../../index.js';

export type StimmbezirkWinner = {
	uwbId: string;
	parteiKurzname: string;
	parteiVollname: string;
	farbeHex: string;
	stimmen: number;
	anteil: number;
	istBriefwahlAggregat: boolean;
};

/**
 * Liefert pro Stimmbezirk die stärkste Partei für eine Wahl.
 *
 * Performance-Hinweis: bei BTW25 ~3.598 Berliner Stimmbezirke + Brief-Wahlbezirke
 * (insgesamt bis ~7k DB-Rows pro Wahl). `DISTINCT ON (uwb_id)` ist Postgres-spezifisch
 * und liefert pro UWB die Row mit höchstem `stimmen`-Wert via `ORDER BY uwb_id, stimmen DESC`.
 */
export async function getStimmbezirksWinners(wahlId: number): Promise<StimmbezirkWinner[]> {
	if (!process.env.DATABASE_URL) return [];
	const rows = await getDb().execute<{
		uwb_id: string;
		kurzname: string;
		vollname: string;
		farbe_hex: string;
		stimmen: number;
		anteil: number;
		ist_briefwahl_aggregat: boolean;
	}>(sql`
		SELECT DISTINCT ON (e.uwb_id)
			e.uwb_id,
			p.kurzname,
			p.vollname,
			p.farbe_hex,
			e.stimmen,
			e.anteil,
			e.ist_briefwahl_aggregat
		FROM ergebnis e
		JOIN partei p ON p.id = e.partei_id
		WHERE e.wahl_id = ${wahlId}
		ORDER BY e.uwb_id, e.stimmen DESC
	`);
	return rows.map((r) => ({
		uwbId: r.uwb_id,
		parteiKurzname: r.kurzname,
		parteiVollname: r.vollname,
		farbeHex: r.farbe_hex,
		stimmen: r.stimmen,
		anteil: r.anteil,
		istBriefwahlAggregat: r.ist_briefwahl_aggregat
	}));
}
