import type { LayerMetadata } from '$lib/data';

export function getVisibleLayers(zoom: number, layers: LayerMetadata[]): LayerMetadata[] {
	return layers.filter((l) => zoom >= l.zoomThresholds.min && zoom <= l.zoomThresholds.max);
}
