/**
 * Cross-Layer-Template-Renderer (Story 6.7).
 *
 * Pure Function: substituiert {variable}-Placeholder im body_de (bzw. body_en
 * bei `opts.locale === 'en'`, Fallback body_de) durch
 * Werte aus context. Wirft bei fehlenden Variablen statt stille String-
 * Kürzung — Page-Loader muss alle requires-Werte vor Render bereitstellen.
 */

import type { Locale } from '$lib/paraglide/runtime';
import type { Template } from './schema.js';

export type TemplateContext = Readonly<Record<string, string | number | null | undefined>>;

export interface RenderedTemplate {
	readonly id: string;
	readonly body: string;
	readonly editorialNote: string | null;
	readonly missingVars: readonly string[];
}

const PLACEHOLDER_REGEX = /\{([a-z0-9_]+)\}/g;

export interface TemplateRenderOptions {
	/** Ohne Angabe rendert der Renderer Deutsch (Server-, Export- und Lint-Pfade). */
	readonly locale?: Locale;
}

function pickBody(template: Template, opts?: TemplateRenderOptions): string {
	if (opts?.locale === 'en' && template.body_en) return template.body_en;
	return template.body_de;
}

export function renderTemplate(
	template: Template,
	context: TemplateContext,
	opts?: TemplateRenderOptions
): RenderedTemplate {
	const missing: string[] = [];
	const body = pickBody(template, opts).replace(PLACEHOLDER_REGEX, (_, key: string) => {
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

export function canRender(
	template: Template,
	context: TemplateContext,
	opts?: TemplateRenderOptions
): boolean {
	const placeholders = pickBody(template, opts).matchAll(PLACEHOLDER_REGEX);
	for (const match of placeholders) {
		const value = context[match[1]];
		if (value === undefined || value === null || value === '') return false;
	}
	return true;
}
