import type { Feature, FeatureCollection, Point } from 'geojson';

/**
 * Client-Index der warmen Orte für die Kälte-Seite (#62). Lädt das gebaute GeoJSON
 * (statisch unter /data/). Winter-Angaben bleiben `unknown`, wenn die Daten sie nicht belegen.
 */
export type Tristate = 'yes' | 'no' | 'unknown';
export type WinterOpen = 'yes' | 'limited' | 'no' | 'unknown';
export type EntryFee = 'free' | 'ticket' | 'unknown';

export interface WaermeOrt {
	id: string;
	name: string;
	/** Kategorie-Rohwert (deutsch, aus den Daten). */
	cat: string;
	lat: number;
	lng: number;
	winterOpen: WinterOpen;
	openingHoursNote: string;
	stayWithoutPurchase: Tristate;
	isFree: EntryFee;
	website: string;
	sourceUrl: string;
	/** Prüfdatum `YYYY-MM-DD`. */
	checkedAt: string;
	address: string;
	plz: string;
	/** Roher OSM-opening_hours-String, nur dieser speist den Live-Status. */
	openingHours: string;
	googleMapsUrl: string;
	appleMapsUrl: string;
}

export type WaermeOrtProps = {
	id: string;
	name: string;
	cat: string;
	winter_open?: string;
	opening_hours_note?: string;
	stay_without_purchase?: string;
	is_free?: string;
	website?: string;
	source_url?: string;
	checked_at?: string;
	addr?: string;
	plz?: string;
	oh?: string;
	googleMapsUrl: string;
	appleMapsUrl: string;
};

function oneOf<T extends string>(value: string | undefined, allowed: readonly T[], fallback: T): T {
	return allowed.find((a) => a === value) ?? fallback;
}

export function featureToWaermeOrt(feature: Feature<Point, WaermeOrtProps>): WaermeOrt {
	const [lng, lat] = feature.geometry.coordinates;
	const p = feature.properties;
	return {
		id: p.id,
		name: p.name,
		cat: p.cat,
		lat,
		lng,
		winterOpen: oneOf(p.winter_open, ['yes', 'limited', 'no'], 'unknown'),
		openingHoursNote: p.opening_hours_note ?? '',
		stayWithoutPurchase: oneOf(p.stay_without_purchase, ['yes', 'no'], 'unknown'),
		isFree: oneOf(p.is_free, ['free', 'ticket'], 'unknown'),
		website: p.website ?? '',
		sourceUrl: p.source_url ?? '',
		checkedAt: p.checked_at ?? '',
		address: p.addr ?? '',
		plz: p.plz ?? '',
		openingHours: p.oh ?? '',
		googleMapsUrl: p.googleMapsUrl,
		appleMapsUrl: p.appleMapsUrl
	};
}

function isValidFeature(f: unknown): f is Feature<Point, WaermeOrtProps> {
	if (typeof f !== 'object' || f === null) return false;
	const { geometry, properties } = f as Partial<Feature<Point, WaermeOrtProps>>;
	if (!geometry || geometry.type !== 'Point') return false;
	const [lng, lat] = geometry.coordinates ?? [];
	if (!Number.isFinite(lng) || !Number.isFinite(lat)) return false;
	return (
		typeof properties === 'object' &&
		properties !== null &&
		typeof properties.id === 'string' &&
		typeof properties.name === 'string'
	);
}

const FETCH_TIMEOUT_MS = 15_000;

let cache: WaermeOrt[] | null = null;
let inflight: Promise<WaermeOrt[]> | null = null;

export async function getWaermeOrteIndex(fetchFn: typeof fetch = fetch): Promise<WaermeOrt[]> {
	if (cache) return cache;
	if (inflight) return inflight;
	inflight = (async () => {
		const res = await fetchFn('/data/waerme-orte.geojson', {
			signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
		});
		if (!res.ok) {
			throw new Error(`Failed to load waerme-orte index: HTTP ${res.status}`);
		}
		const fc = (await res.json()) as Partial<FeatureCollection<Point, WaermeOrtProps>>;
		if (!Array.isArray(fc.features)) {
			throw new Error('Invalid waerme-orte index: features missing');
		}
		const data = (fc.features as unknown[]).filter(isValidFeature).map(featureToWaermeOrt);
		cache = data;
		return data;
	})();
	try {
		return await inflight;
	} finally {
		inflight = null;
	}
}

/** Nur für Tests: leert Cache und laufende Anfrage. */
export function _resetWaermeOrteIndexForTests(): void {
	cache = null;
	inflight = null;
}
