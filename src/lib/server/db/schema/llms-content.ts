import { pgTable, text, timestamp, primaryKey } from 'drizzle-orm/pg-core';
import { pageTypeEnum, localeEnum } from './faq-qna.js';

/**
 * Markdown-Content-Cache pro (page_type, slug, locale). Schema-only in Story 2.0;
 * Befüllung in Story 2.8 (/llms-full.txt + /llms.txt Endpoints).
 */
export const llmsContent = pgTable(
	'llms_content',
	{
		pageType: pageTypeEnum('page_type').notNull(),
		slug: text('slug').notNull(),
		locale: localeEnum('locale').notNull(),
		markdown: text('markdown').notNull(),
		computedAt: timestamp('computed_at', { withTimezone: true }).notNull().defaultNow()
	},
	(t) => [primaryKey({ columns: [t.pageType, t.slug, t.locale] })]
);
