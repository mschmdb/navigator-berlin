import { describe, it, expect } from 'vitest';
import {
	findNearestStop,
	findAllNearestStops,
	findAllNearestStopsWithSoft,
	type AddressPoint
} from './nearest-oepnv-stop.js';
import { EXTENDED_WALKING_DISTANCE_M } from '$lib/utils/oepnv-walking.js';
import type { OepnvStop, OepnvStopIndex } from '$lib/data';

const FRANKFURTER_TOR: AddressPoint = { lat: 52.5159, lng: 13.4544 };

const UBAHN_FRANKFURTER_TOR: OepnvStop = {
	name: 'Frankfurter Tor',
	lat: 52.5159,
	lng: 13.4544
};
const UBAHN_FAR: OepnvStop = { name: 'Zoologischer Garten', lat: 52.5058, lng: 13.333 };

describe('findNearestStop', () => {
	it('returns nearest stop within max distance', () => {
		const stops: OepnvStop[] = [
			{ name: 'Far', lat: 52.51, lng: 13.46 },
			UBAHN_FRANKFURTER_TOR
		];
		const nearest = findNearestStop(FRANKFURTER_TOR, stops, 600);
		expect(nearest?.name).toBe('Frankfurter Tor');
		expect(nearest?.distanceM).toBe(0);
		expect(nearest?.walkingMin).toBe(0);
	});

	it('returns null if no stop within maxDistance', () => {
		const nearest = findNearestStop(FRANKFURTER_TOR, [UBAHN_FAR], 600);
		expect(nearest).toBeNull();
	});

	it('returns null on empty stops', () => {
		expect(findNearestStop(FRANKFURTER_TOR, [], 600)).toBeNull();
	});

	it('picks the closer of two stops with same name', () => {
		const stops: OepnvStop[] = [
			{ name: 'Stop', lat: 52.517, lng: 13.4544 }, // ~120m crow-flight → ~156m walking
			{ name: 'Stop', lat: 52.5165, lng: 13.4544 } // ~67m crow-flight → ~87m walking
		];
		const nearest = findNearestStop(FRANKFURTER_TOR, stops, 600);
		expect(nearest?.distanceM).toBeLessThan(100);
	});

	it('attaches lines if stop has them', () => {
		const stops: OepnvStop[] = [
			{ ...UBAHN_FRANKFURTER_TOR, lines: ['U5'] }
		];
		const nearest = findNearestStop(FRANKFURTER_TOR, stops, 600);
		expect(nearest?.lines).toEqual(['U5']);
	});

	it('bbox-pre-filter rejects stops far outside window without computing distance', () => {
		const far: OepnvStop = { name: 'Hamburg', lat: 53.55, lng: 9.99 };
		const nearest = findNearestStop(FRANKFURTER_TOR, [far], 600);
		expect(nearest).toBeNull();
	});

	it('handles 10k stops in under 50ms (perf smoke)', () => {
		const stops: OepnvStop[] = Array.from({ length: 10_000 }, (_, i) => ({
			name: `Stop ${i}`,
			lat: 52.5 + (i % 100) * 0.001,
			lng: 13.4 + Math.floor(i / 100) * 0.001
		}));
		const t0 = performance.now();
		findNearestStop({ lat: 52.55, lng: 13.45 }, stops, 600);
		const dur = performance.now() - t0;
		expect(dur).toBeLessThan(50);
	});
});

describe('findAllNearestStops', () => {
	const index: OepnvStopIndex = {
		ubahn: [UBAHN_FRANKFURTER_TOR],
		sbahn: [{ name: 'Ostkreuz', lat: 52.5031, lng: 13.4691 }],
		tram: [{ name: 'Boxhagener Straße', lat: 52.5104, lng: 13.4592 }],
		bus: [{ name: 'Petersburger Straße', lat: 52.516, lng: 13.4555 }]
	};

	it('returns one nearest per modus', () => {
		const result = findAllNearestStops(FRANKFURTER_TOR, index, 1500);
		expect(result.ubahn?.name).toBe('Frankfurter Tor');
		expect(result.bus?.name).toBe('Petersburger Straße');
	});

	it('null per modus when none within threshold', () => {
		const result = findAllNearestStops(FRANKFURTER_TOR, index, 100);
		expect(result.ubahn?.name).toBe('Frankfurter Tor'); // same coord
		expect(result.sbahn).toBeNull();
		expect(result.tram).toBeNull();
	});

	it('handles empty modus arrays', () => {
		const result = findAllNearestStops(FRANKFURTER_TOR, {
			ubahn: [],
			sbahn: [],
			tram: [],
			bus: []
		}, 600);
		expect(result.ubahn).toBeNull();
		expect(result.sbahn).toBeNull();
		expect(result.tram).toBeNull();
		expect(result.bus).toBeNull();
	});
});

