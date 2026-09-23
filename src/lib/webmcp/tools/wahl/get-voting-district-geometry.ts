/**
 * Tool `get_voting_district_geometry`: GeoJSON-Feature für die Briefwahl-
 * Gruppe eines Stimmbezirks in einem gegebenen Wahljahr (Story 17:
 * Briefwahl-Gruppen als kleinste Kartenebene -- alle Urnen-Stimmbezirke mit
 * demselben Briefwahlbezirk plus dieser Briefwahlbezirk selbst, als eine
 * dissolvierte Fläche). Pre-2017 (BTW) bzw. pre-2016 (AGH/BVV) →
 * error:`geometry_not_available` mit `available_levels`-Hint.
 *
 * district_id bleibt die einzelne Urnen-uwbId (wahljahr-spezifisches
 * Format), löst aber intern zur Gruppen-Fläche auf -- die Response trägt
 * `is_gruppe: true`, wenn eine Gruppen-Fläche gefunden wurde (sonst Fallback
 * auf die einzelne Urnen-Fläche):
 * - BTW 2021/2025: `075-01-100-0`
 * - BTW 2017:      `078-05-05W221-0`
 * - AGH/BVV 2021/2023: `01W100-W`
 * - AGH/BVV 2016:  `01W100`
 *
 * IDs werden vom `uwbId`-Feld aus `get_election_result` (Stimmbezirks-
 * Level) oder aus `cross_layer_query`-Resultaten resolviert.
 */

import * as v from 'valibot';
import {
	VotingDistrictGeometryInputSchema,
	VOTING_DISTRICT_GEOMETRY_INPUT_JSON_SCHEMA,
	VOTING_DISTRICT_GEOMETRY_OUTPUT_JSON_SCHEMA
} from '../../internal/schemas.js';
import type { WebMcpToolDefinition } from '../../internal/tool-types.js';
import type { JsonObject } from '../../internal/json-types.js';
import { UWB_FORMAT_HINT } from '$lib/data/wahl-geo-mapping.js';

export interface VotingDistrictGeometryDeps {
	readonly fetchGeometry: (districtId: string, year: number) => Promise<JsonObject | null>;
}

export function createGetVotingDistrictGeometryTool(
	deps: VotingDistrictGeometryDeps
): WebMcpToolDefinition {
	return {
		name: 'get_voting_district_geometry',
		description:
			'Return the GeoJSON Feature (Polygon/MultiPolygon) for the Briefwahl-Gruppe (postal-voting group) of a Berlin voting district in a given election year — the smallest map unit is a group of neighboring voting districts merged with their shared postal-voting district, not a single voting district. Input: district_id (the uwbId from get_election_result on stimmbezirk-level, format depends on year — BTW 2021/2025: "075-01-100-0", BTW 2017: "078-05-05W221-0", AGH/BVV 2021/2023: "01W100-W", AGH/BVV 2016: "01W100") + year. Returns a GeoJSON Feature with properties.district_id + year + bezirk_code + is_gruppe (true when the group polygon was resolved; false falls back to the single voting district). Errors with geometry_not_available for pre-2017 BTW / pre-2016 AGH/BVV elections (only bezirk + berlin aggregation available), district_not_found if the id does not match any feature in the year layer.',
		readOnly: true,
		inputSchema: VOTING_DISTRICT_GEOMETRY_INPUT_JSON_SCHEMA,
		outputSchema: VOTING_DISTRICT_GEOMETRY_OUTPUT_JSON_SCHEMA,
		handler: async (raw) => {
			const input = v.parse(VotingDistrictGeometryInputSchema, raw);
			const result = await deps.fetchGeometry(input.district_id, input.year);
			if (!result) {
				return {
					error: 'district_not_found',
					district_id: input.district_id,
					year: input.year,
					hint: UWB_FORMAT_HINT
				};
			}
			return result;
		}
	};
}
