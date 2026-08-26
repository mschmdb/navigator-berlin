/**
 * Pure-Function-Builder: liefert das WebMCP-Manifest-JSON-Objekt.
 *
 * Quellen:
 * - Tool-Descriptors aus den Tool-Factories
 * - Resource-Descriptors aus `resources/descriptors.ts`
 * - Prompt-Templates aus `prompts/index.ts`
 *
 * Side-Effect-frei (kein File-IO). Wird sowohl im Build-Script als auch im
 * SvelteKit-Endpoint-Doppel-Serving genutzt.
 */

import { WEBMCP_SPEC_VERSION } from './spec-version.js';
import {
	SET_FINDER_WEIGHTS_INPUT_JSON_SCHEMA,
	SET_FINDER_WEIGHTS_OUTPUT_JSON_SCHEMA,
	GET_FINDER_STATE_INPUT_JSON_SCHEMA,
	GET_FINDER_STATE_OUTPUT_JSON_SCHEMA
} from './finder-schemas.js';
import {
	ADDRESS_LOOKUP_INPUT_JSON_SCHEMA,
	ADDRESS_LOOKUP_OUTPUT_JSON_SCHEMA,
	POINT_INPUT_JSON_SCHEMA,
	LAYER_HIT_LIST_JSON_SCHEMA,
	LAYER_SLUG_LIST_JSON_SCHEMA,
	KIEZ_PROFILE_INPUT_JSON_SCHEMA,
	KIEZ_PROFILE_OUTPUT_JSON_SCHEMA,
	LAYER_METADATA_INPUT_JSON_SCHEMA,
	LAYER_METADATA_OUTPUT_JSON_SCHEMA,
	LIST_ELECTIONS_INPUT_JSON_SCHEMA,
	LIST_ELECTIONS_OUTPUT_JSON_SCHEMA,
	GET_ELECTION_RESULT_INPUT_JSON_SCHEMA,
	GET_ELECTION_RESULT_OUTPUT_JSON_SCHEMA,
	COMPARE_ELECTIONS_INPUT_JSON_SCHEMA,
	COMPARE_ELECTIONS_OUTPUT_JSON_SCHEMA,
	VOTING_DISTRICT_GEOMETRY_INPUT_JSON_SCHEMA,
	VOTING_DISTRICT_GEOMETRY_OUTPUT_JSON_SCHEMA
} from './schemas.js';
import { RESOURCE_DESCRIPTORS } from '../resources/descriptors.js';
import { ALL_PROMPTS } from '../prompts/index.js';

export interface WebMcpManifestToolEntry {
	readonly name: string;
	readonly description: string;
	readonly input_schema: Readonly<Record<string, unknown>>;
	readonly output_schema: Readonly<Record<string, unknown>>;
}

export interface WebMcpManifestResourceEntry {
	readonly uri_template: string;
	readonly name: string;
	readonly description: string;
}

export interface WebMcpManifestPromptEntry {
	readonly name: string;
	readonly description: string;
	readonly arguments: readonly {
		readonly name: string;
		readonly description: string;
		readonly required: boolean;
	}[];
	readonly supported_locales: readonly ['de', 'en'];
}

export interface WebMcpManifest {
	readonly spec_version: string;
	readonly name: string;
	readonly description: string;
	readonly homepage: string;
	readonly license: string;
	readonly attribution: string;
	readonly tools: readonly WebMcpManifestToolEntry[];
	readonly resources: readonly WebMcpManifestResourceEntry[];
	readonly prompts: readonly WebMcpManifestPromptEntry[];
}

