import { describe, expect, it } from 'vitest';
import { computeDimensionScore, computeKiezScore } from './compute-score.js';
import {
	RUHE_LUFT_CONFIG,
	GRUEN_HITZE_CONFIG,
	MOBILITAET_CONFIG,
	VERSORGUNG_CONFIG,
	WOHNSCHUTZ_CONFIG
} from './dimension-config.js';
import type { LayerHitLike, NearestStopLike, ScoreInput, Modus } from './types.js';

function makeHit(layer: string, value: unknown, updatedAt?: string): LayerHitLike {
	return updatedAt !== undefined ? { layer, value, updatedAt } : { layer, value };
}

function emptyStops(): Record<Modus, NearestStopLike | null> {
	return { ubahn: null, sbahn: null, tram: null, bus: null };
}

function emptyInput(overrides: Partial<ScoreInput> = {}): ScoreInput {
	return {
		layerHits: [],
		nearestStops: emptyStops(),
		...overrides
	};
}

describe('computeDimensionScore — Ruhe & Luft', () => {
	it('berechnet gewichteten Score nur aus laerm + luft (kein Bioklima mehr)', () => {
		const input = emptyInput({
			layerHits: [
				makeHit('laerm-2023', { kategorie: 'gering' }, '2024-01-01T00:00:00.000Z'),
				makeHit('luft-2023', { kategorie: 'mittel' }, '2024-01-01T00:00:00.000Z')
			]
		});
		const score = computeDimensionScore(RUHE_LUFT_CONFIG, input);
		// laerm 100 * 0.5 + luft 50 * 0.5 = 75
		expect(score.value).toBe(75);
		expect(score.missingData).toEqual([]);
		expect(score.dataStand).toBe('2024-01-01T00:00:00.000Z');
	});

	it('hat keinen Umweltgerechtigkeit-Fallback mehr → value null wenn laerm + luft fehlen', () => {
		const input = emptyInput({
			layerHits: [makeHit('umweltgerechtigkeit-2023', { kategorie: 'mittel' })]
		});
		const score = computeDimensionScore(RUHE_LUFT_CONFIG, input);
		expect(score.value).toBeNull();
		expect(score.missingData).toEqual(['laerm-2023', 'luft-2023']);
	});

	it('überspringt LayerHit mit reason und meldet missingData', () => {
		const input = emptyInput({
			layerHits: [
				{ layer: 'laerm-2023', value: null, reason: 'no-coverage' },
				makeHit('luft-2023', { kategorie: 'mittel' })
			]
		});
		const score = computeDimensionScore(RUHE_LUFT_CONFIG, input);
		expect(score.missingData).toEqual(['laerm-2023']);
		// nur luft 50 * 0.5 → 50 / 0.5 = 50
		expect(score.value).toBe(50);
	});
});

describe('computeDimensionScore — Grün & Hitze', () => {
	it('mappt Grün-Versorgung + Grünanlagen + Bioklima + PET + Klima-Presence zu Voll-Score', () => {
		const input = emptyInput({
			layerHits: [
				makeHit('gruenversorgung-2023', { kategorie: 'sehr hoch' }), // 100
				makeHit('gruenanlagen', { distanceM: 0 }), // 100
				makeHit('bioklima-2023', { kategorie: 'gering' }), // 100
				makeHit('klima-pet-2022', { pet14h: 29 }), // 100
				makeHit('klima-kaltlufteinwirkbereich-2022', { foo: 'bar' }), // 100
				makeHit('klima-leitbahnkorridor-2022', { foo: 'baz' }) // 100
			]
		});
		const score = computeDimensionScore(GRUEN_HITZE_CONFIG, input);
		expect(score.value).toBe(100);
		expect(score.missingData).toEqual([]);
	});

	it('Bioklima ist hier (aus Ruhe-Luft gewandert) und wird ordinal-3 normalisiert', () => {
		const input = emptyInput({
			layerHits: [makeHit('bioklima-2023', { kategorie: 'hoch' })]
		});
		const score = computeDimensionScore(GRUEN_HITZE_CONFIG, input);
		const bioklima = score.sources.find((s) => s.layer === 'bioklima-2023');
		expect(bioklima?.normalizedValue).toBe(0);
	});

	it('klima-pet-2022 numerisch invertiert (35 °C → 50)', () => {
		const input = emptyInput({
			layerHits: [makeHit('klima-pet-2022', { pet14h: 35 })]
		});
		const score = computeDimensionScore(GRUEN_HITZE_CONFIG, input);
		const pet = score.sources.find((s) => s.layer === 'klima-pet-2022');
		expect(pet?.normalizedValue).toBe(50);
	});
});

describe('computeDimensionScore — Mobilität', () => {
	it('berechnet Distance-basiert via nearestStops', () => {
		const input: ScoreInput = {
			layerHits: [],
			nearestStops: {
				ubahn: { distanceM: 0 }, // 100
				sbahn: { distanceM: 500 }, // 50
				tram: null, // 0
				bus: { distanceM: 1000 } // 0
			}
		};
		const score = computeDimensionScore(MOBILITAET_CONFIG, input);
		// 100*0.35 + 50*0.25 + 0*0.20 + 0*0.10 + 0*0.10 = 47.5
		expect(score.value).toBe(47.5);
	});

	it('presence-any-of: Radverkehrsnetz vorhanden → 100', () => {
		const input: ScoreInput = {
			layerHits: [makeHit('radverkehrsnetz-2025', { foo: 'bar' })],
			nearestStops: emptyStops()
		};
		const score = computeDimensionScore(MOBILITAET_CONFIG, input);
		// 0*0.35 + 0*0.25 + 0*0.20 + 0*0.10 + 100*0.10 = 10
		expect(score.value).toBe(10);
	});
});

