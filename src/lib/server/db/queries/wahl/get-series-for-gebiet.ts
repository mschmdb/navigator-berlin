import { eq, and, desc, asc, inArray, sql } from 'drizzle-orm';
import { getDb } from '../../index.js';
import { wahl, wahlAggregatKiez, wahlAggregatBezirk, partei } from '../../schema/index.js';

export type GebietEbene = 'kiez' | 'bezirk';

export type GebietSeriesRow = {
	wahlId: number;
	jahr: number;
	parteiKurzname: string;
	farbeHex: string;
	anteil: number;
	stimmen: number;
};

/**
 * Zeitreihe eines Gebiets (Kiez oder Bezirk) über alle Jahre einer
 * Wahl-Reihe (typ × stimmtyp), auf die Top-N Parteien der jüngsten Wahl der
 * Reihe begrenzt. 3-Schritt-Muster wie `get-sparkline-for-kiez.ts` (jüngste
 * Wahl → Top-N → Zeitreihe via `inArray`), auf beide Aggregat-Ebenen
 * angewandt (Code-Map: „Bezirk analog"). Rückgabe roh (inkl. `wahlId`);
 * Wiederholungswahl-Flags + Jahr-Slug-Auflösung passieren in der Route
 * (dort liegt bereits `getWahlList()`, kein zweiter Wahl-Join nötig).
 */
export async function getSeriesForGebiet(
	gebietSlug: string,
	ebene: GebietEbene,
	typ: 'btw' | 'agh' | 'bvv',
	stimmtyp: 'erststimme' | 'zweitstimme' | 'einstimme',
	topN = 8
): Promise<GebietSeriesRow[]> {
	if (!process.env.DATABASE_URL) return [];
	return ebene === 'bezirk'
		? seriesFromBezirk(gebietSlug, typ, stimmtyp, topN)
		: seriesFromKiez(gebietSlug, typ, stimmtyp, topN);
}

async function seriesFromKiez(
	gebietSlug: string,
	typ: 'btw' | 'agh' | 'bvv',
	stimmtyp: 'erststimme' | 'zweitstimme' | 'einstimme',
	topN: number
): Promise<GebietSeriesRow[]> {
	const db = getDb();

	const wahlenInReihe = await db
		.select({ id: wahl.id })
		.from(wahl)
		.where(and(eq(wahl.typ, typ), eq(wahl.stimmtyp, stimmtyp)))
		.orderBy(desc(wahl.jahr));
	if (wahlenInReihe.length === 0) return [];
	const wahlIds = wahlenInReihe.map((w) => w.id);
	const latestWahlId = wahlIds[0];

	const topParteien = await db
		.select({ parteiId: wahlAggregatKiez.parteiId })
		.from(wahlAggregatKiez)
		.where(
			and(eq(wahlAggregatKiez.wahlId, latestWahlId), eq(wahlAggregatKiez.kiezSlug, gebietSlug))
		)
		.orderBy(desc(wahlAggregatKiez.stimmen))
		.limit(topN);
	if (topParteien.length === 0) return [];
	const parteiIds = topParteien.map((r) => r.parteiId);

	return db
		.select({
			wahlId: wahlAggregatKiez.wahlId,
			jahr: wahl.jahr,
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
				eq(wahlAggregatKiez.kiezSlug, gebietSlug),
				inArray(wahlAggregatKiez.wahlId, wahlIds),
				inArray(wahlAggregatKiez.parteiId, parteiIds)
			)
		)
		.orderBy(asc(wahl.jahr), sql`${partei.kurzname} ASC`);
}

async function seriesFromBezirk(
	gebietSlug: string,
	typ: 'btw' | 'agh' | 'bvv',
	stimmtyp: 'erststimme' | 'zweitstimme' | 'einstimme',
	topN: number
): Promise<GebietSeriesRow[]> {
	const db = getDb();

	const wahlenInReihe = await db
		.select({ id: wahl.id })
		.from(wahl)
		.where(and(eq(wahl.typ, typ), eq(wahl.stimmtyp, stimmtyp)))
		.orderBy(desc(wahl.jahr));
	if (wahlenInReihe.length === 0) return [];
	const wahlIds = wahlenInReihe.map((w) => w.id);
	const latestWahlId = wahlIds[0];

	const topParteien = await db
		.select({ parteiId: wahlAggregatBezirk.parteiId })
		.from(wahlAggregatBezirk)
		.where(
			and(
				eq(wahlAggregatBezirk.wahlId, latestWahlId),
				eq(wahlAggregatBezirk.bezirkSlug, gebietSlug)
			)
		)
		.orderBy(desc(wahlAggregatBezirk.stimmen))
		.limit(topN);
	if (topParteien.length === 0) return [];
	const parteiIds = topParteien.map((r) => r.parteiId);

	return db
		.select({
			wahlId: wahlAggregatBezirk.wahlId,
			jahr: wahl.jahr,
			parteiKurzname: partei.kurzname,
			farbeHex: partei.farbeHex,
			anteil: wahlAggregatBezirk.anteil,
			stimmen: wahlAggregatBezirk.stimmen
		})
		.from(wahlAggregatBezirk)
		.innerJoin(wahl, eq(wahl.id, wahlAggregatBezirk.wahlId))
		.innerJoin(partei, eq(partei.id, wahlAggregatBezirk.parteiId))
		.where(
			and(
				eq(wahlAggregatBezirk.bezirkSlug, gebietSlug),
				inArray(wahlAggregatBezirk.wahlId, wahlIds),
				inArray(wahlAggregatBezirk.parteiId, parteiIds)
			)
		)
		.orderBy(asc(wahl.jahr), sql`${partei.kurzname} ASC`);
}
