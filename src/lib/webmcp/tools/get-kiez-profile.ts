/**
 * Tool `get_kiez_profile`: gibt das öffentliche Kiez-Profil (LOR-Bezirksregion)
 * für einen Slug zurück. Delegiert an `getKiezProfile` aus `$lib/data`.
 *
 * Geometrie wird absichtlich NICHT exportiert (zu schwergewichtig für LLM).
 * Stattdessen wird `centroid` + `data_sources` mit Provenance geliefert.
 *
 * Nicht-existenter Slug: handler returnt `{ error: 'kiez_not_found', slug, hint }`
 * statt zu werfen (sonst zeigt die LLM-Extension nur „Tool was executed but the
 * invocation failed"). LLMs raten den Slug oft aus `plr_name` von
 * `cross_layer_query`, was eine Ebene tiefer als die Bezirksregion ist.
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

function isHttpErrorWithStatus(err: unknown, status: number): boolean {
	if (typeof err !== 'object' || err === null) return false;
	const candidate = err as { status?: unknown };
	return candidate.status === status;
}

export function createGetKiezProfileTool(deps: GetKiezProfileDeps): WebMcpToolDefinition {
	return {
		name: 'get_kiez_profile',
		description:
			'Return the public profile of a Berlin Kiez (LOR Bezirksregion) by slug. Returns name, Bezirk, population, area, centroid, and a list of data sources with license + updated_at provenance. The slug must match a Berlin LOR Bezirksregion (143 total), NOT the plr_name field from cross_layer_query (which is a finer Planungsraum). On unknown slug, returns { error: "kiez_not_found", slug, hint } instead of throwing.',
		inputSchema: KIEZ_PROFILE_INPUT_JSON_SCHEMA,
		outputSchema: KIEZ_PROFILE_OUTPUT_JSON_SCHEMA,
		handler: async (raw) => {
			const input = v.parse(KiezProfileInputSchema, raw);
			const locale: Locale = input.locale ?? deps.defaultLocale();
			try {
				const profile = await deps.getKiezProfile(locale, input.slug);
				return serializeProfile(profile);
			} catch (err) {
				if (isHttpErrorWithStatus(err, 404)) {
					return {
						error: 'kiez_not_found',
						slug: input.slug,
						hint: 'The slug must be a LOR Bezirksregion (143 total in Berlin), not a Planungsraum (plr_name) from cross_layer_query. Pass lat/lng to list_layers_at_point or cross_layer_query first; then resolve the containing Bezirksregion via geographic context.'
					};
				}
				throw err;
			}
		}
	};
}
