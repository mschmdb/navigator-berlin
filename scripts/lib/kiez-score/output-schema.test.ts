import { describe, expect, it } from 'vitest';
import { validateKiezScoreOutput } from './output-schema.js';

function outputWithDimension(dimension: string) {
	return {
		schemaVersion: 1 as const,
		generatedAt: '2026-05-21T00:00:00.000Z',
		scores: {
			'001': {
				persona: 'allgemein' as const,
				dimensions: [
					{
						dimension,
						value: 50,
						sources: [],
						missingData: [],
						dataStand: null
					}
				],
				missingDimensions: []
			}
		}
	};
}

describe('validateKiezScoreOutput — Dimensions-Picklist', () => {
	it('akzeptiert die neuen Dimensionen', () => {
		for (const dim of ['ruhe-luft', 'gruen-hitze', 'mobilitaet', 'versorgung', 'wohnschutz']) {
			expect(() => validateKiezScoreOutput(outputWithDimension(dim))).not.toThrow();
		}
	});

	it('lehnt die alten Dimensionen soziale-lage und gruen ab', () => {
		expect(() => validateKiezScoreOutput(outputWithDimension('soziale-lage'))).toThrow();
		expect(() => validateKiezScoreOutput(outputWithDimension('gruen'))).toThrow();
	});
});
