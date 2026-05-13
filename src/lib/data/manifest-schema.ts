import * as v from 'valibot';
import type { Manifest } from './types.js';

const LicenseSchema = v.picklist([
	'dl-de/zero-2-0',
	'dl-de/by-2-0',
	'CC BY 4.0',
	'ODbL 1.0',
	'Geodatenzugangsgesetz'
]);

const BundleSchema = v.picklist([
	'A: Boundaries',
	'B: Wohn-Daten',
	'C: Umwelt',
	'D: Memorial',
	'E: Soziale Infrastruktur',
	'F: Mobilität'
]);

const GeometryTypeSchema = v.picklist(['Point', 'Polygon', 'MultiPolygon', 'LineString']);

const ZoomSchema = v.object({
	min: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(22)),
	max: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(22))
});

const SeasonalitySchema = v.object({
	from: v.pipe(v.string(), v.regex(/^\d{2}-\d{2}$/)),
	to: v.pipe(v.string(), v.regex(/^\d{2}-\d{2}$/))
});

const LayerMetadataSchema = v.object({
	slug: v.pipe(v.string(), v.regex(/^[a-z0-9-]+$/)),
	filename: v.pipe(v.string(), v.regex(/^[a-z0-9-]+\.[0-9a-f]{8}\.geojson$/)),
	sourceUrl: v.pipe(v.string(), v.url()),
	fetchedAt: v.pipe(v.string(), v.isoTimestamp()),
	sourceUpdatedAt: v.optional(v.pipe(v.string(), v.isoTimestamp())),
	license: LicenseSchema,
	sha256: v.pipe(v.string(), v.regex(/^[0-9a-f]{64}$/)),
	bundleGroup: BundleSchema,
	zoomThresholds: ZoomSchema,
	seasonality: v.optional(SeasonalitySchema),
	geometryType: GeometryTypeSchema,
	featureCount: v.pipe(v.number(), v.integer(), v.minValue(0)),
	inspectorRelevant: v.optional(v.boolean())
});

export const ManifestSchema = v.object({
	schemaVersion: v.literal(1),
	generatedAt: v.pipe(v.string(), v.isoTimestamp()),
	layers: v.array(LayerMetadataSchema)
});

export function validateManifest(input: unknown): Manifest {
	return v.parse(ManifestSchema, input) as Manifest;
}
