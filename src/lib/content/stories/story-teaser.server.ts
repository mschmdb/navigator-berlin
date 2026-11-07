import { loadStoriesWahl } from '$lib/server/stories/wahl-daten.js';
import { teaserBezirke } from '$lib/stories/punkt-linie-kiez/bezirke-daten.server.js';
import { vorschauShares } from '$lib/stories/wahl-quadrate/og-komposition.js';
import type { BezirkItem } from '$lib/stories/punkt-linie-kiez/types.js';
import { loadStoriesFromModules } from './load-stories.js';
import type { StoryEntry } from './types.js';

export interface StoryTeaserData {
	readonly entries: readonly StoryEntry[];
	/** Bezirk für die Miniaturen. `null`, wenn kein Beitrag `preview` setzt. */
	readonly preview: BezirkItem | null;
	/** Anteile der zwölf Quadrate für die Miniatur von „Berlin in Quadraten“, sonst `null`. */
	readonly quadrate?: readonly (readonly number[])[] | null;
}

/** Miniatur-Daten je `preview`-Wert, nur geladen, wenn ein Beitrag sie braucht. */
export function quadrateFor(entries: readonly StoryEntry[]): number[][] | null {
	return entries.some((e) => e.frontmatter.preview === 'berlin-in-quadraten')
		? vorschauShares(loadStoriesWahl())
		: null;
}

/** Die neuesten Beiträge für die Startseite. Nur Frontmatter geht an den Client, nie der Body. */
export function loadStoryTeaser(limit = 3): StoryTeaserData {
	const modules = import.meta.glob('/_content/stories/*.md', {
		eager: true,
		query: '?raw',
		import: 'default'
	}) as Record<string, string>;
	const entries = loadStoriesFromModules(modules)
		.slice(0, limit)
		.map((e) => ({
			slug: e.slug,
			filePath: e.filePath,
			frontmatter: e.frontmatter,
			body: '',
			hasEnglishBody: e.bodyEn !== undefined
		}));
	const wantsPreview = entries.some((e) => e.frontmatter.preview === 'punkt-linie-kiez-bezirke');
	return {
		entries,
		preview: wantsPreview ? (teaserBezirke()[0] ?? null) : null,
		quadrate: quadrateFor(entries)
	};
}
