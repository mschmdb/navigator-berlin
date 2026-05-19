/**
 * Cross-Layer-Template-Renderer (Story 6.7).
 *
 * Pure Function: substituiert {variable}-Placeholder im body_de durch
 * Werte aus context. Wirft bei fehlenden Variablen statt stille String-
 * Kürzung — Page-Loader muss alle requires-Werte vor Render bereitstellen.
 */

import type { Template } from './schema.js';

export type TemplateContext = Readonly<Record<string, string | number | null | undefined>>;

export interface RenderedTemplate {
	readonly id: string;
	readonly body: string;
	readonly editorialNote: string | null;
	readonly missingVars: readonly string[];
}

const PLACEHOLDER_REGEX = /\{([a-z0-9_]+)\}/g;

export function renderTemplate(template: Template, context: TemplateContext): RenderedTemplate {
	const missing: string[] = [];
	const body = template.body_de.replace(PLACEHOLDER_REGEX, (_, key: string) => {
		const value = context[key];
		if (value === undefined || value === null || value === '') {
			missing.push(key);
			return `{${key}}`;
		}
		return String(value);
	});
	return {
		id: template.id,
		body: body.replace(/\s+/g, ' ').trim(),
		editorialNote: template.editorialNote ?? null,
		missingVars: missing
	};
}

export function canRender(template: Template, context: TemplateContext): boolean {
	const placeholders = template.body_de.matchAll(PLACEHOLDER_REGEX);
	for (const match of placeholders) {
		const value = context[match[1]];
		if (value === undefined || value === null || value === '') return false;
	}
	return true;
}
