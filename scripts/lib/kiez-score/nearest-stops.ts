// Pure Build-Time-Variante von src/lib/components/atlas/inspector-panel/internal/nearest-oepnv-stop.ts.
// Wir replizieren die Funktion lokal damit das scripts/-Layer keinen $lib-Alias auflösen muss.
// Konstanten sind synchron mit src/lib/utils/oepnv-walking.ts.

import type { Modus, NearestStopLike } from './types.js';

export interface OepnvStop {
	name: string;
	lat: number;
	lng: number;
	lines?: string[];
}

export interface OepnvStopIndexShape {
	ubahn: OepnvStop[];
	sbahn: OepnvStop[];
	tram: OepnvStop[];
	bus: OepnvStop[];
}

export interface BuildAddressPoint {
	lat: number;
	lng: number;
}

const DETOUR_FACTOR = 1.3;
const MAX_WALKING_DISTANCE_M = 1500;
const EARTH_RADIUS_M = 6_371_000;
const METERS_PER_DEG_LAT = 111_000;
const METERS_PER_DEG_LNG_BERLIN = 67_900;
const BBOX_BUFFER = 1.1;

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

function walkingDistanceM(lat1: number, lng1: number, lat2: number, lng2: number): number {
	return Math.round(haversineM(lat1, lng1, lat2, lng2) * DETOUR_FACTOR);
}

function bboxDeltas(maxDistanceM: number): { lat: number; lng: number } {
	const crowFlightM = maxDistanceM / DETOUR_FACTOR;
	return {
		lat: (crowFlightM / METERS_PER_DEG_LAT) * BBOX_BUFFER,
		lng: (crowFlightM / METERS_PER_DEG_LNG_BERLIN) * BBOX_BUFFER
	};
}

function findNearestStop(
	addr: BuildAddressPoint,
	stops: readonly OepnvStop[],
	maxDistanceM: number
): NearestStopLike | null {
	const deltas = bboxDeltas(maxDistanceM);
	let best: NearestStopLike | null = null;
	for (const stop of stops) {
		if (Math.abs(stop.lat - addr.lat) > deltas.lat) continue;
		if (Math.abs(stop.lng - addr.lng) > deltas.lng) continue;
		const distanceM = walkingDistanceM(addr.lat, addr.lng, stop.lat, stop.lng);
		if (distanceM > maxDistanceM) continue;
		if (best && distanceM >= best.distanceM) continue;
		best = { distanceM };
	}
	return best;
}

export function findAllNearestStopsForBuild(
	addr: BuildAddressPoint,
	index: OepnvStopIndexShape,
	maxDistanceM: number = MAX_WALKING_DISTANCE_M
): Record<Modus, NearestStopLike | null> {
	return {
		ubahn: findNearestStop(addr, index.ubahn, maxDistanceM),
		sbahn: findNearestStop(addr, index.sbahn, maxDistanceM),
		tram: findNearestStop(addr, index.tram, maxDistanceM),
		bus: findNearestStop(addr, index.bus, maxDistanceM)
	};
}
