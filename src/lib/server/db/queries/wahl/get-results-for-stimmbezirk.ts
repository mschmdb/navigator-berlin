import { eq, and, desc } from 'drizzle-orm';
import { getDb } from '../../index.js';
import { ergebnis, partei } from '../../schema/index.js';

export type StimmbezirkResult = {
	parteiKurzname: string;
	parteiVollname: string;
	farbeHex: string;
	stimmen: number;
	anteil: number;
	istBriefwahlAggregat: boolean;
};

export async function getResultsForStimmbezirk(
	wahlId: number,
	uwbId: string,
	limit = 5
): Promise<StimmbezirkResult[]> {
	if (!process.env.DATABASE_URL) return [];
	const rows = await getDb()
		.select({
			parteiKurzname: partei.kurzname,
			parteiVollname: partei.vollname,
			farbeHex: partei.farbeHex,
			stimmen: ergebnis.stimmen,
			anteil: ergebnis.anteil,
			istBriefwahlAggregat: ergebnis.istBriefwahlAggregat
		})
		.from(ergebnis)
		.innerJoin(partei, eq(partei.id, ergebnis.parteiId))
		.where(and(eq(ergebnis.wahlId, wahlId), eq(ergebnis.uwbId, uwbId)))
		.orderBy(desc(ergebnis.stimmen))
		.limit(limit);
	return rows;
}
