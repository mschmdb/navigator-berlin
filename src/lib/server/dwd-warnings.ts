import { LRUCache } from 'lru-cache';
import type { HeatLevel, HeatWarning } from '$lib/data/dwd-warnung.types.js';

/**
 * Story 16.2: Laufzeit-Proxy für die DWD-Hitzewarnlage (Berlin). Spiegelt das Geocode-Muster
 * (Timeout, LRU-Cache, try/catch-Degradation). Jeder Fehler wird zu `null`, nie geworfen, damit
 * die Landing-Page ohne DWD vollständig rendert. Quelle: DWD GeoServer WFS Warnungen_Gemeinden.
 */
// Warnzellen laut DWD-Warncell-Register: 811000000 = Gemeinde "Stadt Berlin",
// 111000000 = Land Berlin. Namens-Substring reicht nicht (Überlingen, Berlingen,
// Berlingerode enthalten alle "berlin").
const BERLIN_WARNCELL_IDS = new Set([811000000, 111000000]);
const BERLIN_NAMES = new Set(['berlin', 'stadt berlin']);
const WFS_URL =
	'https://maps.dwd.de/geoserver/dwd/ows?service=WFS&version=2.0.0&request=GetFeature' +
	'&typeName=dwd:Warnungen_Gemeinden&outputFormat=application/json&CQL_FILTER=' +
	encodeURIComponent('EC_II IN(247,248) AND WARNCELLID IN(811000000,111000000)');
const SOURCE = 'Deutscher Wetterdienst (DWD)';
// Stabiler Kurzlink, leitet auf die jeweils aktuelle Warnseite um. Der frühere tiefe
// Pfad (…/wetter/warnungen/warnungen_node.html) liefert seit dem DWD-Umbau 404.
const SOURCE_URL = 'https://www.dwd.de/warnungen';
const TIMEOUT_MS = 5000;

// LRUCache erlaubt kein null als Value (muss `{}` sein). Sentinel für „geprüft, keine Warnung".
const NO_WARNING = Symbol('no-warning');
// Sentinel für „DWD-Fetch fehlgeschlagen". Kurz negativ cachen, damit ein DWD-Ausfall im
// Traffic-Peak nicht jeden /hitze-Request 5s blockiert und erneut auf DWD einschlägt.
const FETCH_ERROR = Symbol('fetch-error');
type CacheValue = HeatWarning | typeof NO_WARNING | typeof FETCH_ERROR;
const cache = new LRUCache<string, CacheValue>({ max: 1, ttl: 1000 * 60 * 10 });
const CACHE_KEY = 'berlin-heat';
const ERROR_TTL_MS = 1000 * 30;

export function _resetDwdCache(): void {
	cache.clear();
}

export function ecToLevel(ec: number): HeatLevel | null {
	if (ec === 248) return 'extrem';
	if (ec === 247) return 'stark';
	return null;
}

export function levelLabel(level: HeatLevel): string {
	return level === 'extrem' ? 'Extreme Hitze' : 'Starke Hitze';
}

const LEVEL_RANK: Record<HeatLevel, number> = { stark: 1, extrem: 2 };

interface WarnFeatureProps {
	NAME?: unknown;
	EC_II?: unknown;
	HEADLINE?: unknown;
	WARNCELLID?: unknown;
	ONSET?: unknown;
	EXPIRES?: unknown;
}

function isBerlin(props: WarnFeatureProps): boolean {
	const cell = Number(props.WARNCELLID);
	if (Number.isFinite(cell) && cell > 0) return BERLIN_WARNCELL_IDS.has(cell);
	// Fallback ohne Warnzellen-ID (z.B. ältere Fixtures): exakter Name, kein Substring.
	return typeof props.NAME === 'string' && BERLIN_NAMES.has(props.NAME.toLowerCase());
}

const BERLIN_DAY = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin' });

/**
 * Gültigkeitsfenster: Warnungen zeigen wir, sobald ihr ONSET am heutigen Berliner
 * Kalendertag liegt (auch wenn er erst mittags beginnt), aber nicht für Folgetage.
 * Abgelaufene Warnungen (EXPIRES <= now) fallen raus. Ohne Zeitfelder: anzeigen.
 */
function isActiveToday(props: WarnFeatureProps, now: Date): boolean {
	if (typeof props.EXPIRES === 'string') {
		const expires = new Date(props.EXPIRES);
		if (!Number.isNaN(expires.getTime()) && expires.getTime() <= now.getTime()) return false;
	}
	if (typeof props.ONSET === 'string') {
		const onset = new Date(props.ONSET);
		if (!Number.isNaN(onset.getTime()) && BERLIN_DAY.format(onset) > BERLIN_DAY.format(now)) {
			return false;
		}
	}
	return true;
}

/**
 * Reiner Parser (fixture-testbar): filtert Berlin-Hitzewarnungen aus der WFS-GeoJSON,
 * wählt die höchste Stufe. Liefert `null` bei fehlender Warnung oder unpassender Struktur.
 */
export function parseBerlinHeatWarning(data: unknown, now: Date = new Date()): HeatWarning | null {
	if (typeof data !== 'object' || data === null) return null;
	const features = (data as { features?: unknown }).features;
	if (!Array.isArray(features)) return null;

	let best: HeatWarning | null = null;
	for (const feat of features) {
		const props = (feat as { properties?: WarnFeatureProps } | null)?.properties;
		if (!props || !isBerlin(props) || !isActiveToday(props, now)) continue;
		const level = ecToLevel(Number(props.EC_II));
		if (!level) continue;
		if (best && LEVEL_RANK[level] <= LEVEL_RANK[best.level]) continue;
		best = {
			level,
			label: levelLabel(level),
			headline: typeof props.HEADLINE === 'string' ? props.HEADLINE : levelLabel(level),
			source: SOURCE,
			sourceUrl: SOURCE_URL
		};
	}
	return best;
}

export async function fetchBerlinHeatWarning(
	fetchFn: typeof fetch = fetch
): Promise<HeatWarning | null> {
	const cached = cache.get(CACHE_KEY);
	if (cached !== undefined) {
		return cached === NO_WARNING || cached === FETCH_ERROR ? null : cached;
	}

	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
	try {
		const res = await fetchFn(WFS_URL, { signal: controller.signal });
		if (!res.ok) {
			cache.set(CACHE_KEY, FETCH_ERROR, { ttl: ERROR_TTL_MS });
			return null;
		}
		const data: unknown = await res.json();
		const warning = parseBerlinHeatWarning(data);
		cache.set(CACHE_KEY, warning ?? NO_WARNING);
		return warning;
	} catch {
		cache.set(CACHE_KEY, FETCH_ERROR, { ttl: ERROR_TTL_MS });
		return null;
	} finally {
		clearTimeout(timeout);
	}
}
