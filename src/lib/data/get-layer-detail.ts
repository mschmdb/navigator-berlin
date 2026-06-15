import type { LayerMetadata, Manifest } from './types.js';
import {
	getLayerExplainEntry,
	type LayerExplain
} from '$lib/components/atlas/inspector-panel/internal/layer-explain.js';
import { getLayerDisplayName } from '$lib/components/atlas/internal/layer-palette-filter.js';
import { getEditorialConfig } from '$lib/components/atlas/internal/editorial-config.js';
import type { EditorialConfig } from '$lib/components/atlas/internal/editorial-types.js';
import { getLayerMethodology, type LayerMethodology } from './layer-methodology.js';

export interface LayerDetail {
	readonly slug: string;
	readonly lang: string;
	readonly layerName: string;
	readonly explain: LayerExplain;
	readonly meta: LayerMetadata;
	readonly editorial?: EditorialConfig;
	readonly methodology: LayerMethodology | null;
}

export function buildLayerDetail(
	slug: string,
	lang: string,
	manifest: Manifest
): LayerDetail | null {
	const meta = manifest.layers.find((l) => l.slug === slug);
	if (!meta) return null;
	// Build-only-Layer (weder Karte noch Inspector, z.B. Heritage-Dichte-Signal
	// denkmal-2024/stolpersteine) bekommen keine öffentliche Detail-Seite.
	if (meta.inspectorRelevant === false && meta.mapRelevant === false) return null;
	return {
		slug,
		lang,
		layerName: getLayerDisplayName(slug),
		explain: getLayerExplainEntry(slug),
		meta,
		editorial: getEditorialConfig(slug),
		methodology: getLayerMethodology(slug)
	};
}
