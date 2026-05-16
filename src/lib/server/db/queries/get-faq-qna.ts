import { and, eq } from 'drizzle-orm';
import type { InferSelectModel } from 'drizzle-orm';
import { getDb } from '../index.js';
import { faqQna } from '../schema/index.js';

export type FaqEntry = InferSelectModel<typeof faqQna>;
export type PageType = 'bezirk' | 'kiez' | 'layer';
export type Locale = 'de' | 'en';

export interface GetFaqQnaInput {
	pageType: PageType;
	slug: string;
	locale: Locale;
}

/**
 * Liefert FAQ-Q&A-Einträge für (pageType, slug, locale).
 * Leeres Array solange Story 2.5b die Tabelle noch nicht befüllt.
 */
export async function getFaqQna(input: GetFaqQnaInput): Promise<FaqEntry[]> {
	return await getDb()
		.select()
		.from(faqQna)
		.where(
			and(
				eq(faqQna.pageType, input.pageType),
				eq(faqQna.slug, input.slug),
				eq(faqQna.locale, input.locale)
			)
		);
}
