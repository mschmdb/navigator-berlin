import { CHAPTERS } from './topics';

export interface FaqRow {
	readonly question: string;
	readonly answer: string;
	readonly chapter: { readonly id: string; readonly title: string } | null;
}

/** FAQ einer Seite mit Cluster, sortiert in der Reihenfolge der Kapitel. Leer ohne DB. */
export async function loadFaqByChapter(
	pageType: 'kiez' | 'bezirk',
	slug: string
): Promise<FaqRow[]> {
	if (!process.env.DATABASE_URL) return [];
	const { getDb } = await import('$lib/server/db/index.js');
	const { faqQna } = await import('$lib/server/db/schema/index.js');
	const { and, eq } = await import('drizzle-orm');
	const rows = await getDb()
		.select({
			question: faqQna.question,
			answer: faqQna.answer,
			cluster: faqQna.cluster,
			sortOrder: faqQna.sortOrder
		})
		.from(faqQna)
		.where(and(eq(faqQna.pageType, pageType), eq(faqQna.slug, slug), eq(faqQna.locale, 'de')));
	const chapterOf = (cluster: string) => CHAPTERS.find((c) => c.faq?.includes(cluster)) ?? null;
	const rank = (cluster: string) => {
		const c = chapterOf(cluster);
		return c ? CHAPTERS.indexOf(c) : CHAPTERS.length;
	};
	return rows
		.sort((a, b) => rank(a.cluster) - rank(b.cluster) || a.sortOrder - b.sortOrder)
		.map((r) => {
			const c = chapterOf(r.cluster);
			return {
				question: r.question,
				answer: r.answer,
				chapter: c ? { id: c.id, title: c.title } : null
			};
		});
}
