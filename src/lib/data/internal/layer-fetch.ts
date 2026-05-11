import { LRUCache } from 'lru-cache';
import type { FeatureCollection } from 'geojson';

const cache = new LRUCache<string, FeatureCollection>({ max: 50 });

export function _resetLayerCache(): void {
	cache.clear();
}

export async function fetchLayer(
	filename: string,
	fetchFn: typeof fetch = fetch
): Promise<FeatureCollection> {
	const hit = cache.get(filename);
	if (hit) return hit;
	const res = await fetchFn(`/layers/${filename}`);
	if (!res.ok) throw new Error(`Failed to load layer ${filename}: HTTP ${res.status}`);
	const fc = (await res.json()) as FeatureCollection;
	cache.set(filename, fc);
	return fc;
}
