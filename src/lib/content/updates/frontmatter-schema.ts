import * as v from 'valibot';

/**
 * Story 2.13 AC-1: Frontmatter-Schema für Update-Entries unter `_content/updates/`.
 *
 * Pflichtfelder (DE-only Phase 1, memory `project_i18n_phase_1_de_only`):
 *   - title_de   ≤ 80 Zeichen
 *   - summary_de ≤ 160 Zeichen (Meta-Description-Fitness)
 *   - date       ISO-8601 `YYYY-MM-DD`
 *   - category   5er-Enum
 *
 * Optional:
 *   - title_en   (Phase 3 EN-Coverage)
 *   - summary_en
 *   - tags       max 8, lowercase-kebab-case
 *   - lang       'de' | 'en' (default 'de')
 */

export const UPDATE_CATEGORIES = [
	'daten-update',
	'feature',
	'methodik',
	'datenquelle',
	'lizenz'
] as const;

export type UpdateCategory = (typeof UPDATE_CATEGORIES)[number];

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const KEBAB_TAG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const FrontmatterSchema = v.object({
	title_de: v.pipe(v.string('title_de muss ein String sein'), v.minLength(1), v.maxLength(80)),
	title_en: v.optional(v.pipe(v.string(), v.maxLength(80))),
	summary_de: v.pipe(
		v.string('summary_de muss ein String sein'),
		v.minLength(1),
		v.maxLength(160)
	),
	summary_en: v.optional(v.pipe(v.string(), v.maxLength(160))),
	date: v.pipe(
		v.string('date muss ein ISO-8601-String sein'),
		v.regex(ISO_DATE_REGEX, 'date muss dem Format YYYY-MM-DD entsprechen')
	),
	category: v.picklist(UPDATE_CATEGORIES, 'category muss eine der 5 Enum-Werte sein'),
	tags: v.optional(
		v.pipe(
			v.array(
				v.pipe(v.string(), v.regex(KEBAB_TAG_REGEX, 'Tag muss lowercase-kebab-case sein'))
			),
			v.maxLength(8, 'Max 8 Tags erlaubt')
		)
	),
	lang: v.optional(v.picklist(['de', 'en'] as const), 'de')
});

export type UpdateFrontmatter = v.InferOutput<typeof FrontmatterSchema>;

/**
 * Validiert ein bereits geparstes YAML-Frontmatter-Objekt gegen das Schema.
 * Wirft mit menschen-lesbarem Pfad bei Verletzung. Build-Fehler bei Schema-Verstoß
 * sorgt dafür dass kein invalides MD in den Bundle rutscht.
 */
export function parseFrontmatter(raw: unknown): UpdateFrontmatter {
	const result = v.safeParse(FrontmatterSchema, raw);
	if (!result.success) {
		const message = result.issues
			.map((issue) => {
				const path = issue.path?.map((p) => p.key).join('.') ?? '<root>';
				return `${path}: ${issue.message}`;
			})
			.join('; ');
		throw new Error(`Update-Frontmatter ungültig: ${message}`);
	}
	return result.output;
}
