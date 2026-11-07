import {
	eq,
	and,
	desc,
	asc,
	inArray,
	gte,
	ne,
	or,
	sql,
	type SQL,
	type AnyColumn
} from 'drizzle-orm';
import { getDb } from '../../index.js';
import {
	wahl,
	wahlAggregatKiez,
	wahlAggregatBezirk,
	wahlAggregatBerlin,
	partei
} from '../../schema/index.js';

export type GebietEbene = 'kiez' | 'bezirk' | 'berlin';

export type GebietSeriesRow = {
	wahlId: number;
	jahr: number;
	parteiKurzname: string;
	farbeHex: string;
	anteil: number;
	stimmen: number;
};

export const MIN_ANTEIL_HISTORISCH = 0.05;

/**
 * Partei-Filter der Zeitreihe: Top-N der jüngsten Wahl in allen Jahren,
 * historisch starke Parteien nur in den älteren Wahlen.
 */
function parteiFilter(
	parteiIdColumn: AnyColumn,
	wahlIdColumn: AnyColumn,
	topIds: readonly number[],
	historischIds: readonly number[],
	latestWahlId: number
): SQL | undefined {
	const zusatzIds = historischIds.filter((id) => !topIds.includes(id));
	const top = inArray(parteiIdColumn, [...topIds]);
	if (zusatzIds.length === 0) return top;
	return or(top, and(inArray(parteiIdColumn, zusatzIds), ne(wahlIdColumn, latestWahlId)));
}

/**
 * Zeitreihe eines Gebiets (Kiez, Bezirk oder Berlin gesamt) über alle Jahre
 * einer Wahl-Reihe (typ × stimmtyp), auf die Top-N Parteien der jüngsten
 * Wahl der Reihe begrenzt. 3-Schritt-Muster wie `get-sparkline-for-kiez.ts`
 * (jüngste Wahl → Top-N → Zeitreihe via `inArray`), auf alle drei
 * Aggregat-Ebenen angewandt (Code-Map: „Bezirk analog"). Rückgabe roh (inkl.
 * `wahlId`); Wiederholungswahl-Flags + Jahr-Slug-Auflösung passieren in der
 * Route (dort liegt bereits `getWahlList()`, kein zweiter Wahl-Join nötig).
 *
 * Story 6: `ebene: 'berlin'` ignoriert `gebietSlug` (kein Slug-Filter,
 * `wahl_aggregat_berlin` führt genau eine Row pro Wahl × Partei).
 *
 * #179: Zusätzlich zu den Top-N der jüngsten Wahl kommt jede Partei dazu, die
 * in irgendeiner Wahl der Reihe im Gebiet mindestens `MIN_ANTEIL_HISTORISCH`
 * erreicht hat (PIRATEN 2011: 8,9 % Berlin). Für die jüngste Wahl bleiben es
 * genau die Top-N: Zusatz-Parteien liefern dort keine Row, das Panel der
 * jüngsten Wahl ändert sich nicht.
 */
export async function getSeriesForGebiet(
	gebietSlug: string | null,
	ebene: GebietEbene,
	typ: 'btw' | 'agh' | 'bvv',
	stimmtyp: 'erststimme' | 'zweitstimme' | 'einstimme',
	topN = 8
): Promise<GebietSeriesRow[]> {
	if (!process.env.DATABASE_URL) return [];
	if (ebene === 'berlin') return seriesFromBerlin(typ, stimmtyp, topN);
	return ebene === 'bezirk'
		? seriesFromBezirk(gebietSlug ?? '', typ, stimmtyp, topN)
		: seriesFromKiez(gebietSlug ?? '', typ, stimmtyp, topN);
}

async function seriesFromBerlin(
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
		.select({ parteiId: wahlAggregatBerlin.parteiId })
		.from(wahlAggregatBerlin)
		.where(eq(wahlAggregatBerlin.wahlId, latestWahlId))
		.orderBy(desc(wahlAggregatBerlin.stimmen))
		.limit(topN);
	if (topParteien.length === 0) return [];
	const topIds = topParteien.map((r) => r.parteiId);

	const historischParteien = await db
		.selectDistinct({ parteiId: wahlAggregatBerlin.parteiId })
		.from(wahlAggregatBerlin)
		.where(
			and(
				inArray(wahlAggregatBerlin.wahlId, wahlIds),
				gte(wahlAggregatBerlin.anteil, MIN_ANTEIL_HISTORISCH)
			)
		);
	const historischIds = historischParteien.map((r) => r.parteiId);

	return db
		.select({
			wahlId: wahlAggregatBerlin.wahlId,
			jahr: wahl.jahr,
			parteiKurzname: partei.kurzname,
			farbeHex: partei.farbeHex,
			anteil: wahlAggregatBerlin.anteil,
			stimmen: wahlAggregatBerlin.stimmen
		})
		.from(wahlAggregatBerlin)
		.innerJoin(wahl, eq(wahl.id, wahlAggregatBerlin.wahlId))
		.innerJoin(partei, eq(partei.id, wahlAggregatBerlin.parteiId))
		.where(
			and(
				inArray(wahlAggregatBerlin.wahlId, wahlIds),
				parteiFilter(
					wahlAggregatBerlin.parteiId,
					wahlAggregatBerlin.wahlId,
					topIds,
					historischIds,
					latestWahlId
				)
			)
		)
		.orderBy(asc(wahl.jahr), sql`${partei.kurzname} ASC`);
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
	const topIds = topParteien.map((r) => r.parteiId);

	const historischParteien = await db
		.selectDistinct({ parteiId: wahlAggregatKiez.parteiId })
		.from(wahlAggregatKiez)
		.where(
			and(
				eq(wahlAggregatKiez.kiezSlug, gebietSlug),
				inArray(wahlAggregatKiez.wahlId, wahlIds),
				gte(wahlAggregatKiez.anteil, MIN_ANTEIL_HISTORISCH)
			)
		);
	const historischIds = historischParteien.map((r) => r.parteiId);

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
				parteiFilter(
					wahlAggregatKiez.parteiId,
					wahlAggregatKiez.wahlId,
					topIds,
					historischIds,
					latestWahlId
				)
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
	const topIds = topParteien.map((r) => r.parteiId);

	const historischParteien = await db
		.selectDistinct({ parteiId: wahlAggregatBezirk.parteiId })
		.from(wahlAggregatBezirk)
		.where(
			and(
				eq(wahlAggregatBezirk.bezirkSlug, gebietSlug),
				inArray(wahlAggregatBezirk.wahlId, wahlIds),
				gte(wahlAggregatBezirk.anteil, MIN_ANTEIL_HISTORISCH)
			)
		);
	const historischIds = historischParteien.map((r) => r.parteiId);

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
				parteiFilter(
					wahlAggregatBezirk.parteiId,
					wahlAggregatBezirk.wahlId,
					topIds,
					historischIds,
					latestWahlId
				)
			)
		)
		.orderBy(asc(wahl.jahr), sql`${partei.kurzname} ASC`);
}
