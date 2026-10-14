import type { Bbox } from '$lib/utils/url-state.js';
import { COLORS } from './colors.js';
import type { RegionFeature } from './region-focus.js';

export const REGION_FOCUS_SOURCE_ID = 'region-focus-src';
export const REGION_FOCUS_LINE_ID = 'region-focus-line';

export interface RegionFocusMapLike {
	addSource: (id: string, source: { type: 'geojson'; data: unknown }) => void;
	removeSource: (id: string) => void;
	addLayer: (spec: Record<string, unknown>) => void;
	removeLayer: (id: string) => void;
	getLayer: (id: string) => unknown;
	getSource: (id: string) => unknown;
	fitBounds: (
		bounds: [[number, number], [number, number]],
		options: {
			padding: { top: number; right: number; bottom: number; left: number };
			animate: boolean;
			maxZoom: number;
		}
	) => void;
}

/** Kontur des fokussierten Orts. Eigene IDs, getrennt von `region-outline-*` (Demografie-Scope). */
export function showRegionFocusOutline(map: RegionFocusMapLike, feature: RegionFeature): void {
	removeRegionFocusOutline(map);
	map.addSource(REGION_FOCUS_SOURCE_ID, {
		type: 'geojson',
		data: { type: 'FeatureCollection', features: [feature] }
	});
	map.addLayer({
		id: REGION_FOCUS_LINE_ID,
		type: 'line',
		source: REGION_FOCUS_SOURCE_ID,
		layout: { 'line-join': 'round' },
		paint: { 'line-color': COLORS.markerPin, 'line-width': 3, 'line-opacity': 0.95 }
	});
}

export function removeRegionFocusOutline(map: RegionFocusMapLike): void {
	if (map.getLayer(REGION_FOCUS_LINE_ID)) map.removeLayer(REGION_FOCUS_LINE_ID);
	if (map.getSource(REGION_FOCUS_SOURCE_ID)) map.removeSource(REGION_FOCUS_SOURCE_ID);
}

const PADDING_DESKTOP = { top: 48, right: 72, bottom: 48, left: 340 } as const;
// Mobil liegt die Orts-Karte oben auf der Karte: Platz für ihre Höhe lassen.
const PADDING_MOBILE = { top: 240, right: 56, bottom: 48, left: 24 } as const;
const MAX_FOCUS_ZOOM = 16;

type Padding = { top: number; right: number; bottom: number; left: number };
const MAX_PADDING_SHARE = 0.4;

/** Deckelt die Summe je Achse auf 40 % der Containergröße, sonst bewegt fitBounds nichts. */
function capPadding(padding: Padding, container?: { width: number; height: number }): Padding {
	if (!container || container.width <= 0 || container.height <= 0) return padding;
	const vertical = padding.top + padding.bottom;
	const horizontal = padding.left + padding.right;
	const vScale = Math.min(1, (container.height * MAX_PADDING_SHARE) / vertical);
	const hScale = Math.min(1, (container.width * MAX_PADDING_SHARE) / horizontal);
	return {
		top: Math.floor(padding.top * vScale),
		bottom: Math.floor(padding.bottom * vScale),
		left: Math.floor(padding.left * hScale),
		right: Math.floor(padding.right * hScale)
	};
}

/** Zoomt auf den ganzen Ort mit Rand; ohne Animation bei reduced motion. */
export function fitRegionFocus(
	map: RegionFocusMapLike,
	bbox: Bbox,
	options: {
		mobile: boolean;
		reducedMotion: boolean;
		container?: { width: number; height: number };
	}
): void {
	const base: Padding = { ...(options.mobile ? PADDING_MOBILE : PADDING_DESKTOP) };
	map.fitBounds(
		[
			[bbox[0], bbox[1]],
			[bbox[2], bbox[3]]
		],
		{
			padding: capPadding(base, options.container),
			animate: !options.reducedMotion,
			maxZoom: MAX_FOCUS_ZOOM
		}
	);
}
