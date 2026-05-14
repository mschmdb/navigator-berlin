export const MAX_WALKING_DISTANCE_M = 600;
export const WALKING_SPEED_M_PER_MIN = 80;
export const DETOUR_FACTOR = 1.3;

const EARTH_RADIUS_M = 6_371_000;

function toRad(deg: number): number {
	return (deg * Math.PI) / 180;
}

function haversineM(lat1: number, lng1: number, lat2: number, lng2: number): number {
	const dLat = toRad(lat2 - lat1);
	const dLng = toRad(lng2 - lng1);
	const a =
		Math.sin(dLat / 2) ** 2 +
		Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
	return 2 * EARTH_RADIUS_M * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function walkingDistanceM(
	lat1: number,
	lng1: number,
	lat2: number,
	lng2: number
): number {
	return Math.round(haversineM(lat1, lng1, lat2, lng2) * DETOUR_FACTOR);
}

export function walkingTimeMin(meters: number): number {
	if (meters <= 0) return 0;
	return Math.ceil(meters / WALKING_SPEED_M_PER_MIN);
}

export type WalkingSeverity = 'success' | 'success-soft' | 'warning';

export function walkingSeverity(meters: number): WalkingSeverity {
	if (meters <= 300) return 'success';
	if (meters <= 500) return 'success-soft';
	return 'warning';
}
