import type { StoryFrontmatter } from './frontmatter-schema.js';

export interface StoryEntry {
	readonly slug: string;
	readonly filePath: string;
	readonly frontmatter: StoryFrontmatter;
	readonly body: string;
	/** Englischer Body aus der Schwesterdatei `YYYY-MM-DD-<slug>.en.md`, sonst `undefined`. */
	readonly bodyEn?: string;
	/** Vom Server gesetzt, wenn `body`/`bodyEn` entfernt sind: Gibt es eine `.en.md`? */
	readonly hasEnglishBody?: boolean;
}

export type { StoryFrontmatter };
