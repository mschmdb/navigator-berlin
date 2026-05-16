/**
 * Zentrale Valibot-Schemas + JSON-Schemas für die WebMCP-Tool-Boundary.
 *
 * Konvention:
 * - Valibot-Schemas dienen der Runtime-Validierung (Type-Guards).
 * - Korrespondierende JSON-Schemas werden ans Manifest geliefert (LLM-Audience).
 * - snake_case-Keys auf Tool-Boundary, camelCase intern.
 */

import * as v from 'valibot';

// ── Locale ────────────────────────────────────────────────────────────────
export const LocaleSchema = v.picklist(['de', 'en']);
export type LocaleParam = v.InferOutput<typeof LocaleSchema>;

// ── address_lookup ────────────────────────────────────────────────────────
export const AddressLookupInputSchema = v.object({
	query: v.pipe(v.string(), v.minLength(2), v.maxLength(120)),
	limit: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(20)))
});
export type AddressLookupInput = v.InferOutput<typeof AddressLookupInputSchema>;

export const AddressLookupOutputItemSchema = v.object({
	display_name: v.string(),
	lat: v.number(),
	lng: v.number(),
	bezirk: v.optional(v.string()),
	kiez: v.optional(v.string()),
	postcode: v.optional(v.string())
});
export const AddressLookupOutputSchema = v.array(AddressLookupOutputItemSchema);

// ── cross_layer_query + list_layers_at_point ──────────────────────────────
export const PointInputSchema = v.object({
	lat: v.pipe(v.number(), v.minValue(-90), v.maxValue(90)),
	lng: v.pipe(v.number(), v.minValue(-180), v.maxValue(180))
});
export type PointInput = v.InferOutput<typeof PointInputSchema>;

export const LayerHitOutputItemSchema = v.object({
	layer: v.string(),
	value: v.unknown(),
	source: v.string(),
	updated_at: v.string(),
	license: v.string(),
	reason: v.nullable(v.string())
});
export const LayerHitListSchema = v.array(LayerHitOutputItemSchema);

export const LayerSlugListSchema = v.array(
	v.object({
		layer: v.string(),
		has_value: v.boolean(),
		reason: v.nullable(v.string())
	})
);

// ── get_kiez_profile ──────────────────────────────────────────────────────
export const KiezProfileInputSchema = v.object({
	slug: v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
	locale: v.optional(LocaleSchema)
});
export type KiezProfileInput = v.InferOutput<typeof KiezProfileInputSchema>;

export const KiezProfileOutputSchema = v.object({
	name: v.string(),
	slug: v.string(),
	bezirk: v.string(),
	einwohner: v.number(),
	flaeche_ha: v.number(),
	centroid: v.tuple([v.number(), v.number()]),
	data_sources: v.array(
		v.object({
			layer: v.string(),
			source: v.string(),
			updated_at: v.string(),
			license: v.string()
		})
	)
});

// ── get_layer_metadata ────────────────────────────────────────────────────
export const LayerMetadataInputSchema = v.object({
	slug: v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
	locale: v.optional(LocaleSchema)
});
export type LayerMetadataInput = v.InferOutput<typeof LayerMetadataInputSchema>;

export const LayerMetadataOutputSchema = v.object({
	slug: v.string(),
	bundle: v.string(),
	geometry_type: v.string(),
	feature_count: v.number(),
	source_url: v.string(),
	updated_at: v.string(),
	license: v.string(),
	license_url: v.string(),
	methodology: v.nullable(
		v.object({
			summary: v.string(),
			aggregation_level: v.string(),
			source_layers: v.array(v.string())
		})
	)
});

// ── JSON-Schema-Spiegel für Manifest-Output ───────────────────────────────
// (Pure-JSON, kein Codegen — bewusst hand-pflegt, ohne valibot-Runtime-Conversion.)

