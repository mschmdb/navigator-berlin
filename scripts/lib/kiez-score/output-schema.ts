import * as v from 'valibot';
import { KIEZ_SCORE_DIMENSIONS } from './types.js';

const DimensionPicklist = v.picklist([...KIEZ_SCORE_DIMENSIONS]);

const DimensionSourceSchema = v.object({
	layer: v.pipe(v.string(), v.minLength(1)),
	rawValue: v.unknown(),
	normalizedValue: v.nullable(v.pipe(v.number(), v.minValue(0), v.maxValue(100))),
	weight: v.pipe(v.number(), v.minValue(0), v.maxValue(1))
});

const DimensionScoreSchema = v.object({
	dimension: DimensionPicklist,
	value: v.nullable(v.pipe(v.number(), v.minValue(0), v.maxValue(100))),
	sources: v.array(DimensionSourceSchema),
	missingData: v.array(v.string()),
	dataStand: v.nullable(v.string())
});

const KiezScoreSchema = v.object({
	persona: v.literal('allgemein'),
	dimensions: v.array(DimensionScoreSchema),
	missingDimensions: v.array(DimensionPicklist),
	overall: v.optional(v.pipe(v.number(), v.minValue(0), v.maxValue(100)))
});

export const KiezScoreOutputSchema = v.object({
	schemaVersion: v.literal(1),
	generatedAt: v.pipe(v.string(), v.isoTimestamp()),
	scores: v.record(v.pipe(v.string(), v.minLength(1)), KiezScoreSchema)
});

export type KiezScoreOutput = v.InferOutput<typeof KiezScoreOutputSchema>;

export function validateKiezScoreOutput(input: unknown): KiezScoreOutput {
	return v.parse(KiezScoreOutputSchema, input);
}
