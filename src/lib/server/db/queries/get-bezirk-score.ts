import { eq } from 'drizzle-orm';
import type { InferSelectModel } from 'drizzle-orm';
import { getDb } from '../index.js';
import { bezirkScore } from '../schema/index.js';

export type BezirkScore = InferSelectModel<typeof bezirkScore>;

/**
 * Liefert den Bezirks-Score für einen Slug.
 * Null-Fallback solange Story 2.9a die Tabelle noch nicht befüllt — kein Error.
 */
export async function getBezirkScore(slug: string): Promise<BezirkScore | null> {
	const rows = await getDb().select().from(bezirkScore).where(eq(bezirkScore.slug, slug)).limit(1);
	return rows[0] ?? null;
}
