/**
 * Tool `set_finder_weights`: der Agent stellt die Kiez-Finder-Regler,
 * die Karte vor den Augen des Menschen färbt sich live um. Kern des
 * Kollaborations-Round-Trips (WebMCP Challenge 2026): Agent schreibt,
 * Mensch justiert nach, Agent liest via `get_finder_state`.
 */

import * as v from 'valibot';
import {
	SetFinderWeightsInputSchema,
	SET_FINDER_WEIGHTS_INPUT_JSON_SCHEMA,
	SET_FINDER_WEIGHTS_OUTPUT_JSON_SCHEMA,
	toEnglishWeights,
	toInternalPartial,
	finderMapUrl
} from '../../internal/finder-schemas.js';
import type { WebMcpToolDefinition } from '../../internal/tool-types.js';
import type { JsonObject } from '../../internal/json-types.js';
import type { FinderWeights } from '$lib/components/atlas/internal/kiez-finder-engine.js';
import type { FinderTopMatch } from '$lib/state/finder-bridge.svelte.js';

export interface ApplyFinderWeightsResult {
	readonly weights: FinderWeights;
	readonly finderOpen: boolean;
	readonly navigation: 'none' | 'opened_finder';
	readonly topMatches: readonly FinderTopMatch[];
}

export interface SetFinderWeightsDeps {
	readonly applyFinderWeights: (
		partial: Partial<FinderWeights>,
		party?: string
	) => Promise<ApplyFinderWeightsResult>;
}

export function createSetFinderWeightsTool(deps: SetFinderWeightsDeps): WebMcpToolDefinition {
	return {
		name: 'set_finder_weights',
		description:
			'Set the sliders of the interactive Kiez-Finder on navigator.berlin. The map the user is currently looking at recolors all 542 Berlin planning areas instantly: darker means better match. Weights you do not provide stay unchanged. If the finder is not open, the page navigates to it first; top matches then follow with a short delay, poll get_finder_state. voting_similarity colors by how similar local voting (BTW 2025 Zweitstimme) is to the given party. Use this to translate a spoken wish ("quiet, green, close to an S-Bahn") into a visible map the human can react to. After a successful update, show the user the live map: open or surface the browser view and include map_url as a link, the recolored map IS the result. The returned fit scores already incorporate all requested weights including voting similarity, so answer from top_matches without re-verifying via other tools unless the user asks. Each match carries centroid lat/lng: if you do need details (e.g. actual election shares), pass those coordinates straight to get_election_result or cross_layer_query, never geocode kiez names via address_lookup.',
		inputSchema: SET_FINDER_WEIGHTS_INPUT_JSON_SCHEMA,
		outputSchema: SET_FINDER_WEIGHTS_OUTPUT_JSON_SCHEMA,
		handler: async (raw) => {
			const input = v.parse(SetFinderWeightsInputSchema, raw);
			const partial = toInternalPartial(input);
			if (Object.keys(partial).length === 0) {
				throw new Error(
					'Provide at least one weight, e.g. { "quiet_air": 2, "sbahn_proximity": 1 }.'
				);
			}
			const result = await deps.applyFinderWeights(partial, input.party);
			const out: JsonObject = {
				applied_weights: toEnglishWeights(result.weights),
				finder_open: result.finderOpen,
				navigation: result.navigation,
				map_url: finderMapUrl(),
				top_matches: result.topMatches.map((m) => ({
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
