import { eq } from 'drizzle-orm';
import type { InferSelectModel } from 'drizzle-orm';
import { getDb } from '../index.js';
import { bezirkStats } from '../schema/index.js';

export type BezirkStats = InferSelectModel<typeof bezirkStats>;

/**
 * Liefert das Bezirks-Aggregat für einen Slug oder `null` wenn nicht vorhanden.
 * Konsumiert von Story 2.3 (Bezirks-Page-Loader).
 */
export async function getBezirkStats(slug: string): Promise<BezirkStats | null> {
	const rows = await getDb().select().from(bezirkStats).where(eq(bezirkStats.slug, slug)).limit(1);
	return rows[0] ?? null;
}
