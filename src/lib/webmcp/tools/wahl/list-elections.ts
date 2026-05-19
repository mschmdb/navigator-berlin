/**
 * Tool `list_elections`: Liste aller in navigator.berlin verfügbaren Wahlen
 * (Bundestags-, Abgeordnetenhaus-, BVV-Wahlen). Per Wahl: Slug, Jahr, Typ,
 * Stimmtyp, Wiederholungswahl-Flag mit Parent-Slug, Stimmbezirks-Geometrie-
 * Verfügbarkeit (für `get_voting_district_geometry`-Pre-Check), Quelle und
 * Lizenz.
 *
 * Slug-Format: `{jahr}-{typ}-{stimmtyp}` (BTW/AGH) oder `{jahr}-bvv` (BVV
 * hat nur Einstimme).
 */

import * as v from 'valibot';
import {
	ListElectionsInputSchema,
	LIST_ELECTIONS_INPUT_JSON_SCHEMA,
	LIST_ELECTIONS_OUTPUT_JSON_SCHEMA
} from '../../internal/schemas.js';
import type { WebMcpToolDefinition } from '../../internal/tool-types.js';
import type { JsonObject } from '../../internal/json-types.js';

export interface ElectionListEntry {
	readonly slug: string;
	readonly jahr: number;
	readonly typ: 'btw' | 'agh' | 'bvv';
	readonly stimmtyp: 'erststimme' | 'zweitstimme' | 'einstimme';
	readonly is_repeat_election: boolean;
	readonly parent_slug: string | null;
	readonly has_stimmbezirks_geometry: boolean;
	readonly source_name: string;
	readonly source_url: string;
	readonly license: string;
}

export interface ListElectionsDeps {
	readonly fetchElections: () => Promise<readonly ElectionListEntry[]>;
}

export function createListElectionsTool(deps: ListElectionsDeps): WebMcpToolDefinition {
	return {
		name: 'list_elections',
		description:
			'List all Berlin elections available in navigator.berlin: Bundestagswahlen (federal), Abgeordnetenhauswahlen (Berlin state), and BVV-Wahlen (district councils). For each: slug like "2025-btw-zweitstimme" or "2023-bvv", year, election type (btw/agh/bvv), Stimmtyp (erststimme/zweitstimme/einstimme), whether it is a repeat election with parent slug, whether per-Stimmbezirk geometry is available (needed for get_voting_district_geometry), source authority, and license. Slugs from this tool are the canonical input for get_election_result and compare_elections.',
		inputSchema: LIST_ELECTIONS_INPUT_JSON_SCHEMA,
		outputSchema: LIST_ELECTIONS_OUTPUT_JSON_SCHEMA,
		handler: async (raw) => {
			v.parse(ListElectionsInputSchema, raw);
			const elections = await deps.fetchElections();
			const out: JsonObject = {
				elections: elections.map((e) => ({
					slug: e.slug,
					jahr: e.jahr,
					typ: e.typ,
					stimmtyp: e.stimmtyp,
					is_repeat_election: e.is_repeat_election,
					parent_slug: e.parent_slug,
					has_stimmbezirks_geometry: e.has_stimmbezirks_geometry,
					source_name: e.source_name,
					source_url: e.source_url,
					license: e.license
				}))
			};
			return out;
		}
	};
}
