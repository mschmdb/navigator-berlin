import { describe, expect, it } from 'vitest';
import { computeDimensionScore, computeKiezScore } from './compute-score.js';
import {
	RUHE_LUFT_CONFIG,
	GRUEN_CONFIG,
	MOBILITAET_CONFIG,
	SOZIALE_LAGE_CONFIG,
	VERSORGUNG_CONFIG
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

describe('computeDimensionScore — Ruhe-Luft', () => {
	it('berechnet gewichteten Score aus drei Roh-Layern', () => {
		const input = emptyInput({
			layerHits: [
				makeHit('laerm-2023', { kategorie: 'gering' }, '2024-01-01T00:00:00.000Z'),
				makeHit('luft-2023', { kategorie: 'mittel' }, '2024-01-01T00:00:00.000Z'),
				makeHit('bioklima-2023', { kategorie: 'hoch' }, '2024-01-01T00:00:00.000Z')
			]
		});
		const score = computeDimensionScore(RUHE_LUFT_CONFIG, input);
		// laerm 100 * 0.4 + luft 50 * 0.4 + bioklima 0 * 0.2 = 60
		expect(score.value).toBe(60);
		expect(score.missingData).toEqual([]);
		expect(score.dataStand).toBe('2024-01-01T00:00:00.000Z');
	});

	it('nutzt Coverage-Fallback (umweltgerechtigkeit-2023) wenn alle Roh-Layer fehlen', () => {
		const input = emptyInput({
			layerHits: [makeHit('umweltgerechtigkeit-2023', { kategorie: 'mittel' })]
		});
		const score = computeDimensionScore(RUHE_LUFT_CONFIG, input);
		expect(score.value).toBe(50);
		expect(score.missingData).toEqual(['laerm-2023', 'luft-2023', 'bioklima-2023']);
		expect(score.sources.find((s) => s.layer === 'umweltgerechtigkeit-2023')).toBeDefined();
	});

	it('liefert value=null + missingDimension wenn weder Roh- noch Fallback verfügbar', () => {
		const score = computeDimensionScore(RUHE_LUFT_CONFIG, emptyInput());
		expect(score.value).toBeNull();
		expect(score.missingData).toEqual(['laerm-2023', 'luft-2023', 'bioklima-2023']);
	});

	it('überspringt LayerHit mit reason (no-coverage etc.) und meldet missingData', () => {
		const input = emptyInput({
			layerHits: [
				{ layer: 'laerm-2023', value: null, reason: 'no-coverage' },
				makeHit('luft-2023', { kategorie: 'mittel' }),
				makeHit('bioklima-2023', { kategorie: 'gering' })
			]
		});
		const score = computeDimensionScore(RUHE_LUFT_CONFIG, input);
		expect(score.missingData).toEqual(['laerm-2023']);
		// luft 50 * 0.4 + bioklima 100 * 0.2 = 20 + 20 = 40, total weight 0.6 → 40/0.6 ≈ 66.7
		expect(score.value).toBeCloseTo(66.7, 1);
	});
});

describe('computeDimensionScore — Grün', () => {
	it('mappt gruenversorgung ordinal-4 + Presence-Layer', () => {
		const input = emptyInput({
			layerHits: [
				makeHit('gruenversorgung-2023', { kategorie: 'sehr hoch' }),
				makeHit('klima-kaltlufteinwirkbereich-2022', { foo: 'bar' }),
				makeHit('klima-leitbahnkorridor-2022', { foo: 'baz' })
			]
		});
		const score = computeDimensionScore(GRUEN_CONFIG, input);
		// 100*0.6 + 100*0.2 + 100*0.2 = 100
		expect(score.value).toBe(100);
	});

	it('Presence-Layer fehlend → niedrigerer Score', () => {
		const input = emptyInput({
			layerHits: [makeHit('gruenversorgung-2023', { kategorie: 'mittel' })]
		});
		const score = computeDimensionScore(GRUEN_CONFIG, input);
		// nur gruenversorgung=33 mit weight 0.6 → 33
		expect(score.value).toBe(33);
		expect(score.missingData).toEqual([
			'klima-kaltlufteinwirkbereich-2022',
			'klima-leitbahnkorridor-2022'
		]);
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
		// Nur Radverkehrs-Layer hat normalizedValue 100 mit weight 0.10 → 100
		// Andere Stops sind 0 mit Weight, aber 0-Werte zählen mit
		// 0*0.35 + 0*0.25 + 0*0.20 + 0*0.10 + 100*0.10 = 10
		expect(score.value).toBe(10);
	});
});

describe('computeDimensionScore — Soziale Lage (MSS)', () => {
	it('mappt mss-gesamtindex-2025 Status si_v auf MssStatus4', () => {
		const input = emptyInput({
			layerHits: [
				makeHit('mss-gesamtindex-2025', {
					si_v: 'mittel',
					kom: 'gültig'
				})
			]
		});
		const score = computeDimensionScore(SOZIALE_LAGE_CONFIG, input);
		expect(score.value).toBe(66);
	});

	it('intrinsicGuard: kom != "gültig" → missingData + value null', () => {
		const input = emptyInput({
			layerHits: [
				makeHit('mss-gesamtindex-2025', {
					si_v: 'mittel',
					kom: 'Ausreißer'
				})
			]
		});
		const score = computeDimensionScore(SOZIALE_LAGE_CONFIG, input);
		expect(score.value).toBeNull();
		expect(score.missingData).toEqual(['mss-gesamtindex-2025']);
	});

	it('fehlender MSS-Hit → missingData + value null', () => {
		const score = computeDimensionScore(SOZIALE_LAGE_CONFIG, emptyInput());
		expect(score.value).toBeNull();
		expect(score.missingData).toEqual(['mss-gesamtindex-2025']);
	});
});

describe('computeKiezScore — Composite (overall)', () => {
	it('overall = Mittel über usable Dim-Values, gerundet auf 1 Nachkommastelle', () => {
		const input: ScoreInput = {
			layerHits: [
				makeHit('laerm-2023', { kategorie: 'gering' }),
				makeHit('luft-2023', { kategorie: 'gering' }),
				makeHit('bioklima-2023', { kategorie: 'gering' }),
				makeHit('gruenversorgung-2023', { kategorie: 'hoch' }),
				makeHit('klima-kaltlufteinwirkbereich-2022', { foo: 1 }),
				makeHit('klima-leitbahnkorridor-2022', { foo: 1 }),
				makeHit('mss-gesamtindex-2025', { si_v: 'mittel', kom: 'gültig' }),
				makeHit('kitas-2024', { distanceM: 100 }),
				makeHit('schulen-2024', { distanceM: 100 }),
				makeHit('krankenhaeuser-plan', { distanceM: 100 }),
				makeHit('spielplaetze', { distanceM: 100 }),
				makeHit('gruenanlagen', { distanceM: 100 })
			],
			nearestStops: {
				ubahn: { distanceM: 200 },
				sbahn: { distanceM: 200 },
				tram: { distanceM: 200 },
				bus: { distanceM: 100 }
			}
		};
		const score = computeKiezScore(input);
		expect(typeof score.overall).toBe('number');
		expect((score.overall as number) > 0).toBe(true);
		expect((score.overall as number) <= 100).toBe(true);
	});

	it('overall ist mind. 0 (Mobilität mit leerem Stops-Index liefert 0)', () => {
		const score = computeKiezScore({
			layerHits: [],
			nearestStops: null
		});
		// Mobilität liefert immer eine Zahl (auch 0); andere Dim null. overall = 0 / 1.
		expect(score.overall).toBe(0);
	});

	it('overall ignoriert missing Dimensionen (rein non-null-Mittel)', () => {
		const input = emptyInput({
			layerHits: [makeHit('laerm-2023', { kategorie: 'gering' })]
		});
		const score = computeKiezScore(input);
		expect(score.overall).not.toBeUndefined();
	});
});

describe('computeKiezScore', () => {
	it('liefert fünf Dimensionen + missingDimensions-Liste', () => {
		const input = emptyInput();
		const score = computeKiezScore(input);
		expect(score.persona).toBe('allgemein');
		expect(score.dimensions.map((d) => d.dimension)).toEqual([
			'ruhe-luft',
			'gruen',
			'mobilitaet',
			'soziale-lage',
			'versorgung'
		]);
		// Mobilität hat immer einen Wert (auch wenn 0), andere null
		expect(score.missingDimensions).toEqual([
			'ruhe-luft',
			'gruen',
			'soziale-lage',
			'versorgung'
		]);
	});

	it('Voll-Coverage liefert alle Dimensionen ohne missing', () => {
		const input: ScoreInput = {
			layerHits: [
				makeHit('laerm-2023', { kategorie: 'gering' }),
				makeHit('luft-2023', { kategorie: 'gering' }),
				makeHit('bioklima-2023', { kategorie: 'gering' }),
				makeHit('gruenversorgung-2023', { kategorie: 'hoch' }),
				makeHit('klima-kaltlufteinwirkbereich-2022', { foo: 1 }),
				makeHit('klima-leitbahnkorridor-2022', { foo: 1 }),
				makeHit('mss-gesamtindex-2025', { si_v: 'hoch', kom: 'gültig' }),
				makeHit('kitas-2024', { distanceM: 200 }),
				makeHit('schulen-2024', { distanceM: 300 }),
				makeHit('krankenhaeuser-plan', { distanceM: 1000 }),
				makeHit('spielplaetze', { distanceM: 150 }),
				makeHit('gruenanlagen', { distanceM: 300 })
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
});

describe('computeDimensionScore — Versorgung', () => {
	it('berechnet Distance-basiert pro POI-Layer mit individuellen Thresholds', () => {
		const input = emptyInput({
			layerHits: [
				makeHit('kitas-2024', { distanceM: 250 }),
				makeHit('schulen-2024', { distanceM: 400 }),
				makeHit('krankenhaeuser-plan', { distanceM: 1000 }),
				makeHit('spielplaetze', { distanceM: 200 }),
				makeHit('gruenanlagen', { distanceM: 300 })
			]
		});
		const score = computeDimensionScore(VERSORGUNG_CONFIG, input);
		expect(score.value).not.toBeNull();
		expect((score.value as number) > 0).toBe(true);
		expect(score.missingData).toEqual([]);
	});

	it('Distance über Threshold liefert normalizedValue 0', () => {
		const input = emptyInput({
			layerHits: [makeHit('kitas-2024', { distanceM: 2000 })]
		});
		const score = computeDimensionScore(VERSORGUNG_CONFIG, input);
		const kita = score.sources.find((s) => s.layer === 'kitas-2024');
		expect(kita?.normalizedValue).toBe(0);
	});

	it('fehlender POI-Layer-Hit → missingData-Eintrag', () => {
		const input = emptyInput({
			layerHits: [makeHit('kitas-2024', { distanceM: 100 })]
		});
		const score = computeDimensionScore(VERSORGUNG_CONFIG, input);
		expect(score.missingData).toContain('schulen-2024');
		expect(score.missingData).toContain('krankenhaeuser-plan');
	});
});
