import { LRUCache } from 'lru-cache';
import { isInBerlin } from './constants.js';

export type LevelKey = 'stimmbezirk' | 'kiez' | 'bezirk' | 'berlin';

export type Top5Entry = {
	kurzname: string;
	vollname: string;
	farbeHex: string;
	stimmen: number;
	anteil: number;
};

export type LevelResults = {
	available: boolean;
	top5: Top5Entry[] | null;
	isBriefwahlAggregat?: boolean;
};

export type WahlListEntry = {
	id: number;
	jahr: number;
	typ: 'btw' | 'agh' | 'bvv';
	stimmtyp: 'erststimme' | 'zweitstimme' | 'einstimme';
	isRepeatElection: boolean;
	parentElectionId: number | null;
	sourceUrl: string;
	license: string;
};

export type WahlResultBundle = {
	wahl: WahlListEntry;
	uwbId: string | null;
	levels: Record<LevelKey, LevelResults>;
};

export type SparklineSeries = {
	typ: 'btw' | 'agh' | 'bvv';
	stimmtyp: 'erststimme' | 'zweitstimme' | 'einstimme';
	level: 'kiez';
	kiezSlug: string;
	points: Array<{ jahr: number; parteiKurzname: string; farbeHex: string; anteil: number }>;
};

export type WahlResultsAtPoint = {
	point: { lat: number; lng: number };
	location: { bezirkSlug: string | null; kiezSlug: string | null };
	wahlbezirks: Record<string, { uwbId: string; bezirkCode: string }>;
	wahlen: WahlResultBundle[];
	sparklines: SparklineSeries[];
};

const cache = new LRUCache<string, { value: WahlResultsAtPoint | null }>({ max: 50 });

export function _resetWahlResultsCache(): void {
	cache.clear();
}

export async function getWahlResultsAtPoint(
	lat: number,
	lng: number,
	fetchFn: typeof fetch = fetch
): Promise<WahlResultsAtPoint | null> {
	if (!isInBerlin(lat, lng)) return null;
	const key = `${lat.toFixed(6)},${lng.toFixed(6)}`;
	const hit = cache.get(key);
	if (hit !== undefined) return hit.value;

	try {
		const res = await fetchFn(`/api/wahl/results-at-point?lat=${lat}&lng=${lng}`);
		if (!res.ok) {
			cache.set(key, { value: null });
			return null;
		}
		const data = (await res.json()) as WahlResultsAtPoint;
		cache.set(key, { value: data });
		return data;
	} catch {
		cache.set(key, { value: null });
		return null;
	}
}
