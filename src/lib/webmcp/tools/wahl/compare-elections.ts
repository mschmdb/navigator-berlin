/**
 * Tool `compare_elections`: Multi-Wahl-Vergleich an einer Adresse auf
 * demselben Aggregations-Level. Sparkline-kompatibel: alle Series teilen
 * denselben Level (per Default kiez, falls auf allen Wahlen vorhanden).
 *
 * Bei pre-2021-Stimmbezirks-Level wird pro Wahl die Briefwahl-Caveat
 * mitgegeben.
 */

import * as v from 'valibot';
import {
	CompareElectionsInputSchema,
	COMPARE_ELECTIONS_INPUT_JSON_SCHEMA,
	COMPARE_ELECTIONS_OUTPUT_JSON_SCHEMA,
	type WahlLevel
} from '../../internal/schemas.js';
import type { WebMcpToolDefinition } from '../../internal/tool-types.js';
import type { JsonObject } from '../../internal/json-types.js';
import type { WahlResultsAtPoint, WahlResultBundle } from '$lib/data/get-wahl-results-at-point.js';

export interface CompareElectionsDeps {
	readonly fetchResultsAtPoint: (lat: number, lng: number) => Promise<WahlResultsAtPoint | null>;
}

function bundleSlug(b: WahlResultBundle): string {
	if (b.wahl.typ === 'bvv') return `${b.wahl.jahr}-bvv`;
	return `${b.wahl.jahr}-${b.wahl.typ}-${b.wahl.stimmtyp}`;
}

function pickCommonLevel(
	bundles: readonly WahlResultBundle[],
	preferred?: WahlLevel
): WahlLevel | null {
	const order: WahlLevel[] = preferred
		? [preferred, 'kiez', 'bezirk', 'berlin', 'stimmbezirk']
		: ['kiez', 'bezirk', 'berlin', 'stimmbezirk'];
	const unique = Array.from(new Set(order));
	for (const lvl of unique) {
		if (bundles.every((b) => b.levels[lvl]?.available)) return lvl;
	}
	return null;
}

function caveatsFor(bundle: WahlResultBundle, level: WahlLevel): string[] {
	const out: string[] = [];
	if (level === 'stimmbezirk' && bundle.wahl.jahr < 2021) {
		out.push(
			'Stimmbezirks-Werte ohne Briefstimmen. Briefwähler werden nur als Bezirks-Aggregat erfasst (Briefwahl-Asymmetrie pre-2021).'
		);
	}
	if (bundle.wahl.isRepeatElection) {
		out.push('Wiederholungswahl. Ergebnisse weichen von der gerichtlich aufgehobenen Original-Wahl ab.');
	}
	return out;
}

export function createCompareElectionsTool(deps: CompareElectionsDeps): WebMcpToolDefinition {
	return {
		name: 'compare_elections',
		description:
			'Compare multiple elections at a single Berlin address on the same aggregation level (sparkline-compatible). Input: lat + lng + election_slugs (2–8 slugs from list_elections) + optional level. The tool auto-picks the finest level available across ALL requested elections (default order: kiez → bezirk → berlin → stimmbezirk). Output: series array with top-5 parties per election + caveats for pre-2021 stimmbezirks-level. Use this for time-series questions like "How did SPD vote share evolve in Friedrichshain across BTW 2017, 2021, 2025?". Errors with no_common_level if no aggregation level is available across all requested elections.',
		inputSchema: COMPARE_ELECTIONS_INPUT_JSON_SCHEMA,
		outputSchema: COMPARE_ELECTIONS_OUTPUT_JSON_SCHEMA,
		handler: async (raw) => {
			const input = v.parse(CompareElectionsInputSchema, raw);
			const results = await deps.fetchResultsAtPoint(input.lat, input.lng);
			if (!results) {
				return {
					error: 'address_outside_berlin',
					hint: 'The provided lat/lng is outside the Berlin city boundary.'
				};
			}
			const slugSet = new Set(input.election_slugs);
			const bundles = results.wahlen.filter((b) => slugSet.has(bundleSlug(b)));
			const missing = input.election_slugs.filter(
				(s) => !bundles.some((b) => bundleSlug(b) === s)
			);
			if (missing.length > 0) {
				return {
					error: 'election_not_found',
					missing_slugs: missing,
					hint: 'Call list_elections to get valid slugs.'
				};
			}
			const level = pickCommonLevel(bundles, input.level);
			if (!level) {
				return {
					error: 'no_common_level',
					requested_slugs: input.election_slugs,
					hint: 'The requested elections do not share any aggregation level at this address. Pre-2017 elections lack stimmbezirks/kiez data. Try a coarser level like bezirk or berlin, or restrict the slug set to post-2017 elections.'
				};
			}
			const series: JsonObject[] = bundles.map((b) => {
				const lvl = b.levels[level];
				const top = (lvl.top5 ?? []).slice(0, 5).map((t) => ({
					kurzname: t.kurzname,
					anteil: t.anteil
				}));
				const caveats = caveatsFor(b, level);
				const entry: JsonObject = {
					election_slug: bundleSlug(b),
					jahr: b.wahl.jahr,
					top
				};
				if (caveats.length > 0) entry.caveats = caveats;
				return entry;
			});
			return { level, series };
		}
	};
}
