import type { PageServerLoad } from './$types';
import { loadStoriesFromModules } from '$lib/content/stories/load-stories.js';
import type { StoryEntry } from '$lib/content/stories/types.js';

export const prerender = true;

/**
 * Build-Time-Load aller `_content/stories/*.md`. Ein Schema-Verstoß bricht den Build.
 * Die Übersicht braucht keinen Body, er bleibt auf dem Server.
 */
export const load: PageServerLoad = async () => {
	const modules = import.meta.glob('/_content/stories/*.md', {
		eager: true,
		query: '?raw',
		import: 'default'
	}) as Record<string, string>;
	const entries: StoryEntry[] = loadStoriesFromModules(modules).map((entry) => ({
		slug: entry.slug,
		filePath: entry.filePath,
		frontmatter: entry.frontmatter,
		body: '',
		hasEnglishBody: entry.bodyEn !== undefined
	}));
	return { entries };
};
