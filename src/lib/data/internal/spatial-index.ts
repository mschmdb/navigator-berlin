import RBush from 'rbush';
import bbox from '@turf/bbox';
import type { Feature, FeatureCollection } from 'geojson';
import { fetchLayer } from './layer-fetch.js';

export interface IndexedFeature {
	minX: number;
	minY: number;
	maxX: number;
	maxY: number;
	featureIndex: number;
}

export class FeatureIndex extends RBush<IndexedFeature> {}

export function buildIndex(fc: FeatureCollection): FeatureIndex {
	const idx = new FeatureIndex();
	const items: IndexedFeature[] = fc.features.map((feature: Feature, featureIndex: number) => {
		const [minX, minY, maxX, maxY] = bbox(feature);
		return { minX, minY, maxX, maxY, featureIndex };
	});
	idx.load(items);
	return idx;
}

const indexCache = new Map<string, FeatureIndex>();

export function _resetIndexCache(): void {
	indexCache.clear();
}

export async function getIndex(
	filename: string,
	fetchFn: typeof fetch = fetch
): Promise<FeatureIndex> {
	const hit = indexCache.get(filename);
	if (hit) return hit;
	const fc = await fetchLayer(filename, fetchFn);
	const idx = buildIndex(fc);
	indexCache.set(filename, idx);
	return idx;
}
