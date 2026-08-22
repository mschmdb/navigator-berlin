import { eq } from 'drizzle-orm';
import { getDb } from '../../index.js';
import { partei, wahlAggregatKiez } from '../../schema/index.js';

export type KiezShareDbRow = {
	kiezSlug: string;
	parteiKurzname: string;
	anteil: number;
};

/**
 * Alle Kiez-Aggregate einer Wahl (143 Bezirksregionen × Parteien) in einem
 * Rutsch, für den Kiez-Finder (Partei-Ähnlichkeits-Metrik als Bulk).
 */
export async function getKiezSharesForWahl(wahlId: number): Promise<KiezShareDbRow[]> {
	if (!process.env.DATABASE_URL) return [];
	return getDb()
		.select({
			kiezSlug: wahlAggregatKiez.kiezSlug,
			parteiKurzname: partei.kurzname,
			anteil: wahlAggregatKiez.anteil
		})
		.from(wahlAggregatKiez)
		.innerJoin(partei, eq(partei.id, wahlAggregatKiez.parteiId))
		.where(eq(wahlAggregatKiez.wahlId, wahlId));
}
