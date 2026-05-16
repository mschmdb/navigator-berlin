/**
 * Tool `get_kiez_profile`: gibt das öffentliche Kiez-Profil (LOR-Bezirksregion)
 * für einen Slug zurück. Delegiert an `getKiezProfile` aus `$lib/data`.
 *
 * Geometrie wird absichtlich NICHT exportiert (zu schwergewichtig für LLM).
 * Stattdessen wird `centroid` + `data_sources` mit Provenance geliefert.
 */

import * as v from 'valibot';
import {
	KiezProfileInputSchema,
	KIEZ_PROFILE_INPUT_JSON_SCHEMA,
	KIEZ_PROFILE_OUTPUT_JSON_SCHEMA
} from '../internal/schemas.js';
import type { WebMcpToolDefinition } from '../internal/tool-types.js';
import type { JsonObject } from '../internal/json-types.js';
import type { KiezProfile, Locale } from '$lib/data';

export interface GetKiezProfileDeps {
	readonly getKiezProfile: (locale: Locale, slug: string) => Promise<KiezProfile>;
	readonly defaultLocale: () => Locale;
}

function serializeProfile(profile: KiezProfile): JsonObject {
	return {
		name: profile.name,
		slug: profile.slug,
		bezirk: profile.bezirk,
		einwohner: profile.einwohner,
		flaeche_ha: profile.flaecheHa,
		centroid: [profile.centroid[0], profile.centroid[1]],
		data_sources: profile.layerCoverage.map((hit) => ({
			layer: hit.layer,
			source: hit.source,
			updated_at: hit.updatedAt,
			license: hit.license
		}))
	};
}

export function createGetKiezProfileTool(
	deps: GetKiezProfileDeps
): WebMcpToolDefinition {
	return {
		name: 'get_kiez_profile',
		description:
			'Return the public profile of a Berlin Kiez (LOR Bezirksregion) by slug. Includes name, Bezirk, population, area, centroid, and a list of data sources with license + updated_at provenance.',
		inputSchema: KIEZ_PROFILE_INPUT_JSON_SCHEMA,
		outputSchema: KIEZ_PROFILE_OUTPUT_JSON_SCHEMA,
		handler: async (raw) => {
			const input = v.parse(KiezProfileInputSchema, raw);
			const locale: Locale = input.locale ?? deps.defaultLocale();
			const profile = await deps.getKiezProfile(locale, input.slug);
			return serializeProfile(profile);
		}
	};
}
