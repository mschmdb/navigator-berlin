import type { Feature, FeatureCollection, Point } from 'geojson';

/**
 * Story 15.3-15.5: Client-Index der kühlen Orte für die Inspector-Card (nächste Orte zum
 * Klickpunkt + Filter). Lädt das von Story 15.1 gebaute GeoJSON (statisch unter /data/).
 */
export interface KuehleOrt {
	id: string;
	name: string;
	cat: string;
	lat: number;
	lng: number;
	coolScore: number;
	acStatus: string;
	isFree: string;
	summerAvailable: string;
	address: string;
	website: string;
	googleMapsUrl: string;
	appleMapsUrl: string;
	openingHoursNote: string;
	/** Roher OSM-opening_hours-String für den Live-Status (Story 15.4). */
	openingHours: string;
}

type KuehleOrtProps = {
	id: string;
	name: string;
	cat: string;
	cool_score: number;
	ac_status: string;
	is_free: string;
	summer_available: string;
	address_verified: string;
	website: string;
	googleMapsUrl: string;
	appleMapsUrl: string;
	opening_hours_note: string;
	oh: string;
};

export function featureToKuehleOrt(feature: Feature<Point, KuehleOrtProps>): KuehleOrt {
	const [lng, lat] = feature.geometry.coordinates;
	const p = feature.properties;
	return {
		id: p.id,
		name: p.name,
		cat: p.cat,
		lat,
		lng,
		coolScore: p.cool_score,
		acStatus: p.ac_status,
		isFree: p.is_free,
		summerAvailable: p.summer_available,
		address: p.address_verified,
		website: p.website,
		googleMapsUrl: p.googleMapsUrl,
		appleMapsUrl: p.appleMapsUrl,
		openingHoursNote: p.opening_hours_note,
		openingHours: p.oh ?? ''
	};
}

let cache: KuehleOrt[] | null = null;
let inflight: Promise<KuehleOrt[]> | null = null;

export function _resetKuehleOrteIndexCache(): void {
	cache = null;
	inflight = null;
}

export async function getKuehleOrteIndex(fetchFn: typeof fetch = fetch): Promise<KuehleOrt[]> {
	if (cache) return cache;
	if (inflight) return inflight;
	inflight = (async () => {
		const res = await fetchFn('/data/kuehle-orte.geojson');
		if (!res.ok) {
			throw new Error(`Failed to load kuehle-orte index: HTTP ${res.status}`);
		}
		const fc = (await res.json()) as FeatureCollection<Point, KuehleOrtProps>;
		const data = fc.features.map(featureToKuehleOrt);
		cache = data;
		return data;
	})();
	try {
		return await inflight;
	} finally {
		inflight = null;
	}
}
