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
		)
		.orderBy(faqQna.sortOrder, faqQna.cluster, faqQna.templateId);
}

export interface FaqForPage {
	readonly items: readonly { readonly question: string; readonly answer: string }[];
	/** Sprache der gelieferten Einträge. Weicht von der Seiten-Locale ab, wenn auf DE zurückgefallen wird. */
	readonly locale: Locale;
}

const BASE_LOCALE: Locale = 'de';

/**
 * FAQ für eine Seite in der Seiten-Locale. Fehlen Zeilen für diese Locale,
 * fällt die Funktion auf DE zurück (`locale` im Ergebnis zeigt das an).
 * Ohne `DATABASE_URL` oder bei DB-Fehler: leere Liste, WARN auf stderr.
 */
export async function getFaqForPage(
	input: GetFaqQnaInput,
	fetchRows: (input: GetFaqQnaInput) => Promise<readonly FaqEntry[]> = getFaqQna
): Promise<FaqForPage> {
	if (!process.env.DATABASE_URL) return { items: [], locale: input.locale };
	try {
		let locale = input.locale;
		let rows = await fetchRows(input);
		if (rows.length === 0 && input.locale !== BASE_LOCALE) {
			locale = BASE_LOCALE;
			rows = await fetchRows({ ...input, locale });
		}
		return {
			items: rows.map((r) => ({ question: r.question, answer: r.answer })),
			locale
		};
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		process.stderr.write(`[${input.pageType}-page] WARN: faq_qna unavailable (${msg})\n`);
		return { items: [], locale: input.locale };
	}
}
