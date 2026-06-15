/**
 * Valibot-Schema für Subagent-Response. Story 5.8 AC-4.
 */

import * as v from 'valibot';

const DraftSchema = v.object({
	kind: v.literal('draft'),
	category: v.picklist(['daten-update', 'feature', 'methodik', 'datenquelle', 'lizenz'] as const),
	title_de: v.pipe(v.string(), v.minLength(1), v.maxLength(80)),
	summary_de: v.pipe(v.string(), v.minLength(1), v.maxLength(160)),
	tags: v.pipe(v.array(v.pipe(v.string(), v.regex(/^[a-z0-9-]+$/))), v.maxLength(8)),
	body: v.pipe(v.string(), v.minLength(1))
});

const SkipSchema = v.object({
	kind: v.literal('skip'),
	reason: v.pipe(v.string(), v.minLength(1))
});

export const DraftResultSchema = v.variant('kind', [DraftSchema, SkipSchema]);

export type DraftResult = v.InferOutput<typeof DraftResultSchema>;

export function parseDraftResult(
	raw: unknown
): { ok: true; value: DraftResult } | { ok: false; error: string } {
	const r = v.safeParse(DraftResultSchema, raw);
	if (r.success) return { ok: true, value: r.output };
	return {
		ok: false,
		error: r.issues.map((i) => `${i.path?.map((p) => p.key).join('.')}: ${i.message}`).join('; ')
	};
}
