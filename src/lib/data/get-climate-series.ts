import type { ClimateData } from './types.js';

const STATION_SLUGS: Record<string, string> = {
	'00403': 'dahlem',
	'00400': 'buch',
	'00433': 'tempelhof',
	'00427': 'brandenburg'
};

const cache = new Map<string, ClimateData>();

export function _resetClimateCache(): void {
	cache.clear();
}

export async function getClimateSeries(
	stationId: string,
	fetchFn: typeof fetch = fetch
): Promise<ClimateData> {
	const slug = STATION_SLUGS[stationId];
	if (!slug) throw new Error(`Unknown station ID: ${stationId}`);
	const hit = cache.get(stationId);
	if (hit) return hit;
	const url = `/climate/${slug}-${stationId}.json`;
	const res = await fetchFn(url);
	if (!res.ok) throw new Error(`Failed to load climate ${stationId}: HTTP ${res.status}`);
	const data = (await res.json()) as ClimateData;
	cache.set(stationId, data);
	return data;
}
