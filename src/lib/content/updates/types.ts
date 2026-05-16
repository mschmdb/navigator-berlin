import type { UpdateCategory, UpdateFrontmatter } from './frontmatter-schema.js';

/**
 * Story 2.13: parsed Update-Entry. Body bleibt Markdown-String, Render erst in Component.
 */
export interface UpdateEntry {
	readonly slug: string;
	readonly filePath: string;
	readonly frontmatter: UpdateFrontmatter;
	readonly body: string;
}

export type { UpdateCategory, UpdateFrontmatter };
