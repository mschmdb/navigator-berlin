import { getLayerExplain } from '../inspector-panel/internal/layer-explain.js';
import { getLayerDisplayName } from './layer-palette-filter.js';
import { formatLayerValue } from '../inspector-panel/internal/value-formatters.js';
import { hasPinIcon } from './pin-icon-mapping.js';
import { getPopoverSummary } from './poi-summary-builder.js';

export type HoverTooltipKind = 'polygon' | 'poi';

export interface HoverTooltipContent {
	readonly kind: HoverTooltipKind;
	readonly slug: string;
	readonly layerName: string;
	readonly valueText: string;
	readonly shortExplain: string;
	readonly hint: string;
	/** POI-spezifischer Titel (z.B. Stations-Name oder Stolperstein-Person). */
	readonly poiTitle?: string;
	readonly poiSubtitle?: string;
}

const CLICK_HINT_DE = 'Klick für volle Adresse-Inspektion';
const POI_HINT_DE = 'Mehr im Inspektor →';

export function buildHoverTooltipContent(slug: string, value: unknown): HoverTooltipContent {
	const layerName = getLayerDisplayName(slug);
	if (hasPinIcon(slug)) {
		const summary = getPopoverSummary(slug, (value as Record<string, unknown> | null) ?? null);
		return {
			kind: 'poi',
			slug,
			layerName,
			valueText: summary.title,
			shortExplain: '',
			hint: POI_HINT_DE,
			poiTitle: summary.title,
			poiSubtitle: summary.subtitle
		};
	}
	const formatted = formatLayerValue(slug, value);
	return {
		kind: 'polygon',
		slug,
		layerName,
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
