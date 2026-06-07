import { describe, expect, it } from 'vitest';
import { computeDimensionScore, computeKiezScore, computeOverallScore } from './compute-score.js';
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
	it('berechnet gewichteten Score aus laerm-dB + luft (Story 10.6b)', () => {
		const input = emptyInput({
			layerHits: [
				makeHit('laerm-db', { ges_den: 45 }, '2024-01-01T00:00:00.000Z'),
				makeHit('luft-2023', { kategorie: 'mittel' }, '2024-01-01T00:00:00.000Z')
			]
		});
		const score = computeDimensionScore(RUHE_LUFT_CONFIG, input);
		// laerm-dB 45 dB → 100 * 0.5 + luft 50 * 0.5 = 75
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
		expect(score.missingData).toEqual(['laerm-db', 'luft-2023']);
	});

	it('überspringt LayerHit mit reason und meldet missingData', () => {
		const input = emptyInput({
			layerHits: [
				{ layer: 'laerm-db', value: null, reason: 'no-coverage' },
				makeHit('luft-2023', { kategorie: 'mittel' })
			]
		});
		const score = computeDimensionScore(RUHE_LUFT_CONFIG, input);
		expect(score.missingData).toEqual(['laerm-db']);
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
	it('kombiniert Dichte-, Pro-Kopf- und Kapazitäts-Terme ohne missingData', () => {
		const input = emptyInput({
			layerHits: [
				makeHit('kitas-pro-kind', { plaetzeProKind: 0.35 }),
				makeHit('krankenhaeuser-plan', { distanceM: 1000, betten_insgesamt: '500' })
			],
			poiCounts: {
				'kitas-2024': { count: 3, nearestM: 200 },
				'schulen-grundschule': { count: 2, nearestM: 300 },
				'schulen-weiterfuehrend': { count: 1, nearestM: 600 },
				spielplaetze: { count: 4, nearestM: 150 },
				// Story 12.1: Nahversorgung-Lebensmittel-Term
				'nahversorgung-lebensmittel': { count: 3, nearestM: 250 },
				// Story 12.2: Apotheke + Post
				'nahversorgung-apotheke': { count: 1, nearestM: 400 },
				'nahversorgung-post': { count: 1, nearestM: 700 }
			}
		});
		const score = computeDimensionScore(VERSORGUNG_CONFIG, input);
		expect(score.value).not.toBeNull();
		expect((score.value as number) > 0).toBe(true);
		expect(score.missingData).toEqual([]);
	});

	it('Story 10.4: mehr POIs im Radius scoren höher (zweiter Punkt zählt nicht 0)', () => {
		const many = computeDimensionScore(
			VERSORGUNG_CONFIG,
			emptyInput({ poiCounts: { 'kitas-2024': { count: 5, nearestM: 200 } } })
		);
		const one = computeDimensionScore(
			VERSORGUNG_CONFIG,
			emptyInput({ poiCounts: { 'kitas-2024': { count: 1, nearestM: 200 } } })
		);
		expect((many.value as number) > (one.value as number)).toBe(true);
	});

	it('Story 10.1: Kita-Pro-Kopf-Term scort hoch bei vielen Plätzen pro Kind', () => {
		const high = computeDimensionScore(
			VERSORGUNG_CONFIG,
			emptyInput({ layerHits: [makeHit('kitas-pro-kind', { plaetzeProKind: 0.4 })] })
		);
		const low = computeDimensionScore(
			VERSORGUNG_CONFIG,
			emptyInput({ layerHits: [makeHit('kitas-pro-kind', { plaetzeProKind: 0.05 })] })
		);
		expect((high.value as number) > (low.value as number)).toBe(true);
	});

	it('Story 10.2: großes Klinikum (viele Betten) scort bei gleicher Distanz höher', () => {
		const big = computeDimensionScore(
			VERSORGUNG_CONFIG,
			emptyInput({
				layerHits: [makeHit('krankenhaeuser-plan', { distanceM: 500, betten_insgesamt: '1377' })]
			})
		);
		const small = computeDimensionScore(
			VERSORGUNG_CONFIG,
			emptyInput({
				layerHits: [makeHit('krankenhaeuser-plan', { distanceM: 500, betten_insgesamt: '50' })]
			})
		);
		expect((big.value as number) > (small.value as number)).toBe(true);
	});

	it('Story 10.2: Krankenhaus ohne betten_insgesamt → Distanz-Fallback, kein missingData', () => {
		const score = computeDimensionScore(
			VERSORGUNG_CONFIG,
			emptyInput({ layerHits: [makeHit('krankenhaeuser-plan', { distanceM: 500 })] })
		);
		expect(score.value).not.toBeNull();
		expect(score.missingData).not.toContain('krankenhaeuser-plan');
	});

	it('Story 10.3+10.4: Grundschule (600m) und Weiterführend (1200m) eigene Radien als Dichte', () => {
		const score = computeDimensionScore(
			VERSORGUNG_CONFIG,
			emptyInput({
				poiCounts: {
					'schulen-grundschule': { count: 2, nearestM: 400 },
					'schulen-weiterfuehrend': { count: 1, nearestM: 900 }
				}
			})
		);
		expect(score.value).not.toBeNull();
		expect(score.missingData).not.toContain('schulen-grundschule');
		expect(score.missingData).not.toContain('schulen-weiterfuehrend');
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
		expect(score.missingData).toContain('schulen-grundschule');
		expect(score.missingData).toContain('schulen-weiterfuehrend');
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
	it('liefert die sechs Dimensionen in fester Reihenfolge (Story 13.1: + Kultur)', () => {
		const score = computeKiezScore(emptyInput());
		expect(score.persona).toBe('allgemein');
		expect(score.dimensions.map((d) => d.dimension)).toEqual([
			'ruhe-luft',
			'gruen-hitze',
			'mobilitaet',
			'versorgung',
			'wohnschutz',
			'kultur'
		]);
	});

	it('missingDimensions enthält Dimensionen ohne Wert (inkl. Kultur ohne poiCounts)', () => {
		const score = computeKiezScore(emptyInput());
		expect(score.missingDimensions).toEqual(['ruhe-luft', 'gruen-hitze', 'versorgung', 'kultur']);
	});

	it('Option C: Kultur zählt NICHT in den Composite (computeOverallScore ignoriert sie)', () => {
		const dims = [
			{ dimension: 'ruhe-luft', value: 50, sources: [], missingData: [], dataStand: null },
			{ dimension: 'gruen-hitze', value: 50, sources: [], missingData: [], dataStand: null },
			{ dimension: 'mobilitaet', value: 50, sources: [], missingData: [], dataStand: null },
			{ dimension: 'versorgung', value: 50, sources: [], missingData: [], dataStand: null },
			{ dimension: 'wohnschutz', value: 50, sources: [], missingData: [], dataStand: null },
			{ dimension: 'kultur', value: 100, sources: [], missingData: [], dataStand: null }
		] as const;
		// Composite = Mittel der fünf (50). Kultur (100) wird ausgefiltert, zieht den Wert nicht hoch.
		expect(computeOverallScore([...dims])).toBe(50);
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
				makeHit('laerm-db', { ges_den: 45 }),
				makeHit('luft-2023', { kategorie: 'gering' }),
				makeHit('gruenversorgung-2023', { kategorie: 'hoch' }),
				makeHit('gruenanlagen', { distanceM: 300 }),
				makeHit('bioklima-2023', { kategorie: 'gering' }),
				makeHit('klima-pet-2022', { pet14h: 30 }),
				makeHit('klima-kaltlufteinwirkbereich-2022', { foo: 1 }),
				makeHit('klima-leitbahnkorridor-2022', { foo: 1 }),
				makeHit('kitas-pro-kind', { plaetzeProKind: 0.3 }),
				makeHit('krankenhaeuser-plan', { distanceM: 1000, betten_insgesamt: '500' }),
				makeHit('milieuschutz-erhaltungsmiete', { foo: 1 })
			],
			nearestStops: {
				ubahn: { distanceM: 200 },
				sbahn: { distanceM: 400 },
				tram: { distanceM: 200 },
				bus: { distanceM: 100 }
			},
			poiCounts: {
				'kitas-2024': { count: 3, nearestM: 200 },
				'schulen-grundschule': { count: 2, nearestM: 300 },
				'schulen-weiterfuehrend': { count: 1, nearestM: 600 },
				spielplaetze: { count: 4, nearestM: 150 },
				'nahversorgung-lebensmittel': { count: 3, nearestM: 250 },
				'nahversorgung-apotheke': { count: 1, nearestM: 400 },
				'nahversorgung-post': { count: 1, nearestM: 700 },
				// Story 13.1: Kultur-Terme
				'kultur-bibliothek': { count: 1, nearestM: 400 },
				'kultur-theater': { count: 1, nearestM: 800 },
				'kultur-museum': { count: 1, nearestM: 900 },
				'kultur-kino': { count: 1, nearestM: 700 },
				'kultur-galerie': { count: 2, nearestM: 300 },
				'kultur-soziokultur': { count: 1, nearestM: 600 },
				'kultur-kunst-im-raum': { count: 4, nearestM: 150 },
				'kultur-club': { count: 2, nearestM: 500 }
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
