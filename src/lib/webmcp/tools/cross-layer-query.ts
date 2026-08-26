/**
 * Tool `cross_layer_query`: alle Datenlayer an einem Punkt abfragen.
 *
 * Delegiert an `getLayersAtPoint(lat, lng)`. Liefert pro Layer-Hit zusätzlich
 * Provenance (source, updated_at, license, reason) für die LLM-Zitierbarkeit
 * (FR40).
 */

import * as v from 'valibot';
import {
	PointInputSchema,
	POINT_INPUT_JSON_SCHEMA,
	LAYER_HIT_LIST_JSON_SCHEMA
} from '../internal/schemas.js';
import type { WebMcpToolDefinition } from '../internal/tool-types.js';
import type { JsonObject, JsonValue } from '../internal/json-types.js';
import type { LayerHit } from '$lib/data';

export interface CrossLayerQueryDeps {
	readonly getLayersAtPoint: (lat: number, lng: number) => Promise<LayerHit[]>;
}

function serializeHit(hit: LayerHit): JsonObject {
	return {
		layer: hit.layer,
		value: hit.value as JsonValue,
		source: hit.source,
		updated_at: hit.updatedAt,
		license: hit.license,
		reason: hit.reason ?? null
	};
}

export function createCrossLayerQueryTool(deps: CrossLayerQueryDeps): WebMcpToolDefinition {
	return {
		name: 'cross_layer_query',
		description:
			'Query all configured Berlin data layers at a geographic point (lat, lng) and return one structured hit per layer with full provenance (source, updated_at, license, reason).',
		readOnly: true,
		inputSchema: POINT_INPUT_JSON_SCHEMA,
		outputSchema: LAYER_HIT_LIST_JSON_SCHEMA,
		handler: async (raw) => {
			const input = v.parse(PointInputSchema, raw);
			const hits = await deps.getLayersAtPoint(input.lat, input.lng);
			return hits.map(serializeHit);
		}
	};
}
