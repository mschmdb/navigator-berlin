import type { PageServerLoad } from './$types';
import { loadUpdatesFromModules } from '$lib/content/updates/load-updates.js';
import type { UpdateEntry } from '$lib/content/updates/types.js';

export const prerender = true;

/**
 * Story 2.13 AC-2: Build-Time-Load aller `_content/updates/*.md`-Files.
 * Schema-Verstoß ist Build-Fehler (loadUpdatesFromModules wirft).
 */
export const load: PageServerLoad = async () => {
	const modules = import.meta.glob('/_content/updates/*.md', {
		eager: true,
		query: '?raw',
		import: 'default'
	}) as Record<string, string>;
	const entries: UpdateEntry[] = loadUpdatesFromModules(modules);
	return { entries };
};
