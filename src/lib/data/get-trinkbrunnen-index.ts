import type { Feature, FeatureCollection, Point } from 'geojson';
import distance from '@turf/distance';
import { point } from '@turf/helpers';
import { buildNaviLinks } from '$lib/utils/navi-links.js';

/**
 * Client-Index der Trinkbrunnen für die Hitze-Inspector-Card (nächster Brunnen + Navi).
 * OSM liefert keine Adresse, aber Koordinaten reichen für Google-/Apple-Maps-Deeplinks.
 * Die Trinkbrunnen-geojson ist gehasht, deshalb erst das MANIFEST auflösen.
 */
export interface Trinkbrunnen {
	id: string;
	name: string;
	lat: number;
	lng: number;
	kostenlos: boolean;
	bottle: boolean;
	wheelchair: 'yes' | 'limited' | 'no' | 'unknown';
	googleMapsUrl: string;
	appleMapsUrl: string;
}

export interface TrinkbrunnenMitDistanz extends Trinkbrunnen {
	distanceM: number;
}

type BrunnenProps = Record<string, unknown>;

function str(props: BrunnenProps, key: string): string | null {
	const v = props[key];
	return typeof v === 'string' && v.trim().length > 0 ? v.trim() : null;
}

export function featureToTrinkbrunnen(feature: Feature<Point, BrunnenProps>): Trinkbrunnen {
	const [lng, lat] = feature.geometry.coordinates;
	const p = feature.properties ?? {};
	const wcRaw = str(p, 'wheelchair');
	const wheelchair: Trinkbrunnen['wheelchair'] =
		wcRaw === 'yes' || wcRaw === 'limited' || wcRaw === 'no' ? wcRaw : 'unknown';
	const navi = buildNaviLinks(lat, lng);
	return {
		id: String(feature.id ?? str(p, 'osmId') ?? `${lat},${lng}`),
		name: str(p, 'name') ?? 'Trinkbrunnen',
		lat,
		lng,
		kostenlos: str(p, 'fee') === 'no',
		bottle: str(p, 'bottle') === 'yes',
		wheelchair,
		googleMapsUrl: navi.googleMapsUrl,
		appleMapsUrl: navi.appleMapsUrl
	};
}

export function findNearestTrinkbrunnen(
	from: { lat: number; lng: number },
	brunnen: readonly Trinkbrunnen[]
): TrinkbrunnenMitDistanz | null {
	if (brunnen.length === 0) return null;
	const origin = point([from.lng, from.lat]);
	let best: TrinkbrunnenMitDistanz | null = null;
	for (const b of brunnen) {
		const distanceM = Math.round(
			distance(origin, point([b.lng, b.lat]), { units: 'kilometers' }) * 1000
		);
		if (!best || distanceM < best.distanceM) best = { ...b, distanceM };
	}
	return best;
}

interface ManifestEntry {
	slug: string;
	filename: string;
}

let cache: Trinkbrunnen[] | null = null;
let inflight: Promise<Trinkbrunnen[]> | null = null;

export function _resetTrinkbrunnenIndexCache(): void {
	cache = null;
	inflight = null;
}

export async function getTrinkbrunnenIndex(fetchFn: typeof fetch = fetch): Promise<Trinkbrunnen[]> {
	if (cache) return cache;
	if (inflight) return inflight;
	inflight = (async () => {
		const manRes = await fetchFn('/layers/MANIFEST.json');
		if (!manRes.ok) throw new Error(`Failed to load MANIFEST: HTTP ${manRes.status}`);
		const manifest = (await manRes.json()) as { layers: ManifestEntry[] };
		const entry = manifest.layers.find((l) => l.slug === 'trinkbrunnen');
		if (!entry) throw new Error('trinkbrunnen not in MANIFEST');
		const res = await fetchFn(`/layers/${entry.filename}`);
		if (!res.ok) throw new Error(`Failed to load trinkbrunnen: HTTP ${res.status}`);
		const fc = (await res.json()) as FeatureCollection<Point, BrunnenProps>;
		const data = fc.features.map(featureToTrinkbrunnen);
		cache = data;
		return data;
	})();
	try {
		return await inflight;
	} finally {
		inflight = null;
	}
}
