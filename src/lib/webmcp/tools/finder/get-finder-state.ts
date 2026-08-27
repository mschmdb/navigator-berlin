/**
 * Tool `get_finder_state`: der Agent liest, was der Mensch am Kiez-Finder
 * eingestellt hat. Rückkanal des Kollaborations-Round-Trips: nach einem
 * menschlichen Regler-Eingriff erklärt der Agent das neue Ergebnis.
 */

import * as v from 'valibot';
import {
	GetFinderStateInputSchema,
	GET_FINDER_STATE_INPUT_JSON_SCHEMA,
	GET_FINDER_STATE_OUTPUT_JSON_SCHEMA,
	toEnglishWeights,
	finderMapUrl
} from '../../internal/finder-schemas.js';
import type { WebMcpToolDefinition } from '../../internal/tool-types.js';
import type { JsonObject } from '../../internal/json-types.js';
import type { FinderBridgeSnapshot } from '$lib/state/finder-bridge.svelte.js';

export interface GetFinderStateDeps {
	readonly readFinderState: () => FinderBridgeSnapshot;
}

export function createGetFinderStateTool(deps: GetFinderStateDeps): WebMcpToolDefinition {
	return {
		name: 'get_finder_state',
		description:
			'Read the current state of the interactive Kiez-Finder on navigator.berlin: all nine weights (english keys), who changed them last (user or agent) and when, whether the finder panel is open, and the current top matching Kieze with their fit scores. Call this after the human adjusted the sliders to understand their preferences and explain the new result. Treat top_matches as the complete result: the fit score (0-100) already reflects every active weight including voting similarity. Do not re-query underlying layers or election data to validate or enrich these results. Call get_election_result or cross_layer_query only for an explicit follow-up about a named match, and then pass that match\'s centroid lat/lng straight, never geocode kiez names via address_lookup. When you link the map, use map_url verbatim: it carries the weights and the party and reopens this exact map anywhere.',
		readOnly: true,
		inputSchema: GET_FINDER_STATE_INPUT_JSON_SCHEMA,
		outputSchema: GET_FINDER_STATE_OUTPUT_JSON_SCHEMA,
		handler: async (raw) => {
			v.parse(GetFinderStateInputSchema, raw ?? {});
			const s = deps.readFinderState();
			const out: JsonObject = {
				finder_open: s.panelActive,
				weights: toEnglishWeights(s.weights),
				party: s.party,
				last_changed_by: s.lastChangedBy,
				map_url: finderMapUrl(s.weights, s.party),
				changed_at: s.changedAt === null ? null : new Date(s.changedAt).toISOString(),
				top_matches: s.topMatches.map((m) => ({
					kiez: m.name,
					plr_id: m.plrId,
					fit: m.fit,
					lat: m.lat ?? null,
					lng: m.lng ?? null
				}))
			};
			return out;
		}
	};
}
