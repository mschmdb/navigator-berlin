import { getLayerEntry } from './manifest.js';
import type { LayerMetadata } from './types.js';

export function getLayerMetadata(slug: string): LayerMetadata {
	const entry = getLayerEntry(slug);
	if (!entry) throw new Error(`Unknown layer: ${slug}`);
	return entry;
}