describe('findNearestStop with soft-cutoff', () => {
	it('marks stop > softCutoff as soft', () => {
		const farStop: OepnvStop = {
			name: 'Karow',
			lat: 52.523,
			lng: 13.4544 // ~880m crow-flight from FT
		};
		const res = findNearestStop(FRANKFURTER_TOR, [farStop], 1500, 600);
		expect(res).not.toBeNull();
		expect(res?.soft).toBe(true);
		expect(res?.distanceM).toBeGreaterThan(600);
	});

	it('does not mark stop within softCutoff as soft', () => {
		const closeStop: OepnvStop = {
			name: 'Close',
			lat: 52.5165,
			lng: 13.4544
		};
		const res = findNearestStop(FRANKFURTER_TOR, [closeStop], 1500, 600);
		expect(res).not.toBeNull();
		expect(res?.soft).toBeFalsy();
	});

	it('returns null beyond hard max even with extended threshold', () => {
		const veryFar: OepnvStop = { name: 'Far', lat: 52.55, lng: 13.4544 };
		const res = findNearestStop(FRANKFURTER_TOR, [veryFar], 1500, 600);
		expect(res).toBeNull();
	});

	it('default softCutoff equals maxDistance (no soft flag set when not requested)', () => {
		const stops: OepnvStop[] = [{ name: 'X', lat: 52.5165, lng: 13.4544 }];
		const res = findNearestStop(FRANKFURTER_TOR, stops);
		expect(res?.soft).toBeFalsy();
	});
});

describe('findAllNearestStopsWithSoft', () => {
	const FAR_BUT_SOFT: OepnvStopIndex = {
		ubahn: [],
		sbahn: [{ name: 'Karow', lat: 52.523, lng: 13.4544 }], // ~880m → soft
		tram: [],
		bus: [{ name: 'Close', lat: 52.5165, lng: 13.4544 }] // ~85m → hard
	};

	it('marks far stops as soft, near stops as not soft', () => {
		const result = findAllNearestStopsWithSoft(FRANKFURTER_TOR, FAR_BUT_SOFT);
		expect(result.sbahn?.soft).toBe(true);
		expect(result.bus?.soft).toBeFalsy();
	});

	it('respects custom maxDistance + softCutoff', () => {
		const result = findAllNearestStopsWithSoft(FRANKFURTER_TOR, FAR_BUT_SOFT, {
			maxDistanceM: 1500,
			softCutoffM: 50
		});
		// Bus is ~87m walking → soft when cutoff = 50
		expect(result.bus?.soft).toBe(true);
	});

	it('returns null per modus when nothing in range', () => {
		const empty: OepnvStopIndex = { ubahn: [], sbahn: [], tram: [], bus: [] };
		const result = findAllNearestStopsWithSoft(FRANKFURTER_TOR, empty);
		expect(result.ubahn).toBeNull();
	});

	it('defaults to EXTENDED_WALKING_DISTANCE_M / MAX_WALKING_DISTANCE_M', () => {
		expect(EXTENDED_WALKING_DISTANCE_M).toBe(1500);
		// Sanity: a 700m stop is inside default extended range, marked soft
		const stop: OepnvStopIndex = {
			ubahn: [{ name: 'S', lat: 52.5208, lng: 13.4544 }], // ~545m crow → ~709m walking
			sbahn: [],
			tram: [],
			bus: []
		};
		const result = findAllNearestStopsWithSoft(FRANKFURTER_TOR, stop);
		expect(result.ubahn).not.toBeNull();
		expect(result.ubahn?.soft).toBe(true);
	});
});