export const ADDRESS_LOOKUP_INPUT_JSON_SCHEMA = {
	type: 'object',
	properties: {
		query: { type: 'string', minLength: 2, maxLength: 120 },
		limit: { type: 'integer', minimum: 1, maximum: 20 }
	},
	required: ['query'],
	additionalProperties: false
} as const;

export const ADDRESS_LOOKUP_OUTPUT_JSON_SCHEMA = {
	type: 'array',
	items: {
		type: 'object',
		properties: {
			display_name: { type: 'string' },
			lat: { type: 'number' },
			lng: { type: 'number' },
			bezirk: { type: 'string' },
			kiez: { type: 'string' },
			postcode: { type: 'string' }
		},
		required: ['display_name', 'lat', 'lng']
	}
} as const;

export const POINT_INPUT_JSON_SCHEMA = {
	type: 'object',
	properties: {
		lat: { type: 'number', minimum: -90, maximum: 90 },
		lng: { type: 'number', minimum: -180, maximum: 180 }
	},
	required: ['lat', 'lng'],
	additionalProperties: false
} as const;

export const LAYER_HIT_LIST_JSON_SCHEMA = {
	type: 'array',
	items: {
		type: 'object',
		properties: {
			layer: { type: 'string' },
			value: {},
			source: { type: 'string' },
			updated_at: { type: 'string' },
			license: { type: 'string' },
			reason: { type: ['string', 'null'] }
		},
		required: ['layer', 'value', 'source', 'updated_at', 'license']
	}
} as const;

export const LAYER_SLUG_LIST_JSON_SCHEMA = {
	type: 'array',
	items: {
		type: 'object',
		properties: {
			layer: { type: 'string' },
			has_value: { type: 'boolean' },
			reason: { type: ['string', 'null'] }
		},
		required: ['layer', 'has_value']
	}
} as const;

export const KIEZ_PROFILE_INPUT_JSON_SCHEMA = {
	type: 'object',
	properties: {
		slug: { type: 'string', minLength: 1, maxLength: 120 },
		locale: { type: 'string', enum: ['de', 'en'] }
	},
	required: ['slug'],
	additionalProperties: false
} as const;

export const KIEZ_PROFILE_OUTPUT_JSON_SCHEMA = {
	type: 'object',
	properties: {
		name: { type: 'string' },
		slug: { type: 'string' },
		bezirk: { type: 'string' },
		einwohner: { type: 'number' },
		flaeche_ha: { type: 'number' },
		centroid: {
			type: 'array',
			items: { type: 'number' },
			minItems: 2,
			maxItems: 2
		},
		data_sources: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					layer: { type: 'string' },
					source: { type: 'string' },
					updated_at: { type: 'string' },
					license: { type: 'string' }
				},
				required: ['layer', 'source', 'updated_at', 'license']
			}
		}
	},
	required: ['name', 'slug', 'bezirk', 'einwohner', 'flaeche_ha', 'centroid', 'data_sources']
} as const;

export const LAYER_METADATA_INPUT_JSON_SCHEMA = {
	type: 'object',
	properties: {
		slug: { type: 'string', minLength: 1, maxLength: 120 },
		locale: { type: 'string', enum: ['de', 'en'] }
	},
	required: ['slug'],
	additionalProperties: false
} as const;

export const LAYER_METADATA_OUTPUT_JSON_SCHEMA = {
	type: 'object',
	properties: {
		slug: { type: 'string' },
		bundle: { type: 'string' },
		geometry_type: { type: 'string' },
		feature_count: { type: 'number' },
		source_url: { type: 'string' },
		updated_at: { type: 'string' },
		license: { type: 'string' },
		license_url: { type: 'string' },
		methodology: {
			type: ['object', 'null'],
			properties: {
				summary: { type: 'string' },
				aggregation_level: { type: 'string' },
				source_layers: { type: 'array', items: { type: 'string' } }
			}
		}
	},
	required: [
		'slug',
		'bundle',
		'geometry_type',
		'feature_count',
		'source_url',
		'updated_at',
		'license',
		'license_url'
	]
} as const;
