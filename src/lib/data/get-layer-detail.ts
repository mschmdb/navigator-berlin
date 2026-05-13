import type { LayerMetadata, Manifest } from './types.js';
import {
	getLayerExplainEntry,
	type LayerExplain
} from '$lib/components/atlas/inspector-panel/internal/layer-explain.js';
import { getLayerDisplayName } from '$lib/components/atlas/internal/layer-palette-filter.js';
import {
	getEditorialConfig
} from '$lib/components/atlas/internal/editorial-config.js';
import type { EditorialConfig } from '$lib/components/atlas/internal/editorial-types.js';

export interface LayerDetail {
	readonly slug: string;
	readonly lang: string;
	readonly layerName: string;
	readonly explain: LayerExplain;
	readonly meta: LayerMetadata;
	readonly editorial?: EditorialConfig;
}

export function buildLayerDetail(
	slug: string,
	lang: string,
	manifest: Manifest
): LayerDetail | null {
	const meta = manifest.layers.find((l) => l.slug === slug);
	if (!meta) return null;
	return {
		slug,
		lang,
		layerName: getLayerDisplayName(slug),
		explain: getLayerExplainEntry(slug),
		meta,
		editorial: getEditorialConfig(slug)
	};
}
