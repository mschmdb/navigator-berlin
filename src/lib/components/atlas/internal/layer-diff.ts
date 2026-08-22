export interface LayerDiff {
	readonly toAdd: readonly string[];
	readonly toRemove: readonly string[];
}

export function diffLayerSlugs(current: readonly string[], next: readonly string[]): LayerDiff {
	const currentSet = new Set(current);
	const nextSet = new Set(next);
	const toAdd: string[] = [];
	const toRemove: string[] = [];
	for (const slug of next) {
		if (!currentSet.has(slug)) toAdd.push(slug);
	}
	for (const slug of current) {
		if (!nextSet.has(slug)) toRemove.push(slug);
	}
	return { toAdd, toRemove };
}

export function sourceIdFor(slug: string): string {
	return `navigator-source-${slug}`;
}

export function layerIdFor(slug: string): string {
	return `navigator-layer-${slug}`;
}

/**
 * ID des begleitenden Kontur-Layers einer Polygon-Kaskade. Der Haupt-Layer
 * bleibt immer ein Fill (bei Kontur-Variante unsichtbar als Hover-Hit-Fläche),
 * die sichtbare Kontur läuft unter dieser Zweit-ID.
 */
export function outlineLayerIdFor(slug: string): string {
	return `${layerIdFor(slug)}-outline`;
}

/**
 * Punkt-Quelle der Score-Punktsymbole: ein berechneter Label-Punkt pro
 * Fläche (feature-label-points), damit MapLibre bei hohem Zoom nicht ein
 * Symbol pro Tile-Fragment setzt.
 */
export function dotsSourceIdFor(slug: string): string {
	return `${sourceIdFor(slug)}-dots`;
}
