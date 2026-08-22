import { describe, expect, it } from 'vitest';
import { COLORS } from './colors.js';
import {
	DIMENSION_RAMPS,
	KALTLUFT_HIGHLIGHT,
	rampForSlug,
	type DimensionRampKey
} from './dimension-ramps.js';

const HEX = /^#[0-9A-Fa-f]{6}$/;

function oklabL(hex: string): number {
	const [r, g, b] = [1, 3, 5]
		.map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
		.map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
	const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
	const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
	const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
	return 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
}

describe('DIMENSION_RAMPS', () => {
	it('liefert für jede Dimension fünf Hex-Stufen', () => {
		for (const ramp of Object.values(DIMENSION_RAMPS)) {
			expect(ramp).toHaveLength(5);
			for (const hex of ramp) expect(hex).toMatch(HEX);
		}
	});

	it('fällt jede Rampe monoton von hell nach dunkel ab (hell→dunkel = besser)', () => {
		for (const ramp of Object.values(DIMENSION_RAMPS)) {
			for (let i = 1; i < ramp.length; i++) {
				expect(oklabL(ramp[i])).toBeLessThan(oklabL(ramp[i - 1]));
			}
		}
	});

	it('gesamt und gruen-hitze behalten die Gut-Grün-Rampe (Score-Identität)', () => {
		expect(DIMENSION_RAMPS.gesamt).toEqual([
			COLORS.scaleGut1,
			COLORS.scaleGut2,
			COLORS.scaleGut3,
			COLORS.scaleGut4,
			COLORS.scaleGut5
		]);
		expect(DIMENSION_RAMPS['gruen-hitze']).toEqual(DIMENSION_RAMPS.gesamt);
	});

	it('gibt jeder übrigen Dimension eine eigene, von Grün verschiedene Rampe', () => {
		const keys: DimensionRampKey[] = [
			'ruhe-luft',
			'mobilitaet',
			'versorgung',
			'wohnschutz',
			'kultur'
		];
		const seen = new Set<string>();
		for (const key of keys) {
			const anchor = DIMENSION_RAMPS[key][4];
			expect(anchor).not.toBe(COLORS.scaleGut5);
			expect(seen.has(anchor)).toBe(false);
			seen.add(anchor);
		}
	});
});

describe('rampForSlug', () => {
	it('mappt jeden Kiez-Score-Layer auf seine Dimension-Rampe', () => {
		expect(rampForSlug('kiez-score-gesamt')).toEqual(DIMENSION_RAMPS.gesamt);
		expect(rampForSlug('kiez-score-ruhe-luft')).toEqual(DIMENSION_RAMPS['ruhe-luft']);
		expect(rampForSlug('kiez-score-gruen-hitze')).toEqual(DIMENSION_RAMPS['gruen-hitze']);
		expect(rampForSlug('kiez-score-mobilitaet')).toEqual(DIMENSION_RAMPS.mobilitaet);
		expect(rampForSlug('kiez-score-versorgung')).toEqual(DIMENSION_RAMPS.versorgung);
		expect(rampForSlug('kiez-score-wohnschutz')).toEqual(DIMENSION_RAMPS.wohnschutz);
		expect(rampForSlug('kiez-score-kultur')).toEqual(DIMENSION_RAMPS.kultur);
	});

	it('lässt Kriminalität auf der Strukturell-Rampe (ADR-019)', () => {
		expect(rampForSlug('kiez-score-kriminalitaet')).toEqual([
			COLORS.scaleStrukturell1,
			COLORS.scaleStrukturell2,
			COLORS.scaleStrukturell3,
			COLORS.scaleStrukturell4,
			COLORS.scaleStrukturell5
		]);
	});

	it('liefert für Nicht-Score-Slugs null (Familien-System bleibt zuständig)', () => {
		expect(rampForSlug('laerm-2023')).toBeNull();
		expect(rampForSlug('bodenrichtwerte')).toBeNull();
		expect(rampForSlug('unbekannt')).toBeNull();
	});
});

describe('KALTLUFT_HIGHLIGHT', () => {
	it('ist ein helles Cyan, klar getrennt vom Score-Grün chartCat3', () => {
		expect(KALTLUFT_HIGHLIGHT).toMatch(HEX);
		expect(KALTLUFT_HIGHLIGHT).not.toBe(COLORS.chartCat3);
		// Hell: deutlich über den dunklen Rampen-Ankern, damit die Fläche als
		// Wash liest statt als weitere Choroplethen-Stufe.
		expect(oklabL(KALTLUFT_HIGHLIGHT)).toBeGreaterThan(0.62);
	});
});
