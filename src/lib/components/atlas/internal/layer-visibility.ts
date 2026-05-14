import { isPolygonSlug } from './layer-style-cascade.js';

export const POLYGON_LAYER_LIMIT = 3;

export function polygonSlugCount(slugs: readonly string[]): number {
	let count = 0;
	for (const slug of slugs) {
		if (isPolygonSlug(slug)) count++;
	}
	return count;
}

export function exceedsPolygonLimit(
	slugs: readonly string[],
	limit: number = POLYGON_LAYER_LIMIT
): boolean {
	return polygonSlugCount(slugs) > limit;
}

export function applyHiddenSlugs(
	activeSlugs: readonly string[],
	hiddenSlugs: readonly string[]
): string[] {
	if (hiddenSlugs.length === 0) return [...activeSlugs];
	const hidden = new Set(hiddenSlugs);
	return activeSlugs.filter((s) => !hidden.has(s));
}
