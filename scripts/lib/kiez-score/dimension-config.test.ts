import { describe, expect, it } from 'vitest';
import { DIMENSION_CONFIGS } from './dimension-config.js';
import {
	KIEZ_SCORE_DIMENSIONS,
	DIMENSION_WEIGHTS,
	COMPOSITE_DIMENSIONS,
	type KiezScoreDimension
} from './types.js';

describe('KIEZ_SCORE_DIMENSIONS', () => {
	it('listet exakt die sieben Dimensionen in fester Reihenfolge (Story 14.1: + Kriminalität)', () => {
		expect([...KIEZ_SCORE_DIMENSIONS]).toEqual([
			'ruhe-luft',
			'gruen-hitze',
			'mobilitaet',
			'versorgung',
			'wohnschutz',
			'kultur',
			'kriminalitaet'
		]);
	});

	it('enthält weder soziale-lage noch gruen', () => {
		const dims = KIEZ_SCORE_DIMENSIONS as readonly string[];
		expect(dims).not.toContain('soziale-lage');
		expect(dims).not.toContain('gruen');
	});
});

describe('COMPOSITE_DIMENSIONS (Option C)', () => {
	it('umfasst die fünf Composite-Dimensionen ohne Kultur', () => {
		expect([...COMPOSITE_DIMENSIONS]).toEqual([
			'ruhe-luft',
			'gruen-hitze',
			'mobilitaet',
			'versorgung',
			'wohnschutz'
		]);
		expect(COMPOSITE_DIMENSIONS).not.toContain('kultur' as KiezScoreDimension);
		expect(COMPOSITE_DIMENSIONS).not.toContain('kriminalitaet' as KiezScoreDimension);
	});
});

describe('DIMENSION_WEIGHTS', () => {
	it('hat genau sieben Keys (Kultur + Kriminalität mit Gewicht 0, Option C)', () => {
		expect(Object.keys(DIMENSION_WEIGHTS)).toHaveLength(7);
		expect(DIMENSION_WEIGHTS.kultur).toBe(0);
		expect(DIMENSION_WEIGHTS.kriminalitaet).toBe(0);
	});

	it('summiert sich auf 1 (5 Composite-Dimensionen × 0.20, Kultur + Kriminalität 0)', () => {
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

	it('Versorgung enthält Nahversorgung-Lebensmittel als poi-density-Term (Story 12.1)', () => {
		const versorgung = DIMENSION_CONFIGS.find((c) => c.dimension === 'versorgung')!;
		const food = versorgung.layers.find((l) => l.layer === 'nahversorgung-lebensmittel');
		expect(food, 'nahversorgung-lebensmittel fehlt in VERSORGUNG_CONFIG').toBeDefined();
		expect(food!.normalize.kind).toBe('poi-density');
		if (food!.normalize.kind === 'poi-density') {
			expect(food!.normalize.radiusM).toBeLessThanOrEqual(600);
		}
	});

	it('Versorgung enthält Apotheke + Post als poi-density-Terme (Story 12.2)', () => {
		const versorgung = DIMENSION_CONFIGS.find((c) => c.dimension === 'versorgung')!;
		for (const slug of ['nahversorgung-apotheke', 'nahversorgung-post']) {
			const term = versorgung.layers.find((l) => l.layer === slug);
			expect(term, `${slug} fehlt in VERSORGUNG_CONFIG`).toBeDefined();
			expect(term!.normalize.kind).toBe('poi-density');
		}
	});

	it('Versorgung: finale interne Gewichts-Verteilung (Story 12.3, öffentlich + privat)', () => {
		const versorgung = DIMENSION_CONFIGS.find((c) => c.dimension === 'versorgung')!;
		const w: Record<string, number> = {};
		for (const l of versorgung.layers) w[l.layer] = l.weight;
		// Daseinsvorsorge
		expect(w['kitas-2024']).toBeCloseTo(0.12, 10);
		expect(w['kitas-pro-kind']).toBeCloseTo(0.12, 10);
		expect(w['schulen-grundschule']).toBeCloseTo(0.12, 10);
		expect(w['schulen-weiterfuehrend']).toBeCloseTo(0.12, 10);
		expect(w['krankenhaeuser-plan']).toBeCloseTo(0.18, 10);
		expect(w['spielplaetze']).toBeCloseTo(0.1, 10);
		// Nahversorgung (privat) = 0.24 gesamt
		const nahversorgung =
			w['nahversorgung-lebensmittel'] + w['nahversorgung-apotheke'] + w['nahversorgung-post'];
		expect(nahversorgung).toBeCloseTo(0.24, 10);
		expect(w['nahversorgung-lebensmittel']).toBeCloseTo(0.12, 10);
		expect(w['nahversorgung-apotheke']).toBeCloseTo(0.07, 10);
		expect(w['nahversorgung-post']).toBeCloseTo(0.05, 10);
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

	it('Kultur (Story 13.1) hat acht log-gedämpfte poi-density-Terme, Summe 1.0', () => {
		const kultur = DIMENSION_CONFIGS.find((c) => c.dimension === 'kultur')!;
		expect(kultur, 'KULTUR_CONFIG fehlt in DIMENSION_CONFIGS').toBeDefined();
		expect(kultur.layers).toHaveLength(8);
		for (const l of kultur.layers) {
			expect(l.normalize.kind).toBe('poi-density');
			if (l.normalize.kind === 'poi-density') expect(l.normalize.scale).toBe('log');
		}
		const sum = kultur.layers.reduce((a, l) => a + l.weight, 0);
		expect(sum).toBeCloseTo(1, 10);
	});

	it('Kriminalität (Story 14.1) ist ein Single-Precomputed-Term, liest index, nicht invertiert', () => {
		const krimi = DIMENSION_CONFIGS.find((c) => c.dimension === 'kriminalitaet')!;
		expect(krimi, 'KRIMINALITAET_CONFIG fehlt in DIMENSION_CONFIGS').toBeDefined();
		expect(krimi.layers).toHaveLength(1);
		const term = krimi.layers[0];
		expect(term.layer).toBe('kriminalitaet');
		expect(term.weight).toBe(1);
		expect(term.normalize.kind).toBe('numeric'); // nicht numeric-inverted (kein Sicherheitsmaß)
		if (term.normalize.kind === 'numeric') {
			expect(term.normalize.field).toBe('index');
			expect(term.normalize.maxAt).toBeGreaterThan(term.normalize.minAt);
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
