import { LRUCache } from 'lru-cache';
import type { ColdEvent, ColdLevel, ColdWarning } from '$lib/data/dwd-warnung.types.js';
import {
	SOURCE,
	SOURCE_URL,
	TIMEOUT_MS,
	buildWfsUrl,
	isActiveToday,
	isBerlin,
	type WarnFeatureProps
} from './dwd-warnings.js';

/**
 * Issue #60: DWD-Kältewarnungen für Berlin (Frost, Glätte, Schnee) ab Stufe 2. Gleicher WFS-Dienst
 * wie die Hitzewarnung, nur mit Kälte-Codes. Event-Codes laut DWD „Übersicht verfügbarer
 * Warnnummern" (Stand 01.02.2024). Stufe 1 (22, 84, 70), Vorabinformationen und Tauwetter
 * (88/89) fehlen mit Absicht. Jeder Fehler wird zu einer leeren Liste, nie geworfen.
 */
interface ColdEventInfo {
	event: ColdEvent;
	level: ColdLevel;
	/** Gleichzeitige Codes derselben Familie zeigen wir nur einmal (höchste Stufe). */
	family: string;
}

const COLD_EVENTS: Record<number, ColdEventInfo> = {
	82: { event: 'strenger-frost', level: 2, family: 'frost' },
	87: { event: 'markante-glaette', level: 2, family: 'glaette' },
	85: { event: 'glatteis', level: 3, family: 'glatteis' },
	86: { event: 'extremes-glatteis', level: 4, family: 'glatteis' },
	71: { event: 'schneefall', level: 2, family: 'schneefall' },
	72: { event: 'starker-schneefall', level: 3, family: 'schneefall' },
	73: { event: 'extrem-starker-schneefall', level: 4, family: 'schneefall' },
	74: { event: 'schneeverwehung', level: 2, family: 'verwehung' },
	75: { event: 'starke-schneeverwehung', level: 3, family: 'verwehung' },
	76: { event: 'extrem-starke-schneeverwehung', level: 4, family: 'verwehung' }
};

export const COLD_EVENT_CODES: readonly number[] = Object.keys(COLD_EVENTS).map(Number);

const WFS_URL = buildWfsUrl([...COLD_EVENT_CODES].sort((a, b) => a - b));

// Sentinel für „DWD-Fetch fehlgeschlagen", kurz negativ gecacht (wie bei Hitze).
const FETCH_ERROR = Symbol('fetch-error');
// Roh-Features cachen und bei jedem Aufruf neu auswerten, damit abgelaufene Warnungen verschwinden.
type CacheValue = unknown[] | typeof FETCH_ERROR;
const cache = new LRUCache<string, CacheValue>({ max: 1, ttl: 1000 * 60 * 10 });
const CACHE_KEY = 'berlin-cold';
const ERROR_TTL_MS = 1000 * 30;

export function _resetDwdColdCache(): void {
	cache.clear();
}

export function ecToColdEvent(ec: number): ColdEventInfo | null {
	return COLD_EVENTS[ec] ?? null;
}

function featuresOf(data: unknown): unknown[] | null {
	if (typeof data !== 'object' || data === null) return null;
	const features = (data as { features?: unknown }).features;
	return Array.isArray(features) ? features : null;
}

/**
 * Reiner Parser (fixture-testbar): Berlin, heute aktiv, je Familie die höchste Stufe,
 * höchste Stufe zuerst.
 */
export function parseBerlinColdWarnings(data: unknown, now: Date = new Date()): ColdWarning[] {
	const features = featuresOf(data) ?? [];
	const byFamily = new Map<string, ColdWarning>();
	for (const feat of features) {
		const props = (feat as { properties?: WarnFeatureProps } | null)?.properties;
		if (!props || !isBerlin(props) || !isActiveToday(props, now)) continue;
		const info = ecToColdEvent(Number(props.EC_II));
		if (!info) continue;
		const known = byFamily.get(info.family);
		if (known && known.level >= info.level) continue;
		const headline = typeof props.HEADLINE === 'string' ? props.HEADLINE.trim() : '';
		byFamily.set(info.family, {
			event: info.event,
			level: info.level,
			headline: headline === '' ? null : headline,
			source: SOURCE,
			sourceUrl: SOURCE_URL
		});
	}
	return [...byFamily.values()].sort((a, b) => b.level - a.level);
}

export async function fetchBerlinColdWarnings(
	fetchFn: typeof fetch = fetch
): Promise<ColdWarning[]> {
	const cached = cache.get(CACHE_KEY);
	if (cached !== undefined) {
		return cached === FETCH_ERROR ? [] : parseBerlinColdWarnings({ features: cached });
	}

	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
	try {
		const res = await fetchFn(WFS_URL, { signal: controller.signal });
		if (!res.ok) {
			cache.set(CACHE_KEY, FETCH_ERROR, { ttl: ERROR_TTL_MS });
			return [];
		}
		const data: unknown = await res.json();
		const features = featuresOf(data);
		if (!features) {
			cache.set(CACHE_KEY, FETCH_ERROR, { ttl: ERROR_TTL_MS });
			return [];
		}
		cache.set(CACHE_KEY, features);
		return parseBerlinColdWarnings({ features });
	} catch {
		cache.set(CACHE_KEY, FETCH_ERROR, { ttl: ERROR_TTL_MS });
		return [];
	} finally {
		clearTimeout(timeout);
	}
}
