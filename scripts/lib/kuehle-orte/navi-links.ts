/**
 * Navi-Deep-Links pro Ort (FR4, #84). Reines Modul, kein I/O.
 * Mit Name: Google bekommt ein Textziel (`Name, Straße Nr, PLZ Berlin`), Apple
 * `place?coordinate=lat,lon&name=Name`. Ohne Name: Koordinaten (lat,lon, NICHT die
 * GeoJSON-Reihenfolge lon,lat), unverändert ohne Rundung.
 */
export interface NaviLinks {
	googleMapsUrl: string;
	appleMapsUrl: string;
}

export interface NaviPlaceInfo {
	name?: string;
	street?: string;
	plz?: string;
}

const GOOGLE_BASE = 'https://www.google.com/maps/dir/?api=1&destination=';
const APPLE_BASE = 'https://maps.apple.com/place?coordinate=';

const clean = (value: string | undefined): string =>
	(value ?? '').replace(/,/g, ' ').replace(/\s+/g, ' ').trim();

/** Ein Textziel gibt es nur mit PLZ. Eine Straße zählt nur mit mindestens einem Buchstaben. */
export function buildNaviLinks(lat: number, lon: number, info: NaviPlaceInfo = {}): NaviLinks {
	const coords = `${lat},${lon}`;
	const name = clean(info.name);
	const plz = clean(info.plz);
	const appleMapsUrl = name
		? `${APPLE_BASE}${coords}&name=${encodeURIComponent(name)}`
		: `${APPLE_BASE}${coords}`;
	if (!name || !plz) return { googleMapsUrl: `${GOOGLE_BASE}${coords}`, appleMapsUrl };
	const street = clean(info.street);
	const target = [name, /\p{L}/u.test(street) ? street : '', `${plz} Berlin`]
		.filter(Boolean)
		.join(', ');
	return { googleMapsUrl: `${GOOGLE_BASE}${encodeURIComponent(target)}`, appleMapsUrl };
}
