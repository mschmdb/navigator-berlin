/**
 * Navi-Deep-Links aus Koordinaten (Runtime). Google nutzt `destination=lat,lon`,
 * Apple `daddr=lat,lon`. Reihenfolge lat,lon (NICHT die GeoJSON-Reihenfolge lon,lat).
 * Spiegelt scripts/lib/kuehle-orte/navi-links.ts für Layer ohne vorgebaute Links.
 */
export interface NaviLinks {
	readonly googleMapsUrl: string;
	readonly appleMapsUrl: string;
}

export function buildNaviLinks(lat: number, lng: number): NaviLinks {
	const dest = `${lat},${lng}`;
	return {
		googleMapsUrl: `https://www.google.com/maps/dir/?api=1&destination=${dest}`,
		appleMapsUrl: `https://maps.apple.com/?daddr=${dest}`
	};
}
