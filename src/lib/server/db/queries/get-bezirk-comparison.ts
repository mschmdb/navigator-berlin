import { eq } from 'drizzle-orm';
import type { InferSelectModel } from 'drizzle-orm';
import { getDb } from '../index.js';
import { bezirkComparison } from '../schema/index.js';

export type BezirkComparisonRow = InferSelectModel<typeof bezirkComparison>;

/** Vergleichswerte pro Metrik (metricKey → row) für einen Bezirk-Slug. Story 11.4. */
export async function getBezirkComparison(slug: string): Promise<Map<string, BezirkComparisonRow>> {
	const rows = await getDb().select().from(bezirkComparison).where(eq(bezirkComparison.slug, slug));
	return new Map(rows.map((r) => [r.metricKey, r]));
}
