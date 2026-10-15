import type { RegionOutline } from '$lib/seo/region-outline-svg.js';

/** `true`, wenn mindestens ein Pfad des Umrisses zu einer der Kiez-Slugs passt.
 * Hero und Karten nutzen dieselbe Bedingung, damit kein leerer Rahmen entsteht. */
export function hasRenderableOutline(
	outline: RegionOutline | null,
	slugs: Iterable<string>
): outline is RegionOutline {
	if (!outline) return false;
	const wanted = new Set(slugs);
	return outline.paths.some((p) => wanted.has(p.id));
}
