import { getLayerExplain } from '../inspector-panel/internal/layer-explain.js';
import { getLayerDisplayName } from './layer-palette-filter.js';
import { formatLayerValue } from '../inspector-panel/internal/value-formatters.js';

export interface HoverTooltipContent {
	readonly slug: string;
	readonly layerName: string;
	readonly valueText: string;
	readonly shortExplain: string;
	readonly hint: string;
}

const CLICK_HINT_DE = 'Klick für volle Adresse-Inspektion';

export function buildHoverTooltipContent(slug: string, value: unknown): HoverTooltipContent {
	const formatted = formatLayerValue(slug, value);
	return {
		slug,
		layerName: getLayerDisplayName(slug),
		valueText: formatted.text,
		shortExplain: getLayerExplain(slug, 'short'),
		hint: CLICK_HINT_DE
	};
}

export interface HoveredFeature {
	readonly layer: { readonly id: string };
	readonly properties: Record<string, unknown> | null;
}

export function pickTopmostHover(features: readonly HoveredFeature[]): HoveredFeature | null {
	if (features.length === 0) return null;
	return features[0];
}

const LAYER_ID_PREFIX = 'navigator-layer-';

export function slugFromLayerId(id: string): string | null {
	if (!id.startsWith(LAYER_ID_PREFIX)) return null;
	return id.slice(LAYER_ID_PREFIX.length);
}
