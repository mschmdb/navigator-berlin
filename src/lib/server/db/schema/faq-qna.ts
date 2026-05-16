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
 * FAQ-Q&A pro (page_type, slug, cluster, locale, template_id).
 *
 * Story 2.0 hatte PK ohne `template_id` und ließ damit nur 1 Q&A pro
 * (page, slug, cluster, locale) zu — Story-2.5b-Design verlangt aber 5-10
 * Templates pro Cluster und Page-Type. PK auf 5 Spalten erweitert
 * 2026-05-16 (Browser-Verify-Session); render-faq.ts liefert template.id
 * deterministisch aus den YAML-Files.
 */
export const faqQna = pgTable(
	'faq_qna',
	{
		pageType: pageTypeEnum('page_type').notNull(),
		slug: text('slug').notNull(),
		cluster: text('cluster').notNull(),
		locale: localeEnum('locale').notNull(),
		templateId: text('template_id').notNull(),
		question: text('question').notNull(),
		answer: text('answer').notNull(),
		computedAt: timestamp('computed_at', { withTimezone: true }).notNull().defaultNow()
	},
	(t) => [primaryKey({ columns: [t.pageType, t.slug, t.cluster, t.locale, t.templateId] })]
);
