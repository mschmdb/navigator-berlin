/**
 * Server-Side-Loader für Cross-Layer-Templates (Story 6.7).
 *
 * Liest YAML-Files aus src/lib/data/cross-layer-templates/{bundle}/
 * via Node.fs zur Server-/Build-Zeit. Cache pro Prozess.
 */

import { readFile, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import {
	loadTemplatesFromRawMap,
	type LoadedTemplateBundle
} from '$lib/data/cross-layer-templates/index.js';

const TEMPLATE_ROOT = join(process.cwd(), 'src/lib/data/cross-layer-templates');

let cache: LoadedTemplateBundle[] | null = null;

async function walkYaml(dir: string, acc: Record<string, string>): Promise<void> {
	let entries: string[];
	try {
		entries = await readdir(dir);
	} catch {
		return;
	}
	for (const name of entries) {
		const abs = join(dir, name);
		const s = await stat(abs);
		if (s.isDirectory()) await walkYaml(abs, acc);
		else if (name.endsWith('.yaml') || name.endsWith('.yml')) {
			acc[abs] = await readFile(abs, 'utf-8');
		}
	}
}

export async function loadCrossLayerTemplates(): Promise<LoadedTemplateBundle[]> {
	if (cache) return cache;
	const raw: Record<string, string> = {};
	await walkYaml(TEMPLATE_ROOT, raw);
	cache = loadTemplatesFromRawMap(raw);
	return cache;
}

