import { getLayerExplain } from '../inspector-panel/internal/layer-explain.js';
import { getLayerDisplayName } from './layer-palette-filter.js';
import { formatLayerValue } from '../inspector-panel/internal/value-formatters.js';
import { hasPinIcon } from './pin-icon-mapping.js';
import { getPopoverSummary } from './poi-summary-builder.js';
import { m } from '$lib/paraglide/messages.js';
import { toAtlasMessageOptions, type LocaleOptions } from './atlas-label-options.js';

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

export function buildHoverTooltipContent(
	slug: string,
	value: unknown,
	opts?: LocaleOptions
): HoverTooltipContent {
	const options = toAtlasMessageOptions(opts);
	const layerName = getLayerDisplayName(slug, opts);
	if (hasPinIcon(slug)) {
		const summary = getPopoverSummary(slug, (value as Record<string, unknown> | null) ?? null);
		return {
			kind: 'poi',
			slug,
			layerName,
			valueText: summary.title,
			shortExplain: '',
			hint: m.atlas_tooltip_poi_hint(undefined, options),
			poiTitle: summary.title,
			poiSubtitle: summary.subtitle
		};
	}
	const formatted = formatLayerValue(slug, value, opts);
	return {
		kind: 'polygon',
		slug,
		layerName,
		valueText: formatted.text,
		// Erklärtexte (`layer-explain.ts`) bleiben Block C -- DE, unabhängig
		// von `opts.locale` (Boundary Spec i18n B3a).
		shortExplain: getLayerExplain(slug, 'short'),
		hint: m.atlas_tooltip_click_hint(undefined, options)
	};
}

export interface HoveredFeature {
	readonly layer: { readonly id: string };
	readonly properties: Record<string, unknown> | null;
}

const LAYER_ID_PREFIX = 'navigator-layer-';

export function slugFromLayerId(id: string): string | null {
	if (!id.startsWith(LAYER_ID_PREFIX)) return null;
	return id.slice(LAYER_ID_PREFIX.length);
}

export interface HoverTooltipRow {
	readonly slug: string;
	readonly layerName: string;
	readonly valueText: string;
	readonly shortExplain: string;
	readonly poiTitle?: string;
	readonly poiSubtitle?: string;
}

export interface MultiHoverContent {
	readonly kind: HoverTooltipKind;
	readonly rows: readonly HoverTooltipRow[];
	readonly hint: string;
}

/**
 * Multi-Layer-Tooltip: eine Zeile je aktivem Choroplethen unter dem Cursor,
 * oberster zuerst. Liegt ein POI-Pin oben, gewinnt er allein, ein Stations-
 * Popover mit Score-Beifang würde nur rauschen. Erklärtexte gibt es nur in der
 * Ein-Zeilen-Fassung, sonst wächst der Tooltip ins Bild.
 */
export function buildMultiHoverContent(
	features: readonly HoveredFeature[],
	opts?: LocaleOptions
): MultiHoverContent | null {
	const seen = new Set<string>();
	const slugsInOrder: { slug: string; properties: Record<string, unknown> | null }[] = [];
	for (const feature of features) {
		const slug = slugFromLayerId(feature.layer.id);
		if (!slug || seen.has(slug)) continue;
		seen.add(slug);
		slugsInOrder.push({ slug, properties: feature.properties });
	}
	if (slugsInOrder.length === 0) return null;

	const top = buildHoverTooltipContent(slugsInOrder[0].slug, slugsInOrder[0].properties, opts);
	if (top.kind === 'poi') {
		return {
			kind: 'poi',
			hint: top.hint,
			rows: [
				{
					slug: top.slug,
					layerName: top.layerName,
					valueText: top.valueText,
					shortExplain: '',
					poiTitle: top.poiTitle,
					poiSubtitle: top.poiSubtitle
				}
			]
		};
	}

	// Nur Choroplethen-Zeilen: ein POI unterhalb der Fläche (Station unter
	// Score-Fill) gehört nicht in die Wert-Liste, er hat seinen eigenen
	// Tooltip, wenn er selbst oben liegt.
	const polygonContents = slugsInOrder
		.map(({ slug, properties }) => buildHoverTooltipContent(slug, properties, opts))
		.filter((content) => content.kind === 'polygon');
	const multiple = polygonContents.length > 1;
	const rows = polygonContents.map((content) => ({
		slug: content.slug,
		layerName: content.layerName,
		// Mehrzeilig nennt die Label-Spalte die Dimension schon; der Präfix
		// "Versorgung: " würde den Wert nur unnötig umbrechen lassen.
		valueText: multiple ? content.valueText.replace(/^[^:()]{1,32}:\s+/, '') : content.valueText,
		shortExplain: multiple ? '' : content.shortExplain
	}));
	return { kind: 'polygon', rows, hint: top.hint };
}
