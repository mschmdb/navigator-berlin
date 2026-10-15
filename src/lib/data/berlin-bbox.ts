import type { BboxTuple } from '$lib/seo/dataset-helpers.js';

interface FeatureCollectionLike {
	readonly features: ReadonlyArray<{
		readonly geometry?: { readonly coordinates?: unknown } | null;
	}>;
}

/** Bounding Box über alle Koordinaten einer FeatureCollection, `null` ohne Koordinaten. */
export function computeGeoJsonBbox(fc: FeatureCollectionLike): BboxTuple | null {
	let minLng = Infinity;
	let minLat = Infinity;
	let maxLng = -Infinity;
	let maxLat = -Infinity;

	const visit = (node: unknown): void => {
		if (!Array.isArray(node)) return;
		if (node.length >= 2 && typeof node[0] === 'number' && typeof node[1] === 'number') {
			const [lng, lat] = node as [number, number];
			if (lng < minLng) minLng = lng;
			if (lng > maxLng) maxLng = lng;
			if (lat < minLat) minLat = lat;
			if (lat > maxLat) maxLat = lat;
			return;
		}
		for (const child of node) visit(child);
	};

	for (const feature of fc.features) visit(feature.geometry?.coordinates);
	return Number.isFinite(minLng) ? [minLng, minLat, maxLng, maxLat] : null;
}
