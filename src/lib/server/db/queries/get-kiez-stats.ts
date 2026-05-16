import { eq } from 'drizzle-orm';
import type { InferSelectModel } from 'drizzle-orm';
import { getDb } from '../index.js';
import { kiezStats } from '../schema/index.js';

export type KiezStats = InferSelectModel<typeof kiezStats>;

/**
 * Liefert das Kiez-Aggregat (LOR-Bezirksregion) für einen Slug oder `null`.
 * Konsumiert von Story 2.4 (Kiez-Page-Loader).
 */
export async function getKiezStats(slug: string): Promise<KiezStats | null> {
	const rows = await getDb().select().from(kiezStats).where(eq(kiezStats.slug, slug)).limit(1);
	return rows[0] ?? null;
}
