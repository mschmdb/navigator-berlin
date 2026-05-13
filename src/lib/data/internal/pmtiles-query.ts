/**
 * PMTiles-Inspector-Adapter. Statt `fetchLayer` + spatial-index nutzen wir
 * MapLibre's `queryRenderedFeatures` für Vector-Tile-Layer. Funktioniert nur
 * für gerenderte Tiles (Layer muss visible + im Viewport sein).
 */

export interface MapLibreLike {
	getLayer: (id: string) => unknown;
	project: (lngLat: [number, number]) => { x: number; y: number };
	queryRenderedFeatures: (
		bbox: [[number, number], [number, number]],
		opts: { layers: string[] }
	) => Array<{ properties?: Record<string, unknown> | null }>;
}

const DEFAULT_TOLERANCE_PX = 10;

export interface PmtilesQueryOptions {
	tolerancePx?: number;
}

export function queryPmtilesAt(
	map: MapLibreLike | null,
	layerId: string,
	lng: number,
	lat: number,
	opts: PmtilesQueryOptions = {}
): Record<string, unknown> | null {
	if (!map) return null;
	if (!map.getLayer(layerId)) return null;
	const tolerance = opts.tolerancePx ?? DEFAULT_TOLERANCE_PX;
	const pt = map.project([lng, lat]);
	const bbox: [[number, number], [number, number]] = [
		[pt.x - tolerance, pt.y - tolerance],
		[pt.x + tolerance, pt.y + tolerance]
	];
	const features = map.queryRenderedFeatures(bbox, { layers: [layerId] });
	if (!features || features.length === 0) return null;
	return features[0].properties ?? null;
}
