/**
 * Tool `list_layers_at_point`: schlanke Discovery-Variante von
 * `cross_layer_query`. Liefert pro Layer nur den Slug und ob ein
 * konkreter Wert vorliegt. Reason wird mitgeschickt (no-coverage,
 * outdated etc.) damit der Agent weiß, warum kein Wert da ist.
 */

import * as v from 'valibot';
import {
	PointInputSchema,
	POINT_INPUT_JSON_SCHEMA,
	LAYER_SLUG_LIST_JSON_SCHEMA
} from '../internal/schemas.js';
import type { WebMcpToolDefinition } from '../internal/tool-types.js';
import type { JsonObject } from '../internal/json-types.js';
import type { LayerHit } from '$lib/data';

export interface ListLayersAtPointDeps {
	readonly getLayersAtPoint: (lat: number, lng: number) => Promise<LayerHit[]>;
}

function summarize(hit: LayerHit): JsonObject {
	const hasValue = hit.value !== null && hit.value !== undefined;
	return {
		layer: hit.layer,
		has_value: hasValue,
		reason: hit.reason ?? null
	};
}

export function createListLayersAtPointTool(
	deps: ListLayersAtPointDeps
): WebMcpToolDefinition {
	return {
		name: 'list_layers_at_point',
		description:
			'Lightweight discovery: list which Berlin data layers cover a given point. Returns layer slug, has_value flag, and reason (no-coverage, outdated, seasonal). Use this to decide which deeper queries to run.',
		inputSchema: POINT_INPUT_JSON_SCHEMA,
		outputSchema: LAYER_SLUG_LIST_JSON_SCHEMA,
		handler: async (raw) => {
			const input = v.parse(PointInputSchema, raw);
			const hits = await deps.getLayersAtPoint(input.lat, input.lng);
			return hits.map(summarize);
		}
	};
}
