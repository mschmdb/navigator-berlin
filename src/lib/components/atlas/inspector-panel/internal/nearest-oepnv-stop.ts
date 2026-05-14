import { walkingDistanceM, walkingTimeMin, MAX_WALKING_DISTANCE_M } from '$lib/utils/oepnv-walking.js';
import type { OepnvStop, OepnvStopIndex } from '$lib/data';

export interface AddressPoint {
	lat: number;
	lng: number;
}

export interface NearestStop {
	name: string;
	lat: number;
	lng: number;
	distanceM: number;
	walkingMin: number;
	lines?: string[];
}

export type Modus = 'ubahn' | 'sbahn' | 'tram' | 'bus';

const LAT_DELTA = 0.0042 * 1.1;
const LNG_DELTA = 0.0066 * 1.1;

function withinBbox(addr: AddressPoint, stop: OepnvStop): boolean {
	return (
		Math.abs(stop.lat - addr.lat) < LAT_DELTA &&
		Math.abs(stop.lng - addr.lng) < LNG_DELTA
	);
}

export function findNearestStop(
	addr: AddressPoint,
	stops: readonly OepnvStop[],
	maxDistanceM: number = MAX_WALKING_DISTANCE_M
): NearestStop | null {
	let best: NearestStop | null = null;
	for (const stop of stops) {
		if (!withinBbox(addr, stop)) continue;
		const distanceM = walkingDistanceM(addr.lat, addr.lng, stop.lat, stop.lng);
		if (distanceM > maxDistanceM) continue;
		if (best && distanceM >= best.distanceM) continue;
		const candidate: NearestStop = {
			name: stop.name,
			lat: stop.lat,
			lng: stop.lng,
			distanceM,
			walkingMin: walkingTimeMin(distanceM)
		};
		if (stop.lines) candidate.lines = stop.lines;
		best = candidate;
	}
	return best;
}

export function findAllNearestStops(
	addr: AddressPoint,
	index: OepnvStopIndex,
	maxDistanceM: number = MAX_WALKING_DISTANCE_M
): Record<Modus, NearestStop | null> {
	return {
		ubahn: findNearestStop(addr, index.ubahn, maxDistanceM),
		sbahn: findNearestStop(addr, index.sbahn, maxDistanceM),
		tram: findNearestStop(addr, index.tram, maxDistanceM),
		bus: findNearestStop(addr, index.bus, maxDistanceM)
	};
}
