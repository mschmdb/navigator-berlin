/**
 * Cross-Layer-Template-Loader (Story 6.7).
 *
 * Liest YAML-Files unter src/lib/data/cross-layer-templates/{bundle}/
 * und parsed gegen TemplateFileSchema. Loader ist synchron (kein I/O zur
 * Laufzeit — Templates werden über Vite import.meta.glob beim Build
 * eingezogen).
 */

import { load as parseYaml } from 'js-yaml';
import * as v from 'valibot';
import {
	TemplateFileSchema,
	type Template,
	type TemplateFile,
	type TemplateScope
} from './schema.js';

export interface LoadedTemplateBundle {
	readonly bundle: string;
	readonly locale: string;
	readonly templates: readonly Template[];
}

export function parseTemplateFile(rawYaml: string): TemplateFile {
	const parsed = parseYaml(rawYaml);
	return v.parse(TemplateFileSchema, parsed);
}

export function loadTemplatesFromRawMap(rawFiles: Record<string, string>): LoadedTemplateBundle[] {
	const bundles: LoadedTemplateBundle[] = [];
	for (const [path, raw] of Object.entries(rawFiles)) {
		try {
			const parsed = parseTemplateFile(raw);
			bundles.push({
				bundle: parsed.bundle,
				locale: parsed.locale,
				templates: parsed.templates
			});
		} catch (err) {
			const msg = err instanceof Error ? err.message : String(err);
			throw new Error(`failed to parse template file ${path}: ${msg}`);
		}
	}
	return bundles;
}

export function findTemplatesForScope(
	bundles: readonly LoadedTemplateBundle[],
	scope: TemplateScope
): Template[] {
	const out: Template[] = [];
	for (const b of bundles) {
		for (const t of b.templates) {
			if (t.applicableTo.includes(scope)) out.push(t);
		}
	}
	return out;
}
