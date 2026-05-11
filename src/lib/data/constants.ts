export const BERLIN_BBOX = {
	west: 13.0883,
	south: 52.3382,
	east: 13.7611,
	north: 52.6755
} as const;

export const BERLIN_BBOX_ARRAY: [number, number, number, number] = [
	BERLIN_BBOX.west,
	BERLIN_BBOX.south,
	BERLIN_BBOX.east,
	BERLIN_BBOX.north
];

export const BERLIN_CENTER: [number, number] = [13.405, 52.52];
export const DEFAULT_ZOOM = 10;

export function isInBerlin(lat: number, lng: number): boolean {
	return (
		lng >= BERLIN_BBOX.west &&
		lng <= BERLIN_BBOX.east &&
		lat >= BERLIN_BBOX.south &&
		lat <= BERLIN_BBOX.north
	);
}
