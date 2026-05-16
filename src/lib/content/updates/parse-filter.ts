import { UPDATE_CATEGORIES, type UpdateCategory } from './frontmatter-schema.js';

/**
 * Story 2.13 AC-4: URL-State-Parser für Category-Filter.
 *
 * Parsed `?cat=feature,methodik` zu typed `Set<UpdateCategory>`.
 * Unbekannte Categories werden silent-ignoriert (Deep-Link-Robustheit).
 */

const KNOWN_CATEGORIES = new Set<string>(UPDATE_CATEGORIES);

export function parseCategoryFilter(value: string | null): Set<UpdateCategory> {
	const out = new Set<UpdateCategory>();
	if (!value) return out;
	for (const raw of value.split(',')) {
		const trimmed = raw.trim();
		if (KNOWN_CATEGORIES.has(trimmed)) {
			out.add(trimmed as UpdateCategory);
		}
	}
	return out;
}

/**
 * Serialisiert Filter-Set zurück zu URL-Query-String-Wert (alphabetisch sortiert
 * für stabile Canonical-URLs + bessere Cache-Hits).
 */
export function serializeCategoryFilter(set: ReadonlySet<UpdateCategory>): string {
	return [...set].sort().join(',');
}

/**
 * Wendet aktiven Filter-Set auf Entries an. Leerer Set = alle Entries.
 */
export function applyCategoryFilter<T extends { frontmatter: { category: UpdateCategory } }>(
	entries: readonly T[],
	filter: ReadonlySet<UpdateCategory>
): T[] {
	if (filter.size === 0) return [...entries];
	return entries.filter((e) => filter.has(e.frontmatter.category));
}
