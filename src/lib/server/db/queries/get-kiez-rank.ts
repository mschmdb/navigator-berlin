import { eq } from 'drizzle-orm';
import type { InferSelectModel } from 'drizzle-orm';
import { getDb } from '../index.js';
import { kiezRank } from '../schema/index.js';

export type KiezRankRow = InferSelectModel<typeof kiezRank>;

/** Rang/Quartil pro Metrik (metricKey → row) für einen Kiez-Slug. Story 11.0. */
export async function getKiezRank(slug: string): Promise<Map<string, KiezRankRow>> {
	const rows = await getDb().select().from(kiezRank).where(eq(kiezRank.slug, slug));
	return new Map(rows.map((r) => [r.metricKey, r]));
}
