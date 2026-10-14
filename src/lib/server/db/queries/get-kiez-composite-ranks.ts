import { eq } from 'drizzle-orm';
import { getDb } from '../index.js';
import { kiezRank } from '../schema/index.js';

export interface KiezCompositeRank {
	readonly rang: number | null;
	readonly quartil: number | null;
	readonly total: number;
}

/** Berlin-weiter Composite-Rang aller Kieze (slug → Rang/Quartil/Total), für Bezirks-Listen. */
export async function getKiezCompositeRanks(): Promise<Map<string, KiezCompositeRank>> {
	const rows = await getDb()
		.select({
			slug: kiezRank.slug,
			rang: kiezRank.rang,
			quartil: kiezRank.quartil,
			total: kiezRank.total
		})
		.from(kiezRank)
		.where(eq(kiezRank.metricKey, 'composite'));
	return new Map(
		rows.map((r) => [r.slug, { rang: r.rang, quartil: r.quartil, total: r.total }] as const)
	);
}
