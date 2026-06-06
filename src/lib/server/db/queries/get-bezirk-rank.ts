import { eq } from 'drizzle-orm';
import type { InferSelectModel } from 'drizzle-orm';
import { getDb } from '../index.js';
import { bezirkRank } from '../schema/index.js';

export type BezirkRankRow = InferSelectModel<typeof bezirkRank>;

/** Rang/Quartil pro Metrik (metricKey → row) für einen Bezirk-Slug. Story 11.0. */
export async function getBezirkRank(slug: string): Promise<Map<string, BezirkRankRow>> {
	const rows = await getDb().select().from(bezirkRank).where(eq(bezirkRank.slug, slug));
	return new Map(rows.map((r) => [r.metricKey, r]));
}
