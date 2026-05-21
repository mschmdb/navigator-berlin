import type { Feature, FeatureCollection } from 'geojson';

/**
 * Konkateniert mehrere FeatureCollections zu einer. Genutzt für überschneidungsfreie
 * Partitions-Quellen (z.B. PET Siedlung + Straßenraum + Grünfläche, Story 10.9), die der
 * Datenanbieter garantiert disjunkt liefert. Kein Geometrie-Merge, keine Deduplizierung.
 */
export function mergeFeatureCollections(collections: FeatureCollection[]): FeatureCollection {
	const features: Feature[] = collections.flatMap((fc) => fc.features);
	return { type: 'FeatureCollection', features };
}
