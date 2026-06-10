import { describe, expect, it } from 'vitest';
import {
	LAYER_SCORE_DIMENSION,
	scoreDimensionFor,
	scoreDimensionLabelFor,
	contextNoteFor
} from './score-membership.js';
import { KIEZ_SCORE_DIMENSIONS } from '../../../../../../scripts/lib/kiez-score/types.js';
import { DIMENSION_CONFIGS } from '../../../../../../scripts/lib/kiez-score/dimension-config.js';

describe('score-membership', () => {
	it('mappt nur auf gültige Score-Dimensionen', () => {
		for (const dim of Object.values(LAYER_SCORE_DIMENSION)) {
			expect(KIEZ_SCORE_DIMENSIONS).toContain(dim);
		}
	});

	it('Drift-Guard: jede gemappte Dimension existiert in DIMENSION_CONFIGS', () => {
		const configDims = new Set(DIMENSION_CONFIGS.map((c) => c.dimension));
		for (const dim of Object.values(LAYER_SCORE_DIMENSION)) {
			expect(configDims.has(dim)).toBe(true);
		}
	});

	it('Spot-Check: bekannte Score-Inputs lösen korrekt auf', () => {
		expect(scoreDimensionFor('luft-2023')).toBe('ruhe-luft');
		expect(scoreDimensionFor('gruenversorgung-2023')).toBe('gruen-hitze');
		expect(scoreDimensionFor('kitas-2024')).toBe('versorgung');
		expect(scoreDimensionFor('milieuschutz-erhaltungsmiete')).toBe('wohnschutz');
		expect(scoreDimensionFor('radverkehrsnetz-2025')).toBe('mobilitaet');
	});

	it('Kontext-Layer (ADR-015 / abgelöst) sind NICHT im Score', () => {
		for (const slug of [
			'laerm-2023',
			'umweltgerechtigkeit-2023',
			'mss-gesamtindex-2025',
			'wohnlagen-2024',
			'bodenrichtwerte',
			'sportanlagen-2024',
			'bezirke'
		]) {
			expect(scoreDimensionFor(slug)).toBeNull();
		}
	});

	it('liefert lesbares Label + Kontext-Note', () => {
		expect(scoreDimensionLabelFor('luft-2023')).toBe('Ruhe & Luft');
		expect(scoreDimensionLabelFor('laerm-2023')).toBeNull();
		expect(contextNoteFor('laerm-2023')).toMatch(/dB-Mittel/);
		expect(contextNoteFor('luft-2023')).toBeNull();
	});
});
