/**
 * Cross-Layer-Template-Schema (Story 6.7).
 *
 * Templates verknüpfen Wahl-Daten mit anderen Layern (Wohnlage, Lärm,
 * Mietspiegel, Kiez-Score, Klima, Versorgung) zu deterministischen
 * Beobachtungs-Texten ohne wertendes Framing.
 *
 * Stigma-Gates (Memory feedback_no_lebenswert + project_compare_editorial_profiles):
 * - Keine Wertungs-Vokabel (Hochburg, Wahlsieger, dominiert, lebenswert).
 * - Keine Vergleichs-Pfeile/-Farben in den Strings.
 * - Editorial-Disclaimer + Quellen-Attribution Pflicht beim Rendern.
 *
 * Co-Design-Gate vor Roll-out: jedes neue Template braucht Review per
 * docs/cross-layer-templates-style-guide.md.
 */

import * as v from 'valibot';

export const TemplateScopeSchema = v.picklist(['bezirk', 'kiez']);
export type TemplateScope = v.InferOutput<typeof TemplateScopeSchema>;

export const TemplateRequiresSchema = v.pipe(v.array(v.string()), v.minLength(1));

export const TemplateSchema = v.object({
	id: v.pipe(v.string(), v.regex(/^[a-z0-9-]+$/, 'id must be kebab-case')),
	applicableTo: v.pipe(v.array(TemplateScopeSchema), v.minLength(1)),
	requires: TemplateRequiresSchema,
	body_de: v.pipe(v.string(), v.minLength(20)),
	editorialNote: v.optional(v.string()),
	tags: v.optional(v.array(v.string()))
});
export type Template = v.InferOutput<typeof TemplateSchema>;

export const TemplateFileSchema = v.object({
	bundle: v.literal('wahl'),
	locale: v.literal('de'),
	templates: v.pipe(v.array(TemplateSchema), v.minLength(1))
});
export type TemplateFile = v.InferOutput<typeof TemplateFileSchema>;
