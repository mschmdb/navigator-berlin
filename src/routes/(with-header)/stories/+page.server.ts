import type { PageServerLoad } from './$types';
import { loadStoriesFromModules } from '$lib/content/stories/load-stories.js';
import { teaserBezirke } from '$lib/stories/punkt-linie-kiez/bezirke-daten.server.js';
import type { BezirkItem } from '$lib/stories/punkt-linie-kiez/types.js';
import type { StoryEntry } from '$lib/content/stories/types.js';

// SSR statt prerender, wie /hitze und /kaelte: stories.navigator.berlin rendert `/` per
// reroute-Hook als /stories. Bei prerenderten Zielen holt SvelteKit die Datei per fetch von
// sich selbst, das schlug im Produktions-Build mit 500 fehl.
export const prerender = false;

/** Die Miniatur zeigt einen stabilen Bezirk: den ersten alphabetisch. Fehler lassen die Miniatur weg. */
function loadPreview(): BezirkItem | null {
	try {
		return teaserBezirke()[0] ?? null;
	} catch (err) {
		process.stderr.write(`[stories] WARN: preview unavailable (${(err as Error).message})\n`);
		return null;
	}
}

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
	return { entries, preview: entries.some((e) => e.frontmatter.preview) ? loadPreview() : null };
};
