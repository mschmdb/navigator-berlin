import { isChoroplethSlug } from './layer-style-cascade.js';

/**
 * Multi-Layer-Kartenfarben: maximal Fläche + ein Symbol-Layer. Ab dem dritten
 * Choroplethen liest niemand mehr etwas, deshalb kappt `capPolygonSlugs`
 * hart statt nur zu warnen. Binär-Overlays (Milieuschutz, Kaltluft, ...)
 * zählen nicht: Sie konkurrieren visuell nicht um die Wertskala.
 */
export const POLYGON_LAYER_LIMIT = 2;

export function polygonSlugCount(slugs: readonly string[]): number {
	let count = 0;
	for (const slug of slugs) {
		if (isChoroplethSlug(slug)) count++;
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
		if (toDrop > 0 && isChoroplethSlug(slug)) {
			toDrop--;
			continue;
		}
		out.push(slug);
	}
	return out;
}

/**
 * PMTiles-Choroplethen können client-seitig keine Label-Punkte liefern und
 * sind deshalb immer die Fläche, nie der Symbol-Layer.
 */
const PMTILES_CHOROPLETH_SLUGS: ReadonlySet<string> = new Set(['klima-pet-2022']);

/**
 * Legenden-Tausch: Reihenfolge der Choroplethen so umstellen, dass der
 * gewünschte Layer den Fläche-Slot bekommt (erste Choroplethen-Position).
 * PMTiles-Choroplethen gewinnen die Fläche immer, auch gegen den Lead.
 * Alle übrigen Slugs behalten ihre Positionen; die Choroplethen-Teilfolge
 * bleibt sonst stabil. Die Ausgabe steuert Rollen UND Render-Z-Reihenfolge.
 */
/** True, wenn ein aktiver Layer die Fläche fest belegt (PMTiles-Choropleth). */
export function hasPinnedChoropleth(slugs: readonly string[]): boolean {
	return slugs.some((slug) => PMTILES_CHOROPLETH_SLUGS.has(slug));
}

export function orderChoropleths(slugs: readonly string[], leadSlug: string | null): string[] {
	const choroplethIndices: number[] = [];
	for (let i = 0; i < slugs.length; i++) {
		if (isChoroplethSlug(slugs[i])) choroplethIndices.push(i);
	}
	if (choroplethIndices.length < 2) return [...slugs];

	const subsequence = choroplethIndices.map((i) => slugs[i]);
	const pinned = subsequence.find((slug) => PMTILES_CHOROPLETH_SLUGS.has(slug));
	const desired = pinned ?? (leadSlug && subsequence.includes(leadSlug) ? leadSlug : null);
	if (!desired || subsequence[0] === desired) return [...slugs];

	const reordered = [desired, ...subsequence.filter((slug) => slug !== desired)];
	const out = [...slugs];
	choroplethIndices.forEach((slot, k) => {
		out[slot] = reordered[k];
	});
	return out;
}
