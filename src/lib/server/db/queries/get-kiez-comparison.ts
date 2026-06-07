import { eq } from 'drizzle-orm';
import type { InferSelectModel } from 'drizzle-orm';
import { getDb } from '../index.js';
import { kiezComparison } from '../schema/index.js';

export type KiezComparisonRow = InferSelectModel<typeof kiezComparison>;

/** Vergleichswerte pro Metrik (metricKey → row) für einen Kiez-Slug. Story 11.4. */
export async function getKiezComparison(slug: string): Promise<Map<string, KiezComparisonRow>> {
	const rows = await getDb().select().from(kiezComparison).where(eq(kiezComparison.slug, slug));
	return new Map(rows.map((r) => [r.metricKey, r]));
}
