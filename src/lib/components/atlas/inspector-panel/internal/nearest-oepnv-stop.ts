import {
	walkingDistanceM,
	walkingTimeMin,
	MAX_WALKING_DISTANCE_M,
	EXTENDED_WALKING_DISTANCE_M,
	DETOUR_FACTOR
} from '$lib/utils/oepnv-walking.js';
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
	/** True when distance exceeds softCutoffM but is within maxDistanceM (Story 1.21). */
	soft?: boolean;
}

export type Modus = 'ubahn' | 'sbahn' | 'tram' | 'bus';

const METERS_PER_DEG_LAT = 111_000;
// At Berlin latitude (~52.5°N): 1° lng ≈ 67900 m.
const METERS_PER_DEG_LNG_BERLIN = 67_900;
const BBOX_BUFFER = 1.1;

function bboxDeltas(maxDistanceM: number): { lat: number; lng: number } {
	const crowFlightM = maxDistanceM / DETOUR_FACTOR;
	return {
		lat: (crowFlightM / METERS_PER_DEG_LAT) * BBOX_BUFFER,
		lng: (crowFlightM / METERS_PER_DEG_LNG_BERLIN) * BBOX_BUFFER
	};
}

function withinBbox(
	addr: AddressPoint,
	stop: OepnvStop,
	deltas: { lat: number; lng: number }
): boolean {
	return (
		Math.abs(stop.lat - addr.lat) < deltas.lat &&
		Math.abs(stop.lng - addr.lng) < deltas.lng
	);
}

export function findNearestStop(
	addr: AddressPoint,
	stops: readonly OepnvStop[],
	maxDistanceM: number = MAX_WALKING_DISTANCE_M,
	softCutoffM: number = maxDistanceM
): NearestStop | null {
	const deltas = bboxDeltas(maxDistanceM);
	let best: NearestStop | null = null;
	for (const stop of stops) {
		if (!withinBbox(addr, stop, deltas)) continue;
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
		if (distanceM > softCutoffM) candidate.soft = true;
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

export interface SoftCutoffOptions {
	maxDistanceM?: number;
	softCutoffM?: number;
}

export function findAllNearestStopsWithSoft(
	addr: AddressPoint,
	index: OepnvStopIndex,
	options: SoftCutoffOptions = {}
): Record<Modus, NearestStop | null> {
	const max = options.maxDistanceM ?? EXTENDED_WALKING_DISTANCE_M;
	const soft = options.softCutoffM ?? MAX_WALKING_DISTANCE_M;
	return {
		ubahn: findNearestStop(addr, index.ubahn, max, soft),
		sbahn: findNearestStop(addr, index.sbahn, max, soft),
		tram: findNearestStop(addr, index.tram, max, soft),
		bus: findNearestStop(addr, index.bus, max, soft)
	};
}
