import { normalizeSlug } from './slug.js';

/**
 * Eine Kiez-Referenz für die Slug-Disambiguierung: LOR-BZR-Name + zugehöriger
 * Bezirk-Name (Gemeinde_name). Reihenfolge der Refs definiert das Index-Alignment.
 */
export interface KiezNameRef {
	readonly name: string;
	readonly bezirk: string;
}

/**
 * Erzeugt pro Ref genau einen Slug, Index-aligned zur Eingabe.
 *
 * Eindeutige BZR-Namen behalten ihren bare Slug (`normalizeSlug(name)`) für
 * Canonical-Stabilität der nicht-betroffenen Pages. Duplikat-Namen (z.B.
 * "Heerstraße" in Spandau + Charlottenburg-Wilmersdorf) bekommen den Bezirk-Slug
 * als Suffix: `heerstrasse-spandau` / `heerstrasse-charlottenburg-wilmersdorf`.
 *
 * Behebt den 8.2b-Mismatch: Reader (entries), Resolver (get-kiez-profile) und
 * Sitemap/Links müssen dieselbe Funktion nutzen, sonst 404 auf suffixed URLs.
 */
export function buildKiezSlugs(refs: readonly KiezNameRef[]): string[] {
	const baseCount = new Map<string, number>();
	for (const ref of refs) {
		const base = normalizeSlug(ref.name);
		baseCount.set(base, (baseCount.get(base) ?? 0) + 1);
	}
	return refs.map((ref) => {
		const base = normalizeSlug(ref.name);
		if ((baseCount.get(base) ?? 0) > 1) {
			return `${base}-${normalizeSlug(ref.bezirk)}`;
		}
		return base;
	});
}

/**
 * Löst einen angefragten Slug auf den Index der passenden Ref auf, sonst -1.
 * Die Anfrage wird vor dem Abgleich normalisiert (case-/format-tolerant).
 */
export function resolveKiezSlugIndex(refs: readonly KiezNameRef[], requested: string): number {
	const target = normalizeSlug(requested);
	const slugs = buildKiezSlugs(refs);
	return slugs.indexOf(target);
}
