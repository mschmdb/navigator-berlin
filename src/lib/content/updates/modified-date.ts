import type { UpdateEntry } from './types.js';

/** Letzte inhaltliche Änderung (`updated`), sonst das Veröffentlichungsdatum (`date`). */
export function entryModifiedDate(entry: UpdateEntry): string {
	return entry.frontmatter.updated ?? entry.frontmatter.date;
}
