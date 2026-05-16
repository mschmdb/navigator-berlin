import { error } from '@sveltejs/kit';
import type { EntryGenerator, PageServerLoad } from './$types';
import { loadUpdatesFromModules } from '$lib/content/updates/load-updates.js';
import { renderMarkdownBody } from '$lib/content/updates/render-markdown.js';
import type { UpdateEntry } from '$lib/content/updates/types.js';

export const prerender = true;

function loadAll(): UpdateEntry[] {
	const modules = import.meta.glob('/_content/updates/*.md', {
		eager: true,
		query: '?raw',
		import: 'default'
	}) as Record<string, string>;
	return loadUpdatesFromModules(modules);
}

/**
 * Story 2.13 AC-3 entries-Hook: enumeriert alle MD-Slugs aus `_content/updates/`.
 * Resultat ist die Liste aller prerendered Detail-Pages.
 */
export const entries: EntryGenerator = () => {
	return loadAll().map((e) => ({ slug: e.slug }));
};

export const load: PageServerLoad = ({ params }) => {
	const entry = loadAll().find((e) => e.slug === params.slug);
	if (!entry) {
		throw error(404, `Update ${params.slug} nicht gefunden`);
	}
	const bodyHtml = renderMarkdownBody(entry.body);
	return { entry, bodyHtml };
};
