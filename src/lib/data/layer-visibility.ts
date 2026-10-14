import type { LayerMetadata } from './types.js';

/**
 * Build-only-Layer (weder Karte noch Inspector, z.B. Heritage-Dichte-Signal
 * denkmal-2024/stolpersteine) bekommen keine öffentliche Detail-Seite.
 * Einzige Quelle dieser Regel für Seite, entries, Sitemap, llms.txt, Lizenzen und Methodik.
 */
export function hasLayerDetailPage(
	meta: Pick<LayerMetadata, 'inspectorRelevant' | 'mapRelevant'>
): boolean {
	return !(meta.inspectorRelevant === false && meta.mapRelevant === false);
}
