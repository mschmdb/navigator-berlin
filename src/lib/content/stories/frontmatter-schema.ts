import * as v from 'valibot';

/**
 * Frontmatter für Beiträge unter `_content/stories/`.
 *
 * Pflicht: `title`, `summary` (≤ 160 Zeichen, Meta-Description), `date` (YYYY-MM-DD).
 * Optional: `title_en`, `summary_en` (Pflicht, sobald eine `.en.md` existiert), `series`, `visual`, `preview`
 * (`preview` zeigt die Miniatur in der Übersicht, `visual` benennt die Visualisierung, die die Beitragsseite vor dem Text rendert).
 */
export const STORY_VISUALS = ['punkt-linie-kiez-bezirke'] as const;
export type StoryVisual = (typeof STORY_VISUALS)[number];

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const StoryFrontmatterSchema = v.object({
	title: v.pipe(v.string('title muss ein String sein'), v.minLength(1), v.maxLength(80)),
	title_en: v.optional(v.pipe(v.string(), v.maxLength(80))),
	summary: v.pipe(v.string('summary muss ein String sein'), v.minLength(1), v.maxLength(160)),
	summary_en: v.optional(v.pipe(v.string(), v.maxLength(160))),
	date: v.pipe(
		v.string('date muss ein ISO-8601-String sein'),
		v.regex(ISO_DATE_REGEX, 'date muss dem Format YYYY-MM-DD entsprechen')
	),
	series: v.optional(v.pipe(v.string(), v.minLength(1), v.maxLength(80))),
	preview: v.optional(v.picklist(STORY_VISUALS, 'preview ist keine bekannte Visualisierung')),
	visual: v.optional(v.picklist(STORY_VISUALS, 'visual ist keine bekannte Visualisierung'))
});

export type StoryFrontmatter = v.InferOutput<typeof StoryFrontmatterSchema>;

/** Validiert geparstes YAML. Wirft mit Feldpfad, damit der Build bei Verstoß abbricht. */
export function parseStoryFrontmatter(raw: unknown): StoryFrontmatter {
	const result = v.safeParse(StoryFrontmatterSchema, raw);
	if (!result.success) {
		const message = result.issues
			.map((issue) => `${issue.path?.map((p) => p.key).join('.') ?? '<root>'}: ${issue.message}`)
			.join('; ');
		throw new Error(`Story-Frontmatter ungültig: ${message}`);
	}
	return result.output;
}
