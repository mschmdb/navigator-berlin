import { describe, expect, it } from 'vitest';
import { buildInput, DIMS } from './build.js';
import { hashInput } from './input.js';

/**
 * Story 14.8: Kriminalität ist Karten-Kontext, fließt bewusst NICHT in den Profil-Input
 * (Stigma-Schutz, ADR-019). Dadurch bleibt der inputHash stabil → keine Regeneration.
 */
function area(scoreOverrides: Record<string, number | null> = {}) {
	return {
		slug: 'test-kiez',
		bezirkSlug: 'mitte',
		score: {
			composite: 50,
			ruheLuft: 60,
			gruenHitze: 40,
			mobilitaet: 70,
			versorgung: 55,
			wohnschutz: 80,
			kultur: 65,
			...scoreOverrides
		},
		stats: {},
		ranks: new Map(),
		cmps: new Map()
	};
}

describe('DIMS (Profil-Grounding-Dimensionen)', () => {
	it('enthält Kriminalität NICHT (Stigma-Schutz, Story 14.8)', () => {
		expect(DIMS.map((d) => d.key)).not.toContain('kriminalitaet');
		expect(DIMS.map((d) => d.label)).not.toContain('Erfasste Kriminalität');
	});

	it('listet genau die sechs Profil-Dimensionen (5 Composite + Kultur)', () => {
		expect(DIMS.map((d) => d.key)).toEqual([
			'ruheLuft',
			'gruenHitze',
			'mobilitaet',
			'versorgung',
			'wohnschutz',
			'kultur'
		]);
	});
});

describe('buildInput Kriminalitäts-Exklusion', () => {
	it('nimmt keine Kriminalitäts-Dimension in den Input', () => {
		const input = buildInput('kiez', area({ kriminalitaet: 95 }));
		expect(input.dims.some((d) => /kriminalit/i.test(d.label))).toBe(false);
		expect(input.dims).toHaveLength(6);
	});

	it('inputHash ist stabil gegenüber dem Kriminalitäts-Wert', () => {
		const ohne = hashInput(buildInput('kiez', area()));
		const niedrig = hashInput(buildInput('kiez', area({ kriminalitaet: 5 })));
		const hoch = hashInput(buildInput('kiez', area({ kriminalitaet: 100 })));
		expect(niedrig).toBe(ohne);
		expect(hoch).toBe(ohne);
	});
});
