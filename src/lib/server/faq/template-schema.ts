import * as v from 'valibot';

/**
 * Story 2.5b AC-1: Valibot-Schema für FAQ-Template-YAML-Dateien.
 *
 * Pfad-Konvention: `src/lib/data/faq-templates/{cluster}/{cluster}.{locale}.yaml`
 *
 * Phase-1-DE-only (Memory `project_i18n_phase_1_de_only`): Schema akzeptiert
 * `de` + `en`-Enum, aber Repo enthält in Phase 1 nur `de`-Files. EN-Files
 * werden in Future-Epic „i18n-Phase-3-EN-Coverage" nachgezogen.
 *
 * Phase-1-Cluster-Lock (5 Cluster, User-Lock 2026-05-16): laerm, gruen,
 * oepnv, wohnen, klima. Andere 4 (luft, bildung, heritage, score) bleiben
 * Phase-2-Backlog (vgl. Story-File Open-Question 1).
 */

export const CLUSTER_KEYS = ['laerm', 'gruen', 'oepnv', 'wohnen', 'klima'] as const;
export type ClusterKey = (typeof CLUSTER_KEYS)[number];

export const PAGE_TYPES = ['bezirk', 'kiez', 'layer'] as const;
export type PageType = (typeof PAGE_TYPES)[number];

export const TEMPLATE_LOCALES = ['de', 'en'] as const;
export type TemplateLocale = (typeof TEMPLATE_LOCALES)[number];

/**
 * Single Q-Template. `requires`-Felder sind Dot-Pfade in den Aggregat-JSONB
 * (z.B. `laerm.dominantCategory`, `gruen.gruenanlagenCount`). Rendering schlägt
 * `null` zurück wenn ein `requires`-Pfad keinen `AggregateValue`-Wert hat (siehe
 * `template-renderer.ts`).
 */
export const FaqTemplateSchema = v.object({
	id: v.pipe(v.string(), v.minLength(3)),
	applicableTo: v.array(v.picklist(PAGE_TYPES)),
	requires: v.array(v.string()),
	question: v.pipe(v.string(), v.minLength(5)),
	answer: v.pipe(v.string(), v.minLength(5)),
	editorialNote: v.optional(v.string())
});
export type FaqTemplate = v.InferOutput<typeof FaqTemplateSchema>;

export const FaqTemplateFileSchema = v.object({
	cluster: v.picklist(CLUSTER_KEYS),
	locale: v.picklist(TEMPLATE_LOCALES),
	templates: v.array(FaqTemplateSchema)
});
export type FaqTemplateFile = v.InferOutput<typeof FaqTemplateFileSchema>;

/**
 * Parsed + validiert ein YAML-Parser-Output zu einem `FaqTemplateFile`.
 * Wirft `ValiError` bei Schema-Verstoß.
 */
export function parseFaqTemplateFile(input: unknown): FaqTemplateFile {
	return v.parse(FaqTemplateFileSchema, input);
}
