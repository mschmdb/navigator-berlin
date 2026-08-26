/**
 * Tool `get_election_result`: Top-Parteien an einer Adresse für eine
 * spezifische Wahl auf einem auswählbaren Aggregations-Level
 * (stimmbezirk/kiez/bezirk/berlin). Default-Level: stimmbezirk falls
 * verfügbar, sonst kiez, sonst bezirk, sonst berlin.
 *
 * Adress-Input: lat/lng (rufe address_lookup vorher für Adress-zu-Koord).
 * Bei pre-2021-Stimmbezirks-Level wird `caveats` mit Briefwahl-Asymmetrie-
 * Hinweis ergänzt.
 */

import * as v from 'valibot';
import {
	GetElectionResultInputSchema,
	GET_ELECTION_RESULT_INPUT_JSON_SCHEMA,
	GET_ELECTION_RESULT_OUTPUT_JSON_SCHEMA,
	type WahlLevel
} from '../../internal/schemas.js';
import type { WebMcpToolDefinition } from '../../internal/tool-types.js';
import type { JsonObject } from '../../internal/json-types.js';
import type {
	WahlResultsAtPoint,
	WahlResultBundle,
	Top5Entry
} from '$lib/data/get-wahl-results-at-point.js';

export interface GetElectionResultDeps {
	readonly fetchResultsAtPoint: (lat: number, lng: number) => Promise<WahlResultsAtPoint | null>;
}

function bundleSlug(b: WahlResultBundle): string {
	if (b.wahl.typ === 'bvv') return `${b.wahl.jahr}-bvv`;
	return `${b.wahl.jahr}-${b.wahl.typ}-${b.wahl.stimmtyp}`;
}

function sourceName(sourceUrl: string): string {
	return sourceUrl.includes('bundeswahlleiterin')
		? 'Bundeswahlleiterin'
		: 'Amt für Statistik Berlin-Brandenburg';
}

function autoSelectLevel(bundle: WahlResultBundle): WahlLevel {
	if (bundle.levels.stimmbezirk?.available) return 'stimmbezirk';
	if (bundle.levels.kiez?.available) return 'kiez';
	if (bundle.levels.bezirk?.available) return 'bezirk';
	return 'berlin';
}

function caveatsFor(bundle: WahlResultBundle, level: WahlLevel): string[] {
	const out: string[] = [];
	if (level === 'stimmbezirk' && bundle.wahl.jahr < 2021) {
		out.push(
			'Stimmbezirks-Werte ohne Briefstimmen. Briefwähler werden nur als Bezirks-Aggregat erfasst (Briefwahl-Asymmetrie pre-2021).'
		);
	}
	if (bundle.wahl.isRepeatElection) {
		out.push(
			'Wiederholungswahl. Ergebnisse weichen von der gerichtlich aufgehobenen Original-Wahl ab.'
		);
	}
	return out;
}

function serializeTop(top: readonly Top5Entry[]): JsonObject[] {
	return top.map((t) => ({
		kurzname: t.kurzname,
		vollname: t.vollname,
		stimmen: t.stimmen,
		anteil: t.anteil,
		farbe_hex: t.farbeHex
	}));
}

export function createGetElectionResultTool(deps: GetElectionResultDeps): WebMcpToolDefinition {
	return {
		name: 'get_election_result',
		description:
			'Return the top parties at a given Berlin address for one specific election, on a selectable aggregation level (stimmbezirk/kiez/bezirk/berlin). Input: lat + lng + election_slug (from list_elections, format "2025-btw-zweitstimme" or "2023-bvv") + optional level. Default level is the finest available: stimmbezirk if the address has per-district data, then kiez (LOR Bezirksregion), then bezirk, then berlin. Output includes top-5 parties with vote count + share + color, source authority + license + last update, and caveats for pre-2021 Stimmbezirks-level (Briefwahl-asymmetry) or repeat elections. Errors with election_not_found if election_slug does not exist, address_outside_berlin if the point is not in Berlin.',
		readOnly: true,
		inputSchema: GET_ELECTION_RESULT_INPUT_JSON_SCHEMA,
		outputSchema: GET_ELECTION_RESULT_OUTPUT_JSON_SCHEMA,
		handler: async (raw) => {
			const input = v.parse(GetElectionResultInputSchema, raw);
			const results = await deps.fetchResultsAtPoint(input.lat, input.lng);
			if (!results) {
				return {
					error: 'address_outside_berlin',
					hint: 'The provided lat/lng is outside the Berlin city boundary. Use address_lookup with a Berlin street + house number first.'
				};
			}
			const bundle = results.wahlen.find((b) => bundleSlug(b) === input.election_slug);
			if (!bundle) {
				return {
					error: 'election_not_found',
					election_slug: input.election_slug,
					hint: 'Call list_elections first to get valid slug values.'
				};
			}
			const requestedLevel: WahlLevel = input.level ?? autoSelectLevel(bundle);
			const levelData = bundle.levels[requestedLevel];
			if (!levelData?.available || !levelData.top5) {
				return {
					error: 'level_not_available',
					requested_level: requestedLevel,
					available_levels: (Object.keys(bundle.levels) as WahlLevel[]).filter(
						(lvl) => bundle.levels[lvl]?.available
					),
					hint:
						requestedLevel === 'stimmbezirk'
							? 'Per-Stimmbezirk data is only available from 2016 (AGH/BVV) and 2017 (BTW) onwards.'
							: 'Try a different aggregation level.'
				};
			}
			const top5 = levelData.top5.slice(0, 5);
			const caveats = caveatsFor(bundle, requestedLevel);
			const out: JsonObject = {
				election_slug: input.election_slug,
				level: requestedLevel,
				top: serializeTop(top5),
				source: sourceName(bundle.wahl.sourceUrl),
				updated_at: `${bundle.wahl.jahr}-01-01`,
				license: bundle.wahl.license
			};
			if (caveats.length > 0) out.caveats = caveats;
			return out;
		}
	};
}
