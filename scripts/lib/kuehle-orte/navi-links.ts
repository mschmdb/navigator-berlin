/**
 * Story 15.1: Navi-Deep-Links pro kühlem Ort (FR4). Reines Modul, kein I/O.
 * Google nutzt `destination=lat,lon`, Apple `daddr=lat,lon`. Reihenfolge ist lat,lon
 * (NICHT die GeoJSON-Reihenfolge lon,lat). Koordinaten gehen unverändert ein, kein Runden.
 */
export interface NaviLinks {
	googleMapsUrl: string;
	appleMapsUrl: string;
}

export function buildNaviLinks(lat: number, lon: number): NaviLinks {
	const dest = `${lat},${lon}`;
	return {
		googleMapsUrl: `https://www.google.com/maps/dir/?api=1&destination=${dest}`,
		appleMapsUrl: `https://maps.apple.com/?daddr=${dest}`
	};
}
