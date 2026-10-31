import { error } from '@sveltejs/kit';
import type { EntryGenerator, PageServerLoad } from './$types';
import { loadStoriesFromModules } from '$lib/content/stories/load-stories.js';
import { localizeStory } from '$lib/content/stories/localize-story.js';
import type { StoryEntry } from '$lib/content/stories/types.js';
import { renderMarkdownBody } from '$lib/content/updates/render-markdown.js';
import { splitAtVisual } from '$lib/content/stories/split-at-visual.js';
import { loadBezirkeDaten } from '$lib/stories/punkt-linie-kiez/bezirke-daten.server.js';
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
	// Ein Marker `<!-- visual -->` teilt den Text: davor über, danach unter der Visualisierung.
	const parts = splitAtVisual(localized.body);
	return {
		entry: { slug: entry.slug, filePath: entry.filePath, frontmatter: entry.frontmatter, body: '' },
		bodyHtmlBefore: parts.before ? renderMarkdownBody(parts.before) : '',
		bodyHtml: renderMarkdownBody(parts.after),
		bodyIsDeFallback: localized.bodyIsDeFallback,
		// Nur die Bezirke gehen an den Client, die 143 Kieze bleiben auf dem Server.
		bezirkeDaten:
			entry.frontmatter.visual === 'punkt-linie-kiez-bezirke' ? loadBezirkeDaten() : undefined
	};
};
