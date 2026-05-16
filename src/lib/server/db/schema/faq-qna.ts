import { pgTable, text, timestamp, primaryKey, pgEnum } from 'drizzle-orm/pg-core';

/**
 * Page-Type-Enum für FAQ-Section-Template (Story 2.5b).
 */
export const pageTypeEnum = pgEnum('page_type', ['bezirk', 'kiez', 'layer']);

/**
 * Locale-Enum (Phase-1-Lock: de+en). Future i18n-Expansion → Migration.
 */
export const localeEnum = pgEnum('locale', ['de', 'en']);

/**
 * FAQ-Q&A pro (page_type, slug, cluster, locale). Schema-only in Story 2.0;
 * Befüllung in Story 2.5b (scripts/render-faq.ts mit Daten-Slot-Template).
 */
export const faqQna = pgTable(
	'faq_qna',
	{
		pageType: pageTypeEnum('page_type').notNull(),
		slug: text('slug').notNull(),
		cluster: text('cluster').notNull(),
		locale: localeEnum('locale').notNull(),
		question: text('question').notNull(),
		answer: text('answer').notNull(),
		computedAt: timestamp('computed_at', { withTimezone: true }).notNull().defaultNow()
	},
	(t) => [primaryKey({ columns: [t.pageType, t.slug, t.cluster, t.locale] })]
);
