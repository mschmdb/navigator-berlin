import { error } from '@sveltejs/kit';
import type { EntryGenerator, PageServerLoad } from './$types';
import { loadStoriesFromModules } from '$lib/content/stories/load-stories.js';
import { localizeStory } from '$lib/content/stories/localize-story.js';
import type { StoryEntry } from '$lib/content/stories/types.js';
import { renderMarkdownBody } from '$lib/content/updates/render-markdown.js';
import { getLocale } from '$lib/paraglide/runtime.js';

export const prerender = true;

function loadAll(): StoryEntry[] {
	const modules = import.meta.glob('/_content/stories/*.md', {
		eager: true,
		query: '?raw',
		import: 'default'
	}) as Record<string, string>;
	return loadStoriesFromModules(modules);
}

export const entries: EntryGenerator = () => loadAll().map((e) => ({ slug: e.slug }));

export const load: PageServerLoad = ({ params }) => {
	const entry = loadAll().find((e) => e.slug === params.slug);
	if (!entry) {
		throw error(404, `Beitrag ${params.slug} nicht gefunden`);
	}
	const localized = localizeStory(entry, getLocale());
	// Der gerenderte Body steckt in `bodyHtml`, beide Markdown-Fassungen bleiben auf dem Server.
	return {
		entry: { slug: entry.slug, filePath: entry.filePath, frontmatter: entry.frontmatter, body: '' },
		bodyHtml: renderMarkdownBody(localized.body),
		bodyIsDeFallback: localized.bodyIsDeFallback
	};
};