const TOOL_DESCRIPTIONS: readonly WebMcpManifestToolEntry[] = [
	{
		name: 'address_lookup',
		description:
			'Search Berlin addresses, streets, and POIs. Returns up to N candidates with coordinates and administrative context (Bezirk, Kiez, postcode). Backed by OSM Nominatim, biased to Berlin.',
		input_schema: ADDRESS_LOOKUP_INPUT_JSON_SCHEMA,
		output_schema: ADDRESS_LOOKUP_OUTPUT_JSON_SCHEMA
	},
	{
		name: 'cross_layer_query',
		description:
			'Query all configured Berlin data layers at a geographic point (lat, lng) and return one structured hit per layer with full provenance (source, updated_at, license, reason).',
		input_schema: POINT_INPUT_JSON_SCHEMA,
		output_schema: LAYER_HIT_LIST_JSON_SCHEMA
	},
	{
		name: 'list_layers_at_point',
		description:
			'Lightweight discovery: list which Berlin data layers cover a given point. Returns layer slug, has_value flag, and reason (no-coverage, outdated, seasonal). Use this to decide which deeper queries to run.',
		input_schema: POINT_INPUT_JSON_SCHEMA,
		output_schema: LAYER_SLUG_LIST_JSON_SCHEMA
	},
	{
		name: 'get_kiez_profile',
		description:
			'Return the public profile of a Berlin Kiez (LOR Bezirksregion) by slug. Includes name, Bezirk, population, area, centroid, and a list of data sources with license + updated_at provenance.',
		input_schema: KIEZ_PROFILE_INPUT_JSON_SCHEMA,
		output_schema: KIEZ_PROFILE_OUTPUT_JSON_SCHEMA
	},
	{
		name: 'get_layer_metadata',
		description:
			'Return rich metadata for a single data layer by slug: source URL, license, license URL, geometry type, feature count, last update, and methodology summary.',
		input_schema: LAYER_METADATA_INPUT_JSON_SCHEMA,
		output_schema: LAYER_METADATA_OUTPUT_JSON_SCHEMA
	},
	{
		name: 'list_elections',
		description:
			'List all Berlin elections available in navigator.berlin (Bundestagswahl, Abgeordnetenhauswahl, BVV-Wahl). Per election: slug like 2025-btw-zweitstimme or 2023-bvv, year, type, Stimmtyp, repeat-election flag with parent slug, has_stimmbezirks_geometry flag, source authority + license. Slugs from this tool are the canonical input for get_election_result and compare_elections.',
		input_schema: LIST_ELECTIONS_INPUT_JSON_SCHEMA,
		output_schema: LIST_ELECTIONS_OUTPUT_JSON_SCHEMA
	},
	{
		name: 'get_election_result',
		description:
			'Return the top parties at a Berlin address for one election on a selectable aggregation level (stimmbezirk/kiez/bezirk/berlin). Default: finest available. Output: top-5 with vote count + share + color, source + license, caveats for pre-2021 stimmbezirks-level (Briefwahl-asymmetry) or repeat elections.',
		input_schema: GET_ELECTION_RESULT_INPUT_JSON_SCHEMA,
		output_schema: GET_ELECTION_RESULT_OUTPUT_JSON_SCHEMA
	},
	{
		name: 'compare_elections',
		description:
			'Compare multiple elections at a Berlin address on the same aggregation level (sparkline-compatible). Input: 2–8 election_slugs from list_elections. The tool picks the finest level available across ALL elections. Output: series per election with top-5 + caveats.',
		input_schema: COMPARE_ELECTIONS_INPUT_JSON_SCHEMA,
		output_schema: COMPARE_ELECTIONS_OUTPUT_JSON_SCHEMA
	},
	{
		name: 'get_voting_district_geometry',
		description:
			'Return the GeoJSON Feature for a single Berlin Stimmbezirk in a given year. Input: district_id (uwbId from get_election_result on stimmbezirks-level, format depends on year) + year. Errors with geometry_not_available for pre-2017 BTW / pre-2016 AGH/BVV.',
		input_schema: VOTING_DISTRICT_GEOMETRY_INPUT_JSON_SCHEMA,
		output_schema: VOTING_DISTRICT_GEOMETRY_OUTPUT_JSON_SCHEMA
	},
	{
		name: 'set_finder_weights',
		description:
			'Set the sliders of the interactive Kiez-Finder. The map the user is looking at recolors all 542 Berlin planning areas instantly; weights not provided stay unchanged. Part of the human-agent collaboration round-trip with get_finder_state.',
		input_schema: SET_FINDER_WEIGHTS_INPUT_JSON_SCHEMA,
		output_schema: SET_FINDER_WEIGHTS_OUTPUT_JSON_SCHEMA
	},
	{
		name: 'get_finder_state',
		description:
			'Read the current Kiez-Finder state: all nine weights, who changed them last (user or agent) and when, whether the panel is open, and the current top matching Kieze.',
		input_schema: GET_FINDER_STATE_INPUT_JSON_SCHEMA,
		output_schema: GET_FINDER_STATE_OUTPUT_JSON_SCHEMA
	}
];

export function buildWebMcpManifest(): WebMcpManifest {
	return {
		spec_version: WEBMCP_SPEC_VERSION,
		name: 'navigator.berlin',
		description:
			'Cross-layer address inspector for Berlin: combines noise, air quality, green coverage, mobility, residential quality and Kiez-Score data with full source citations.',
		homepage: 'https://navigator.berlin',
		license: 'CC BY 4.0',
		attribution:
			'Tool outputs from navigator.berlin. Underlying datasets carry their own licenses (dl-de/by-2-0, dl-de/zero-2-0, ODbL, CC BY 4.0). Always cite the source URL and license per tool output.',
		tools: TOOL_DESCRIPTIONS,
		resources: RESOURCE_DESCRIPTORS.map((r) => ({
			uri_template: r.uriTemplate,
			name: r.name,
			description: r.description
		})),
		prompts: ALL_PROMPTS.map((p) => ({
			name: p.name,
			description: p.description,
			arguments: p.arguments.map((a) => ({
				name: a.name,
				description: a.description,
				required: a.required
			})),
			supported_locales: ['de', 'en'] as const
		}))
	};
}
