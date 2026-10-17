/**
 * Server-Side-Loader für Cross-Layer-Templates (Story 6.7).
 *
 * Die YAML-Files unter src/lib/data/cross-layer-templates/{bundle}/ zieht
 * Vite per import.meta.glob zur Build-Zeit ein. Das Laufzeit-Image enthält
 * kein src/, ein Dateizugriff über process.cwd() fände dort nichts (#116).
 * Cache pro Prozess.
 */

import {
	loadTemplatesFromRawMap,
	type LoadedTemplateBundle
} from '$lib/data/cross-layer-templates/index.js';

const RAW_TEMPLATES = import.meta.glob<string>('../data/cross-layer-templates/**/*.{yaml,yml}', {
	query: '?raw',
	import: 'default',
	eager: true
});

let cache: LoadedTemplateBundle[] | null = null;

export async function loadCrossLayerTemplates(): Promise<LoadedTemplateBundle[]> {
	if (cache) return cache;
	cache = loadTemplatesFromRawMap(RAW_TEMPLATES);
	return cache;
}
