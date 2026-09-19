import { eq, and } from 'drizzle-orm';
import { getDb } from '../../index.js';
import { wahlAnalytikKiez, wahlTrendKiez, partei } from '../../schema/index.js';

export type AnalytikKiezRow = {
	kiezSlug: string;
	wechselCount: number;
	wechselJahre: number[];
	volatilitaet: number;
};

export type TrendKiezRow = {
	kiezSlug: string;
	parteiKurzname: string;
	slope: number;
};

/** Wechsel + Volatilität pro Kiez für eine Wahl-Reihe (Build-Zeit-Aggregat, ADR-013). */
export async function getAnalytikForReihe(
	typ: 'btw' | 'agh' | 'bvv',
	stimmtyp: 'erststimme' | 'zweitstimme' | 'einstimme'
): Promise<AnalytikKiezRow[]> {
	if (!process.env.DATABASE_URL) return [];
	return getDb()
		.select({
			kiezSlug: wahlAnalytikKiez.kiezSlug,
			wechselCount: wahlAnalytikKiez.wechselCount,
			wechselJahre: wahlAnalytikKiez.wechselJahre,
			volatilitaet: wahlAnalytikKiez.volatilitaet
		})
		.from(wahlAnalytikKiez)
		.where(and(eq(wahlAnalytikKiez.typ, typ), eq(wahlAnalytikKiez.stimmtyp, stimmtyp)));
}

/** Partei-Trends (Steigung) pro Kiez für eine Wahl-Reihe (Build-Zeit-Aggregat, ADR-013). */
export async function getTrendForReihe(
	typ: 'btw' | 'agh' | 'bvv',
	stimmtyp: 'erststimme' | 'zweitstimme' | 'einstimme'
): Promise<TrendKiezRow[]> {
	if (!process.env.DATABASE_URL) return [];
	return getDb()
		.select({
			kiezSlug: wahlTrendKiez.kiezSlug,
			parteiKurzname: partei.kurzname,
			slope: wahlTrendKiez.slope
		})
		.from(wahlTrendKiez)
		.innerJoin(partei, eq(partei.id, wahlTrendKiez.parteiId))
		.where(and(eq(wahlTrendKiez.typ, typ), eq(wahlTrendKiez.stimmtyp, stimmtyp)));
}
