import { eq, and, desc } from 'drizzle-orm';
import { getDb } from '../../index.js';
import { wahlAggregatBezirk, partei } from '../../schema/index.js';

export type BezirkResult = {
	parteiKurzname: string;
	parteiVollname: string;
	farbeHex: string;
	stimmen: number;
	anteil: number;
};

export async function getResultsForBezirk(
	wahlId: number,
	bezirkSlug: string,
	limit = 5
): Promise<BezirkResult[]> {
	if (!process.env.DATABASE_URL) return [];
	const rows = await getDb()
		.select({
			parteiKurzname: partei.kurzname,
			parteiVollname: partei.vollname,
			farbeHex: partei.farbeHex,
			stimmen: wahlAggregatBezirk.stimmen,
			anteil: wahlAggregatBezirk.anteil
		})
		.from(wahlAggregatBezirk)
		.innerJoin(partei, eq(partei.id, wahlAggregatBezirk.parteiId))
		.where(
			and(eq(wahlAggregatBezirk.wahlId, wahlId), eq(wahlAggregatBezirk.bezirkSlug, bezirkSlug))
		)
		.orderBy(desc(wahlAggregatBezirk.stimmen))
		.limit(limit);
	return rows;
}
