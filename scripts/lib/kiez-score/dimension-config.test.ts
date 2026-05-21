import { describe, expect, it } from 'vitest';
import { DIMENSION_CONFIGS } from './dimension-config.js';
import { KIEZ_SCORE_DIMENSIONS, DIMENSION_WEIGHTS, type KiezScoreDimension } from './types.js';

describe('KIEZ_SCORE_DIMENSIONS', () => {
	it('listet exakt die fünf neuen Dimensionen in fester Reihenfolge', () => {
		expect([...KIEZ_SCORE_DIMENSIONS]).toEqual([
			'ruhe-luft',
			'gruen-hitze',
			'mobilitaet',
			'versorgung',
			'wohnschutz'
		]);
	});

	it('enthält weder soziale-lage noch gruen', () => {
		const dims = KIEZ_SCORE_DIMENSIONS as readonly string[];
		expect(dims).not.toContain('soziale-lage');
		expect(dims).not.toContain('gruen');
	});
});

describe('DIMENSION_WEIGHTS', () => {
	it('hat genau fünf Keys', () => {
		expect(Object.keys(DIMENSION_WEIGHTS)).toHaveLength(5);
	});

	it('summiert sich auf 1 (5 × 0.20)', () => {
		const sum = Object.values(DIMENSION_WEIGHTS).reduce((a, b) => a + b, 0);
		expect(sum).toBeCloseTo(1, 10);
	});

	it('deckt jede Dimension aus KIEZ_SCORE_DIMENSIONS ab', () => {
		for (const dim of KIEZ_SCORE_DIMENSIONS) {
			expect(DIMENSION_WEIGHTS[dim]).toBeTypeOf('number');
		}
	});
});

describe('DIMENSION_CONFIGS', () => {
	it('hat eine Config pro Dimension, in Dimensions-Reihenfolge', () => {
		expect(DIMENSION_CONFIGS.map((c) => c.dimension)).toEqual([...KIEZ_SCORE_DIMENSIONS]);
	});

	it('interne Layer-Gewichte summieren sich pro Dimension auf 1', () => {
		for (const config of DIMENSION_CONFIGS) {
			const sum = config.layers.reduce((a, l) => a + l.weight, 0);
			expect(sum).toBeCloseTo(1, 10);
		}
	});

	it('Ruhe & Luft enthält nur laerm + luft (kein Bioklima, kein Fallback)', () => {
		const ruheLuft = DIMENSION_CONFIGS.find((c) => c.dimension === 'ruhe-luft')!;
		expect(ruheLuft.layers.map((l) => l.layer)).toEqual(['laerm-db', 'luft-2023']);
		expect(ruheLuft.fallback).toBeUndefined();
	});

	it('Grün & Hitze enthält Bioklima + Grünanlagen + PET', () => {
		const gruenHitze = DIMENSION_CONFIGS.find((c) => c.dimension === 'gruen-hitze')!;
		const slugs = gruenHitze.layers.map((l) => l.layer);
		expect(slugs).toContain('bioklima-2023');
		expect(slugs).toContain('gruenanlagen');
		expect(slugs).toContain('klima-pet-2022');
	});

	it('keine Config referenziert MSS oder Umweltgerechtigkeit als Score-Input', () => {
		for (const config of DIMENSION_CONFIGS) {
			const slugs = [
				...config.layers.map((l) => l.layer),
				...(config.fallback ? [config.fallback.layer] : [])
			];
			expect(slugs).not.toContain('mss-gesamtindex-2025');
			expect(slugs).not.toContain('umweltgerechtigkeit-2023');
		}
	});

	it('Wohnschutz nutzt presence-any-of über beide Milieuschutz-Layer', () => {
		const wohnschutz = DIMENSION_CONFIGS.find((c) => c.dimension === 'wohnschutz')!;
		const layer = wohnschutz.layers[0]!;
		expect(layer.normalize.kind).toBe('presence-any-of');
		if (layer.normalize.kind === 'presence-any-of') {
			expect(layer.normalize.layers).toEqual([
				'milieuschutz-erhaltungsmiete',
				'milieuschutz-staedtebau'
			]);
		}
	});

	it('intrinsicGuard (soziale-lage-Pfad) ist auf keiner Config mehr gesetzt', () => {
		const dims = DIMENSION_CONFIGS.map((c) => c.dimension) as KiezScoreDimension[];
		expect(dims).not.toContain('soziale-lage' as KiezScoreDimension);
		for (const config of DIMENSION_CONFIGS) {
			expect(config.intrinsicGuard).toBeUndefined();
		}
	});
});
