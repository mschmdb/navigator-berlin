import { eq, desc } from 'drizzle-orm';
import { getDb } from '../../index.js';
import { wahlAggregatBerlin, partei } from '../../schema/index.js';

export type BerlinResult = {
	parteiKurzname: string;
	parteiVollname: string;
	farbeHex: string;
	stimmen: number;
	anteil: number;
};

export async function getResultsForBerlin(wahlId: number, limit = 5): Promise<BerlinResult[]> {
	if (!process.env.DATABASE_URL) return [];
	const rows = await getDb()
		.select({
			parteiKurzname: partei.kurzname,
			parteiVollname: partei.vollname,
			farbeHex: partei.farbeHex,
			stimmen: wahlAggregatBerlin.stimmen,
			anteil: wahlAggregatBerlin.anteil
		})
		.from(wahlAggregatBerlin)
		.innerJoin(partei, eq(partei.id, wahlAggregatBerlin.parteiId))
		.where(eq(wahlAggregatBerlin.wahlId, wahlId))
		.orderBy(desc(wahlAggregatBerlin.stimmen))
		.limit(limit);
	return rows;
}
