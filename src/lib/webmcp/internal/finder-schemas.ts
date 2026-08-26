/**
 * Schemas und Key-Mapping der Finder-Kollaborations-Tools
 * (`set_finder_weights`, `get_finder_state`).
 *
 * Eigene Datei statt `schemas.ts`: die steht an der 500-Zeilen-Grenze.
 * Die Tool-Surface ist englisch (Challenge-Vorgabe), intern rechnen
 * Engine und Panel mit den deutschen `FinderWeights`-Keys.
 */

import * as v from 'valibot';
import type { FinderWeights } from '$lib/components/atlas/internal/kiez-finder-engine.js';

/** Englischer Schema-Key → interner FinderWeights-Key. */
export const FINDER_WEIGHT_KEY_MAP = {
	quiet_air: 'ruheLuft',
	green_heat: 'gruenHitze',
	mobility: 'mobilitaet',
	supply: 'versorgung',
	housing_protection: 'wohnschutz',
	culture: 'kultur',
	density: 'dichte',
	sbahn_proximity: 'sbahn',
	voting_similarity: 'partei'
} as const;

export type EnglishWeightKey = keyof typeof FINDER_WEIGHT_KEY_MAP;

const Bipolar = v.pipe(v.number(), v.integer(), v.minValue(-2), v.maxValue(2));
const Unipolar = v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(2));

/**
 * Schreibbar sind die 8 Nicht-Partei-Gewichte. `voting_similarity` braucht
 * zusätzlich eine Partei-Wahl und bleibt v1 der UI vorbehalten (lesbar
 * über `get_finder_state`).
 */
export const SetFinderWeightsInputSchema = v.object({
	quiet_air: v.optional(Bipolar),
	green_heat: v.optional(Bipolar),
	mobility: v.optional(Bipolar),
	supply: v.optional(Bipolar),
	housing_protection: v.optional(Bipolar),
	culture: v.optional(Bipolar),
	density: v.optional(Bipolar),
	sbahn_proximity: v.optional(Unipolar)
});
export type SetFinderWeightsInput = v.InferOutput<typeof SetFinderWeightsInputSchema>;

export const GetFinderStateInputSchema = v.object({});

const BIPOLAR_JSON = {
	type: 'integer',
	minimum: -2,
	maximum: 2,
	description: '-2 = as little as possible, 0 = neutral, +2 = as much as possible'
} as const;
const UNIPOLAR_JSON = {
	type: 'integer',
	minimum: 0,
	maximum: 2,
	description: '0 = does not matter, 2 = as close as possible'
} as const;

export const SET_FINDER_WEIGHTS_INPUT_JSON_SCHEMA = {
	type: 'object',
	additionalProperties: false,
	properties: {
		quiet_air: { ...BIPOLAR_JSON, description: 'Quiet & clean air. ' + BIPOLAR_JSON.description },
		green_heat: {
			...BIPOLAR_JSON,
			description: 'Green spaces & heat protection. ' + BIPOLAR_JSON.description
		},
		mobility: {
			...BIPOLAR_JSON,
			description: 'Public transit & bike access. ' + BIPOLAR_JSON.description
		},
		supply: {
			...BIPOLAR_JSON,
			description: 'Daily supply: groceries, pharmacies, schools. ' + BIPOLAR_JSON.description
		},
		housing_protection: {
			...BIPOLAR_JSON,
			description: 'Tenant/housing protection zones. ' + BIPOLAR_JSON.description
		},
		culture: { ...BIPOLAR_JSON, description: 'Cultural offering. ' + BIPOLAR_JSON.description },
		density: {
			...BIPOLAR_JSON,
			description: 'Built-up density: -2 = as loose as possible, +2 = as dense as possible'
		},
		sbahn_proximity: {
			...UNIPOLAR_JSON,
			description: 'S-Bahn proximity. ' + UNIPOLAR_JSON.description
		}
	}
} as const;

export const SET_FINDER_WEIGHTS_OUTPUT_JSON_SCHEMA = {
	type: 'object',
	properties: {
		applied_weights: { type: 'object', description: 'All nine weights after the update.' },
		finder_open: { type: 'boolean' },
		navigation: {
			type: 'string',
			enum: ['none', 'opened_finder'],
			description:
				'opened_finder = the page navigated to the finder; top matches follow shortly, poll get_finder_state.'
		},
		top_matches: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					kiez: { type: 'string' },
					plr_id: { type: 'string' },
					fit: { type: 'number', description: 'Match 0..100' }
				}
			}
		}
	}
} as const;

export const GET_FINDER_STATE_INPUT_JSON_SCHEMA = {
	type: 'object',
	additionalProperties: false,
	properties: {}
} as const;

export const GET_FINDER_STATE_OUTPUT_JSON_SCHEMA = {
	type: 'object',
	properties: {
		finder_open: { type: 'boolean' },
		weights: { type: 'object', description: 'All nine weights, english keys.' },
		last_changed_by: { type: ['string', 'null'], enum: ['agent', 'user', null] },
		changed_at: { type: ['string', 'null'], description: 'ISO timestamp of the last change.' },
		top_matches: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					kiez: { type: 'string' },
					plr_id: { type: 'string' },
					fit: { type: 'number' }
				}
			}
		}
	}
} as const;

/** Interne Gewichte → englisches Ausgabe-Objekt (alle 9 Keys). */
export function toEnglishWeights(weights: FinderWeights): Record<EnglishWeightKey, number> {
	const out = {} as Record<EnglishWeightKey, number>;
	for (const [en, intern] of Object.entries(FINDER_WEIGHT_KEY_MAP)) {
		out[en as EnglishWeightKey] = weights[intern as keyof FinderWeights];
	}
	return out;
}

/** Validierter englischer Input → partielle interne Gewichte. */
export function toInternalPartial(input: SetFinderWeightsInput): Partial<FinderWeights> {
	const out: { -readonly [K in keyof FinderWeights]?: number } = {};
	for (const [en, wert] of Object.entries(input)) {
		if (typeof wert !== 'number') continue;
		out[FINDER_WEIGHT_KEY_MAP[en as EnglishWeightKey]] = wert;
	}
	return out;
}
