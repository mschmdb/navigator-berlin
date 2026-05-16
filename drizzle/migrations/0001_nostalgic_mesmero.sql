-- Story 2.5b PK-Fix 2026-05-16: erweitert faq_qna-Primary-Key um template_id
-- damit mehrere Q&A-Templates pro (page, slug, cluster, locale) koexistieren.
-- Tabelle wird vor jedem render-faq.ts-Run via TRUNCATE neu befüllt, deshalb
-- ist Daten-Verlust an dieser Migration ungefährlich.
TRUNCATE TABLE "faq_qna";--> statement-breakpoint
ALTER TABLE "faq_qna" DROP CONSTRAINT "faq_qna_page_type_slug_cluster_locale_pk";--> statement-breakpoint
ALTER TABLE "faq_qna" ADD COLUMN "template_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "faq_qna" ADD CONSTRAINT "faq_qna_page_type_slug_cluster_locale_template_id_pk" PRIMARY KEY("page_type","slug","cluster","locale","template_id");
