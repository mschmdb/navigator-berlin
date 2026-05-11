import { BERLIN_BBOX_ARRAY, BERLIN_CENTER, DEFAULT_ZOOM } from '$lib/data/constants.js';
import { parseViewport } from './url-state.js';

export interface InitialViewport {
	initialBbox: [number, number, number, number];
	initialCenter: [number, number];
	initialZoom: number;
}

export function viewportFromUrl(url: URL): InitialViewport {
	const parsed = parseViewport(url.searchParams);
	return {
		initialBbox: parsed.bbox ?? BERLIN_BBOX_ARRAY,
		initialCenter: parsed.center ?? BERLIN_CENTER,
		initialZoom: parsed.zoom ?? DEFAULT_ZOOM
	};
}
