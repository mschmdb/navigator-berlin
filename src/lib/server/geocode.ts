import { LRUCache } from 'lru-cache';
import type { GeocodeSuggestion, Locale } from '$lib/data/types.js';
import { BERLIN_BBOX, isInBerlin } from '$lib/data/constants.js';
import { nominatimBucket } from './rate-limit.js';

const DEFAULT_ENDPOINT = 'https://nominatim.openstreetmap.org';
const USER_AGENT = 'navigator.berlin/1.0 (mailto:hey@navigator.berlin)';
const TIMEOUT_MS = 5000;
const MAX_RESULTS = 10;

const ADDRESSTYPE_PRIORITY: Record<string, number> = {
	house: 1,
	place: 2,
	suburb: 3,
	neighbourhood: 4,
	city_district: 5,
	postcode: 6,
	road: 7
};

const cache = new LRUCache<string, GeocodeSuggestion[]>({
	max: 1000,
	ttl: 1000 * 60 * 60 * 24
});

const REVERSE_MISS = Symbol('reverse-miss');
type ReverseCacheValue = GeocodeSuggestion | typeof REVERSE_MISS;
const reverseCache = new LRUCache<string, ReverseCacheValue>({
	max: 1000,
	ttl: 1000 * 60 * 60 * 24
});

export function _resetGeocodeCache(): void {
	cache.clear();
	reverseCache.clear();
	nominatimBucket._reset();
}

interface NominatimResult {
	place_id: number;
	osm_type: string;
	osm_id: number;
	lat: string;
	lon: string;
	type: string;
	addresstype: string;
	display_name: string;
	importance: number;
	address?: Record<string, string | undefined>;
	boundingbox?: [string, string, string, string];
}

function mapToSuggestion(r: NominatimResult): GeocodeSuggestion {
	const addr = r.address ?? {};
	const bbox: [number, number, number, number] | undefined = r.boundingbox
		? [
				parseFloat(r.boundingbox[2]),
				parseFloat(r.boundingbox[0]),
				parseFloat(r.boundingbox[3]),
				parseFloat(r.boundingbox[1])
			]
		: undefined;
	const out: GeocodeSuggestion = {
		id: `${r.osm_type}-${r.osm_id}`,
		displayName: r.display_name,
		lat: parseFloat(r.lat),
		lng: parseFloat(r.lon),
		type: r.type,
		addresstype: r.addresstype
	};
	if (addr.city_district) out.bezirk = addr.city_district;
	if (addr.suburb) out.kiez = addr.suburb;
	if (addr.postcode) out.postcode = addr.postcode;
	if (bbox) out.bbox = bbox;
	return out;
}

function getEndpoint(): string {
	const envEndpoint = typeof process !== 'undefined' ? process.env?.NOMINATIM_ENDPOINT : undefined;
	return envEndpoint ?? DEFAULT_ENDPOINT;
}

function buildUrl(q: string, lang: Locale): string {
	const url = new URL(`${getEndpoint()}/search`);
	url.searchParams.set('q', q);
	url.searchParams.set('format', 'jsonv2');
	url.searchParams.set('addressdetails', '1');
	url.searchParams.set('limit', String(MAX_RESULTS * 2));
	url.searchParams.set(
		'viewbox',
		`${BERLIN_BBOX.west},${BERLIN_BBOX.north},${BERLIN_BBOX.east},${BERLIN_BBOX.south}`
	);
	url.searchParams.set('bounded', '1');
	url.searchParams.set('accept-language', lang);
	return url.toString();
}

export async function proxyNominatim(
	q: string,
	lang: Locale = 'de',
	fetchFn: typeof fetch = fetch
): Promise<GeocodeSuggestion[]> {
	const key = `${q}|${lang}`;
	const hit = cache.get(key);
	if (hit) return hit;

	await nominatimBucket.take();

	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

	try {
		const res = await fetchFn(buildUrl(q, lang), {
			headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
			signal: controller.signal
		});
		if (!res.ok) throw new Error(`Nominatim HTTP ${res.status}`);
		const raw = (await res.json()) as NominatimResult[];

		const mapped = raw
			.map(mapToSuggestion)
			.filter((s) => isInBerlin(s.lat, s.lng))
			.sort((a, b) => {
				const pa = ADDRESSTYPE_PRIORITY[a.addresstype] ?? 99;
				const pb = ADDRESSTYPE_PRIORITY[b.addresstype] ?? 99;
				return pa - pb;
			})
			.slice(0, MAX_RESULTS);

		cache.set(key, mapped);
		return mapped;
	} finally {
		clearTimeout(timeout);
	}
}

function buildReverseUrl(lat: number, lng: number, lang: Locale): string {
	const url = new URL(`${getEndpoint()}/reverse`);
	url.searchParams.set('lat', lat.toFixed(4));
	url.searchParams.set('lon', lng.toFixed(4));
	url.searchParams.set('format', 'jsonv2');
	url.searchParams.set('addressdetails', '1');
	url.searchParams.set('zoom', '18');
	url.searchParams.set('accept-language', lang);
	return url.toString();
}

export async function reverseGeocode(
	lat: number,
	lng: number,
	lang: Locale = 'de',
	fetchFn: typeof fetch = fetch
): Promise<GeocodeSuggestion | null> {
	const key = `${lat.toFixed(5)}|${lng.toFixed(5)}|${lang}`;
	if (reverseCache.has(key)) {
		const cached = reverseCache.get(key);
		return cached === REVERSE_MISS ? null : (cached ?? null);
	}

	await nominatimBucket.take();

	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

	try {
		const res = await fetchFn(buildReverseUrl(lat, lng, lang), {
			headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
			signal: controller.signal
		});
		if (!res.ok) throw new Error(`Nominatim HTTP ${res.status}`);
		const raw = (await res.json()) as NominatimResult | { error: string };
		if ('error' in raw) {
			reverseCache.set(key, REVERSE_MISS);
			return null;
		}
		const suggestion = mapToSuggestion(raw);
		if (!isInBerlin(suggestion.lat, suggestion.lng)) {
			reverseCache.set(key, REVERSE_MISS);
			return null;
		}
		reverseCache.set(key, suggestion);
		return suggestion;
	} finally {
		clearTimeout(timeout);
	}
}
