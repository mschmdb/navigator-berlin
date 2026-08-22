import { isPolygonSlug } from './layer-style-cascade.js';

/**
 * Multi-Layer-Kartenfarben: maximal Fläche + eine Kontur. Ab dem dritten
 * Choroplethen liest niemand mehr etwas, deshalb kappt `capPolygonSlugs`
 * hart statt nur zu warnen.
 */
export const POLYGON_LAYER_LIMIT = 2;

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

/**
 * Hält höchstens `limit` Polygon-Layer aktiv, die ältesten fliegen zuerst.
 * Punkt- und Linien-Layer bleiben unangetastet.
 */
export function capPolygonSlugs(
	slugs: readonly string[],
	limit: number = POLYGON_LAYER_LIMIT
): string[] {
	const excess = polygonSlugCount(slugs) - limit;
	if (excess <= 0) return [...slugs];
	let toDrop = excess;
	const out: string[] = [];
	for (const slug of slugs) {
		if (toDrop > 0 && isPolygonSlug(slug)) {
			toDrop--;
			continue;
		}
		out.push(slug);
	}
	return out;
}