describe('computeDimensionScore — Versorgung (ohne Grünanlagen)', () => {
	it('berechnet Distance-basiert pro POI-Layer mit individuellen Thresholds', () => {
		const input = emptyInput({
			layerHits: [
				makeHit('kitas-2024', { distanceM: 250 }),
				makeHit('schulen-2024', { distanceM: 400 }),
				makeHit('krankenhaeuser-plan', { distanceM: 1000 }),
				makeHit('spielplaetze', { distanceM: 200 })
			]
		});
		const score = computeDimensionScore(VERSORGUNG_CONFIG, input);
		expect(score.value).not.toBeNull();
		expect((score.value as number) > 0).toBe(true);
		expect(score.missingData).toEqual([]);
	});

	it('Grünanlagen ist KEIN Versorgungs-Layer mehr (nach Grün & Hitze gewandert)', () => {
		const slugs = VERSORGUNG_CONFIG.layers.map((l) => l.layer);
		expect(slugs).not.toContain('gruenanlagen');
	});

	it('fehlender POI-Layer-Hit → missingData-Eintrag', () => {
		const input = emptyInput({
			layerHits: [makeHit('kitas-2024', { distanceM: 100 })]
		});
		const score = computeDimensionScore(VERSORGUNG_CONFIG, input);
		expect(score.missingData).toContain('schulen-2024');
		expect(score.missingData).toContain('krankenhaeuser-plan');
		expect(score.missingData).toContain('spielplaetze');
	});
});

describe('computeDimensionScore — Wohnschutz (Milieuschutz presence-any-of)', () => {
	it('innerhalb eines Milieuschutz-Gebiets → 100 (positiv-eindeutig)', () => {
		const input = emptyInput({
			layerHits: [makeHit('milieuschutz-erhaltungsmiete', { foo: 1 })]
		});
		const score = computeDimensionScore(WOHNSCHUTZ_CONFIG, input);
		expect(score.value).toBe(100);
	});

	it('zweiter Milieuschutz-Layer triggert ebenfalls (ODER-Verknüpfung)', () => {
		const input = emptyInput({
			layerHits: [makeHit('milieuschutz-staedtebau', { foo: 1 })]
		});
		const score = computeDimensionScore(WOHNSCHUTZ_CONFIG, input);
		expect(score.value).toBe(100);
	});

	it('kein Milieuschutz-Gebiet → 0 (kein Schutz, aber nicht missing)', () => {
		const score = computeDimensionScore(WOHNSCHUTZ_CONFIG, emptyInput());
		expect(score.value).toBe(0);
		expect(score.missingData).toEqual([]);
	});
});

describe('computeKiezScore', () => {
	it('liefert die fünf neuen Dimensionen in fester Reihenfolge', () => {
		const score = computeKiezScore(emptyInput());
		expect(score.persona).toBe('allgemein');
		expect(score.dimensions.map((d) => d.dimension)).toEqual([
			'ruhe-luft',
			'gruen-hitze',
			'mobilitaet',
			'versorgung',
			'wohnschutz'
		]);
	});

	it('missingDimensions enthält nur Dimensionen ohne Wert (Mobilität + Wohnschutz liefern 0)', () => {
		const score = computeKiezScore(emptyInput());
		expect(score.missingDimensions).toEqual(['ruhe-luft', 'gruen-hitze', 'versorgung']);
	});

	it('referenziert weder soziale-lage noch gruen als Dimension', () => {
		const score = computeKiezScore(emptyInput());
		const dims = score.dimensions.map((d) => d.dimension) as string[];
		expect(dims).not.toContain('soziale-lage');
		expect(dims).not.toContain('gruen');
	});

	it('Voll-Coverage liefert alle Dimensionen ohne missing', () => {
		const input: ScoreInput = {
			layerHits: [
				makeHit('laerm-2023', { kategorie: 'gering' }),
				makeHit('luft-2023', { kategorie: 'gering' }),
				makeHit('gruenversorgung-2023', { kategorie: 'hoch' }),
				makeHit('gruenanlagen', { distanceM: 300 }),
				makeHit('bioklima-2023', { kategorie: 'gering' }),
				makeHit('klima-pet-2022', { pet14h: 30 }),
				makeHit('klima-kaltlufteinwirkbereich-2022', { foo: 1 }),
				makeHit('klima-leitbahnkorridor-2022', { foo: 1 }),
				makeHit('kitas-2024', { distanceM: 200 }),
				makeHit('schulen-2024', { distanceM: 300 }),
				makeHit('krankenhaeuser-plan', { distanceM: 1000 }),
				makeHit('spielplaetze', { distanceM: 150 }),
				makeHit('milieuschutz-erhaltungsmiete', { foo: 1 })
			],
			nearestStops: {
				ubahn: { distanceM: 200 },
				sbahn: { distanceM: 400 },
				tram: { distanceM: 200 },
				bus: { distanceM: 100 }
			}
		};
		const score = computeKiezScore(input);
		expect(score.missingDimensions).toEqual([]);
		for (const dim of score.dimensions) {
			expect(dim.value).not.toBeNull();
		}
	});

	it('overall = Mittel über usable Dim-Values, 0..100', () => {
		const score = computeKiezScore({ layerHits: [], nearestStops: null });
		// Mobilität + Wohnschutz liefern 0, Rest null → overall = 0
		expect(score.overall).toBe(0);
	});
});
