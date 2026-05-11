const ZOOM_BY_TYPE: Record<string, number> = {
	house: 17,
	road: 16,
	suburb: 14,
	neighbourhood: 14,
	city_district: 12,
	postcode: 13,
	city: 11,
	state: 9
};

const DEFAULT_ZOOM_FOR_TYPE = 14;

export function matchZoomForType(addresstype: string): number {
	return ZOOM_BY_TYPE[addresstype] ?? DEFAULT_ZOOM_FOR_TYPE;
}
