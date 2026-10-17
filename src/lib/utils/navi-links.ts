/**
 * Navi-Deep-Links aus Koordinaten (Runtime), nur für namenlose Orte (Trinkbrunnen).
 * Orte mit Namen bekommen ihre Links in der Pipeline (scripts/lib/kuehle-orte/navi-links.ts).
 * Google nutzt `destination=lat,lon`, Apple das Unified-Schema `place?coordinate=lat,lon`
 * statt `daddr`. Reihenfolge lat,lon (NICHT die GeoJSON-Reihenfolge lon,lat).
 * Quellen: https://developer.apple.com/forums/thread/784030
 * und https://developer.apple.com/documentation/mapkit/unified-map-urls
 */
export interface NaviLinks {
	readonly googleMapsUrl: string;
	readonly appleMapsUrl: string;
}

export function buildNaviLinks(lat: number, lng: number): NaviLinks {
	const dest = `${lat},${lng}`;
	return {
		googleMapsUrl: `https://www.google.com/maps/dir/?api=1&destination=${dest}`,
		appleMapsUrl: `https://maps.apple.com/place?coordinate=${dest}`
	};
}
