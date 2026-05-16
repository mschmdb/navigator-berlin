/**
 * Tool `address_lookup`: Berliner Adress-Suche via Geocode-Service.
 *
 * Delegiert ans Server-side `proxyNominatim` (über die Remote-Function-API).
 * Keine direkte Nominatim-Anbindung im Tool. snake_case-Boundary.
 */

import * as v from 'valibot';
import {
	AddressLookupInputSchema,
	ADDRESS_LOOKUP_INPUT_JSON_SCHEMA,
	ADDRESS_LOOKUP_OUTPUT_JSON_SCHEMA
} from '../internal/schemas.js';
import type { WebMcpToolDefinition } from '../internal/tool-types.js';
import type { JsonObject } from '../internal/json-types.js';
import type { GeocodeSuggestion } from '$lib/data';

export interface AddressLookupDeps {
	/** Function liefert Adress-Vorschläge (mind. 1, max. n). */
	readonly geocode: (query: string) => Promise<GeocodeSuggestion[]>;
}

const DEFAULT_LIMIT = 10;

function serializeSuggestion(s: GeocodeSuggestion): JsonObject {
	const out: JsonObject = {
		display_name: s.displayName,
		lat: s.lat,
		lng: s.lng
	};
	if (s.bezirk) out.bezirk = s.bezirk;
	if (s.kiez) out.kiez = s.kiez;
	if (s.postcode) out.postcode = s.postcode;
	return out;
}

export function createAddressLookupTool(deps: AddressLookupDeps): WebMcpToolDefinition {
	return {
		name: 'address_lookup',
		description:
			'Search Berlin addresses, streets, and POIs. Returns up to N candidates with coordinates and administrative context (Bezirk, Kiez, postcode). Backed by OSM Nominatim, biased to Berlin.',
		inputSchema: ADDRESS_LOOKUP_INPUT_JSON_SCHEMA,
		outputSchema: ADDRESS_LOOKUP_OUTPUT_JSON_SCHEMA,
		handler: async (raw) => {
			const input = v.parse(AddressLookupInputSchema, raw);
			const limit = input.limit ?? DEFAULT_LIMIT;
			const results = await deps.geocode(input.query);
			return results.slice(0, limit).map(serializeSuggestion);
		}
	};
}
