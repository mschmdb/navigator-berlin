import type { UpdateCategory, UpdateFrontmatter } from './frontmatter-schema.js';

/**
 * Story 2.13: parsed Update-Entry. Body bleibt Markdown-String, Render erst in Component.
 */
export interface UpdateEntry {
	readonly slug: string;
	readonly filePath: string;
	readonly frontmatter: UpdateFrontmatter;
	readonly body: string;
	/** Englischer Body aus der Schwesterdatei `YYYY-MM-DD-<slug>.en.md`, sonst `undefined`. */
	readonly bodyEn?: string;
}

export type { UpdateCategory, UpdateFrontmatter };
