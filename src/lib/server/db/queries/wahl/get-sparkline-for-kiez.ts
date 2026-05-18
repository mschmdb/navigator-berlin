import { eq, and, desc, asc, inArray, sql } from 'drizzle-orm';
import { getDb } from '../../index.js';
import { wahl, wahlAggregatKiez, partei } from '../../schema/index.js';

export type SparklinePoint = {
	jahr: number;
	stimmtyp: 'erststimme' | 'zweitstimme' | 'einstimme';
	parteiKurzname: string;
	farbeHex: string;
	anteil: number;
	stimmen: number;
};

export async function getSparklineForKiez(
	kiezSlug: string,
	typ: 'btw' | 'agh' | 'bvv',
	stimmtyp: 'erststimme' | 'zweitstimme' | 'einstimme' = 'zweitstimme',
	topN = 5
): Promise<SparklinePoint[]> {
	if (!process.env.DATABASE_URL) return [];
	const db = getDb();

	const latestWahl = await db
		.select({ id: wahl.id })
		.from(wahl)
		.where(and(eq(wahl.typ, typ), eq(wahl.stimmtyp, stimmtyp)))
		.orderBy(desc(wahl.jahr))
		.limit(1);

	if (latestWahl.length === 0) return [];

	const topParteien = await db
		.select({ parteiId: wahlAggregatKiez.parteiId })
		.from(wahlAggregatKiez)
		.where(
			and(eq(wahlAggregatKiez.wahlId, latestWahl[0].id), eq(wahlAggregatKiez.kiezSlug, kiezSlug))
		)
		.orderBy(desc(wahlAggregatKiez.stimmen))
		.limit(topN);

	if (topParteien.length === 0) return [];

	const parteiIds = topParteien.map((r) => r.parteiId);

	const rows = await db
		.select({
			jahr: wahl.jahr,
			stimmtyp: wahl.stimmtyp,
			parteiKurzname: partei.kurzname,
			farbeHex: partei.farbeHex,
			anteil: wahlAggregatKiez.anteil,
			stimmen: wahlAggregatKiez.stimmen
		})
		.from(wahlAggregatKiez)
		.innerJoin(wahl, eq(wahl.id, wahlAggregatKiez.wahlId))
		.innerJoin(partei, eq(partei.id, wahlAggregatKiez.parteiId))
		.where(
			and(
				eq(wahlAggregatKiez.kiezSlug, kiezSlug),
				eq(wahl.typ, typ),
				eq(wahl.stimmtyp, stimmtyp),
				inArray(wahlAggregatKiez.parteiId, parteiIds)
			)
		)
		.orderBy(asc(wahl.jahr), sql`${partei.kurzname} ASC`);

	return rows;
}
