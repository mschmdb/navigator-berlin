import { eq, and, desc } from 'drizzle-orm';
import { getDb } from '../../index.js';
import { wahlAggregatKiez, partei } from '../../schema/index.js';

export type KiezResult = {
	parteiKurzname: string;
	parteiVollname: string;
	farbeHex: string;
	stimmen: number;
	anteil: number;
};

export async function getResultsForKiez(
	wahlId: number,
	kiezSlug: string,
	limit = 5
): Promise<KiezResult[]> {
	if (!process.env.DATABASE_URL) return [];
	const rows = await getDb()
		.select({
			parteiKurzname: partei.kurzname,
			parteiVollname: partei.vollname,
			farbeHex: partei.farbeHex,
			stimmen: wahlAggregatKiez.stimmen,
			anteil: wahlAggregatKiez.anteil
		})
		.from(wahlAggregatKiez)
		.innerJoin(partei, eq(partei.id, wahlAggregatKiez.parteiId))
		.where(and(eq(wahlAggregatKiez.wahlId, wahlId), eq(wahlAggregatKiez.kiezSlug, kiezSlug)))
		.orderBy(desc(wahlAggregatKiez.stimmen))
		.limit(limit);
	return rows;
}
