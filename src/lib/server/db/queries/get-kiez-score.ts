import { eq } from 'drizzle-orm';
import type { InferSelectModel } from 'drizzle-orm';
import { getDb } from '../index.js';
import { kiezScore } from '../schema/index.js';

export type KiezScore = InferSelectModel<typeof kiezScore>;

/**
 * Liefert den Kiez-Score (LOR-Bezirksregion) für einen Slug.
 * Null-Fallback solange Story 2.9a die Tabelle noch nicht befüllt — kein Error.
 */
export async function getKiezScore(slug: string): Promise<KiezScore | null> {
	const rows = await getDb().select().from(kiezScore).where(eq(kiezScore.slug, slug)).limit(1);
	return rows[0] ?? null;
}
