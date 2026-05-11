import distance from '@turf/distance';
import type { ClimateStation } from './types.js';

export const CLIMATE_STATIONS: ClimateStation[] = [
	{ id: '00403', name: 'Berlin-Dahlem', coordinates: [13.301, 52.4517], firstYear: 1719 },
	{ id: '00400', name: 'Berlin-Buch', coordinates: [13.503, 52.6306], firstYear: 1889 },
	{ id: '00433', name: 'Berlin-Tempelhof', coordinates: [13.4019, 52.4675], firstYear: 1919 },
	{ id: '00427', name: 'Brandenburg-Schoenefeld', coordinates: [13.5306, 52.3792], firstYear: 1957 }
];

export function getNearestClimateStation(lat: number, lng: number): ClimateStation {
	let best = CLIMATE_STATIONS[0];
	let bestDist = Infinity;
	for (const s of CLIMATE_STATIONS) {
		const d = distance(s.coordinates, [lng, lat], { units: 'kilometers' });
		if (d < bestDist) {
			bestDist = d;
			best = s;
		}
	}
	return best;
}
