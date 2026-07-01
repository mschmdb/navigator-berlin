import { LRUCache } from 'lru-cache';
import type { HeatLevel, HeatWarning } from '$lib/data/dwd-warnung.types.js';

/**
 * Story 16.2: Laufzeit-Proxy für die DWD-Hitzewarnlage (Berlin). Spiegelt das Geocode-Muster
 * (Timeout, LRU-Cache, try/catch-Degradation). Jeder Fehler wird zu `null`, nie geworfen, damit
 * die Landing-Page ohne DWD vollständig rendert. Quelle: DWD GeoServer WFS Warnungen_Gemeinden.
 */
const WFS_URL =
	'https://maps.dwd.de/geoserver/dwd/ows?service=WFS&version=2.0.0&request=GetFeature' +
	'&typeName=dwd:Warnungen_Gemeinden&outputFormat=application/json&CQL_FILTER=' +
	encodeURIComponent('EC_II IN(247,248)');
const SOURCE = 'Deutscher Wetterdienst (DWD)';
const SOURCE_URL = 'https://www.dwd.de/DE/wetter/warnungen/warnungen_node.html';
const TIMEOUT_MS = 5000;

// LRUCache erlaubt kein null als Value (muss `{}` sein). Sentinel für „geprüft, keine Warnung".
const NO_WARNING = Symbol('no-warning');
type CacheValue = HeatWarning | typeof NO_WARNING;
const cache = new LRUCache<string, CacheValue>({ max: 1, ttl: 1000 * 60 * 10 });
const CACHE_KEY = 'berlin-heat';

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
}

function isBerlin(name: unknown): boolean {
	return typeof name === 'string' && name.toLowerCase().includes('berlin');
}

/**
 * Reiner Parser (fixture-testbar): filtert Berlin-Hitzewarnungen aus der WFS-GeoJSON,
 * wählt die höchste Stufe. Liefert `null` bei fehlender Warnung oder unpassender Struktur.
 */
export function parseBerlinHeatWarning(data: unknown): HeatWarning | null {
	if (typeof data !== 'object' || data === null) return null;
	const features = (data as { features?: unknown }).features;
	if (!Array.isArray(features)) return null;

	let best: HeatWarning | null = null;
	for (const feat of features) {
		const props = (feat as { properties?: WarnFeatureProps } | null)?.properties;
		if (!props || !isBerlin(props.NAME)) continue;
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
	if (cached !== undefined) return cached === NO_WARNING ? null : cached;

	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
	try {
		const res = await fetchFn(WFS_URL, { signal: controller.signal });
		if (!res.ok) return null;
		const data: unknown = await res.json();
		const warning = parseBerlinHeatWarning(data);
		cache.set(CACHE_KEY, warning ?? NO_WARNING);
		return warning;
	} catch {
		return null;
	} finally {
		clearTimeout(timeout);
	}
}
