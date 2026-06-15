import * as v from 'valibot';
import type { FeatureCollection } from 'geojson';
import { hashedFilename, sha256Hex } from './hash.js';
import type { GeometryType, LayerEntry, LayerFormat, Manifest, SourceConfig } from './types.js';

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
	'F: Mobilität',
	'G: Kiez-Score',
	'H: Wahldaten',
	'I: Demografie',
	'J: Kultur'
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

const FormatSchema = v.picklist(['geojson', 'pmtiles']);

const LayerEntrySchema = v.object({
	slug: v.pipe(v.string(), v.minLength(1)),
	filename: v.pipe(v.string(), v.regex(/^[a-z0-9-]+\.[0-9a-f]{8}\.(geojson|pmtiles)$/)),
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
	inspectorRelevant: v.optional(v.boolean()),
	format: v.optional(FormatSchema),
	nearestPolygonFallbackKm: v.optional(v.pipe(v.number(), v.minValue(0), v.maxValue(1))),
	coverageBbox: v.optional(
		v.pipe(
			v.tuple([v.number(), v.number(), v.number(), v.number()]),
			v.check(
				([minLng, minLat, maxLng, maxLat]) => minLng < maxLng && minLat < maxLat,
				'coverageBbox must have minLng<maxLng and minLat<maxLat'
			)
		)
	),
	mapRelevant: v.optional(v.boolean())
});

const ManifestValibot = v.object({
	schemaVersion: v.literal(1),
	generatedAt: v.pipe(v.string(), v.isoTimestamp()),
	layers: v.array(LayerEntrySchema)
});

export const ManifestSchema = {
	parse: (input: unknown): Manifest => v.parse(ManifestValibot, input) as Manifest
};

export function validateManifest(m: Manifest): void {
	v.parse(ManifestValibot, m);
}

function detectGeometryType(buf: Buffer): GeometryType {
	try {
		const fc = JSON.parse(buf.toString('utf-8')) as FeatureCollection;
		const first = fc.features?.[0]?.geometry;
		if (
			first &&
			(first.type === 'Point' ||
				first.type === 'Polygon' ||
				first.type === 'MultiPolygon' ||
				first.type === 'LineString')
		) {
			return first.type;
		}
	} catch {
		// fall through
	}
	return 'Point';
}

function featureCount(buf: Buffer): number {
	try {
		const fc = JSON.parse(buf.toString('utf-8')) as FeatureCollection;
		return fc.features?.length ?? 0;
	} catch {
		return 0;
	}
}

export interface BuildLayerEntryOverrides {
	/** Override für binäre Layer (PMTiles), bei denen detectGeometryType auf Bytes nicht greift. */
	geometryType?: GeometryType;
	/** Override aus pre-binary GeoJSON-Phase. */
	featureCount?: number;
	/** Forced format, sonst aus source.format abgeleitet. */
	format?: LayerFormat;
}

export function buildLayerEntry(
	source: SourceConfig,
	content: Buffer,
	fetchedAt: string,
	overrides: BuildLayerEntryOverrides = {}
): LayerEntry {
	const format = overrides.format ?? source.format ?? 'geojson';
	const ext = format === 'pmtiles' ? 'pmtiles' : 'geojson';
	const filename = hashedFilename(source.slug, content, ext);
	const entry: LayerEntry = {
		slug: source.slug,
		filename,
		sourceUrl: source.sourceUrl,
		fetchedAt,
		license: source.license,
		sha256: sha256Hex(content),
		bundleGroup: source.bundleGroup,
		zoomThresholds: source.zoomThresholds,
		geometryType: overrides.geometryType ?? detectGeometryType(content),
		featureCount: overrides.featureCount ?? featureCount(content)
	};
	if (source.seasonality) entry.seasonality = source.seasonality;
	if (source.sourceUpdatedAt) entry.sourceUpdatedAt = source.sourceUpdatedAt;
	if (source.inspectorRelevant === false) entry.inspectorRelevant = false;
	if (format !== 'geojson') entry.format = format;
	if (typeof source.nearestPolygonFallbackKm === 'number') {
		entry.nearestPolygonFallbackKm = source.nearestPolygonFallbackKm;
	}
	if (source.coverageBbox) {
		entry.coverageBbox = source.coverageBbox;
	}
	if (source.mapRelevant === false) {
		entry.mapRelevant = false;
	}
	return entry;
}

export function buildManifest(entries: LayerEntry[], generatedAt: string): Manifest {
	return {
		schemaVersion: 1,
		generatedAt,
		layers: entries
	};
}
