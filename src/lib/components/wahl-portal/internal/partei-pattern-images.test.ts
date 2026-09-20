import { describe, expect, it } from 'vitest';
import {
	buildPatternImageData,
	patternImageId,
	PATTERN_TILE_SIZE
} from './partei-pattern-images.js';
import { parteiColor, parteiPattern } from '$lib/data/partei-farben.js';

function pixelAlpha(data: Uint8ClampedArray, width: number, x: number, y: number): number {
	return data[(y * width + x) * 4 + 3];
}

function pixelRgb(
	data: Uint8ClampedArray,
	width: number,
	x: number,
	y: number
): readonly [number, number, number] {
	const idx = (y * width + x) * 4;
	return [data[idx], data[idx + 1], data[idx + 2]];
}

describe('buildPatternImageData', () => {
	it('liefert size×size RGBA-Daten (4 Bytes/Pixel)', () => {
		const spec = buildPatternImageData('solid', '#A50C1A');
		expect(spec.width).toBe(PATTERN_TILE_SIZE);
		expect(spec.height).toBe(PATTERN_TILE_SIZE);
		expect(spec.data.length).toBe(PATTERN_TILE_SIZE * PATTERN_TILE_SIZE * 4);
	});

	it('solid füllt fast jedes Pixel undurchsichtig in der Partei-Farbe, mit einem segmentierten transparenten Raster (Review-Fund #15: keine wirklich uniforme Fläche)', () => {
		const spec = buildPatternImageData('solid', '#A50C1A', 8);
		let opaqueCount = 0;
		let transparentCount = 0;
		for (let y = 0; y < 8; y++) {
			for (let x = 0; x < 8; x++) {
				const alpha = pixelAlpha(spec.data, 8, x, y);
				if (alpha === 255) {
					opaqueCount++;
					expect(pixelRgb(spec.data, 8, x, y)).toEqual([0xa5, 0x0c, 0x1a]);
				} else {
					expect(alpha).toBe(0);
					transparentCount++;
				}
			}
		}
		// Überwiegend deckend (bleibt optisch "fast solid"), aber NICHT uniform.
		expect(opaqueCount).toBeGreaterThan(transparentCount);
		expect(transparentCount).toBeGreaterThan(0);
		// Review-Fund #15: mind. 10 % transparente Fläche für Wahrnehmbarkeit
		// (die alte 1px-alle-4px-Textur lag bei nur 6 %).
		expect(transparentCount / (opaqueCount + transparentCount)).toBeGreaterThanOrEqual(0.1);
	});

	it('stripes wechselt zwischen deckenden und transparenten 2px-Zeilen', () => {
		const spec = buildPatternImageData('stripes', '#004a6e', 8);
		expect(pixelAlpha(spec.data, 8, 0, 0)).toBe(255);
		expect(pixelAlpha(spec.data, 8, 0, 1)).toBe(255);
		expect(pixelAlpha(spec.data, 8, 0, 2)).toBe(0);
		expect(pixelAlpha(spec.data, 8, 0, 3)).toBe(0);
		expect(pixelAlpha(spec.data, 8, 0, 4)).toBe(255);
	});

	it('diagonal malt eine 45°-Streifen-Sequenz (nicht identisch zu stripes)', () => {
		const stripes = buildPatternImageData('stripes', '#000000', 8);
		const diagonal = buildPatternImageData('diagonal', '#000000', 8);
		expect(diagonal.data).not.toEqual(stripes.data);
		// Diagonale hat sowohl gefärbte als auch transparente Pixel.
		const alphas = new Set<number>();
		for (let y = 0; y < 8; y++) {
			for (let x = 0; x < 8; x++) alphas.add(pixelAlpha(diagonal.data, 8, x, y));
		}
		expect(alphas).toEqual(new Set([0, 255]));
	});

	it('diagonal-reverse malt die Streifen in Gegenrichtung zu diagonal (Review-Fund #16: Die-Linke/FDP-Kollision auflösen)', () => {
		const diagonal = buildPatternImageData('diagonal', '#000000', 8);
		const diagonalReverse = buildPatternImageData('diagonal-reverse', '#000000', 8);
		expect(diagonalReverse.data).not.toEqual(diagonal.data);
		const alphas = new Set<number>();
		for (let y = 0; y < 8; y++) {
			for (let x = 0; x < 8; x++) alphas.add(pixelAlpha(diagonalReverse.data, 8, x, y));
		}
		expect(alphas).toEqual(new Set([0, 255]));
	});

	it('dots hat einen deckenden Mittelpunkt und eine transparente Ecke pro 8px-Kachel', () => {
		const spec = buildPatternImageData('dots', '#0f6e2c', 16);
		expect(pixelAlpha(spec.data, 16, 4, 4)).toBe(255);
		expect(pixelAlpha(spec.data, 16, 0, 0)).toBe(0);
	});

	it('ist deterministisch (gleicher Input → identischer Output)', () => {
		const a = buildPatternImageData('dots', '#4a1559');
		const b = buildPatternImageData('dots', '#4a1559');
		expect(a.data).toEqual(b.data);
	});
});

describe('patternImageId', () => {
	it('baut stabile normalisierte IDs pro Partei-Kurzname', () => {
		expect(patternImageId('SPD')).toBe('wahl-partei-pattern-spd');
		expect(patternImageId('Die Linke')).toBe('wahl-partei-pattern-die-linke');
		expect(patternImageId('FREIE WÄHLER')).toBe('wahl-partei-pattern-freie-waehler');
	});
});

describe('SPD-Pfad Ende-zu-Ende (Live-Bug-Report 20.09.: SPD-Muster wirkte texturlos)', () => {
	it('parteiPattern(SPD) -> buildPatternImageData liefert ein registrierbares, NICHT-uniformes Bild mit sichtbarer Textur', () => {
		const pattern = parteiPattern('SPD');
		expect(pattern).toBe('solid');

		const spec = buildPatternImageData(pattern, parteiColor('SPD'));
		expect(spec.width).toBe(PATTERN_TILE_SIZE);

		// "Sichtbare Textur" heißt konkret: das Bild ist NICHT der neutrale
		// Fallback (leer/komplett transparent) UND NICHT komplett uniform
		// (jedes Pixel identischer Alpha-Wert) -- sonst ist Muster-Modus AN
		// für SPD optisch nicht von Muster-Modus AUS unterscheidbar.
		const alphas = new Set<number>();
		let hasOpaqueSpdColor = false;
		for (let y = 0; y < spec.height; y++) {
			for (let x = 0; x < spec.width; x++) {
				const alpha = pixelAlpha(spec.data, spec.width, x, y);
				alphas.add(alpha);
				if (alpha === 255) {
					expect(pixelRgb(spec.data, spec.width, x, y)).toEqual([0xa5, 0x0c, 0x1a]);
					hasOpaqueSpdColor = true;
				}
			}
		}
		expect(alphas.size).toBeGreaterThan(1);
		expect(hasOpaqueSpdColor).toBe(true);

		// patternImageId(SPD) ist eine eigene, stabile ID -- registerPartyPatterns
		// würde darunter genau dieses (nicht das neutrale) Bild registrieren.
		expect(patternImageId('SPD')).toBe('wahl-partei-pattern-spd');
		expect(patternImageId('SPD')).not.toBe('wahl-partei-pattern-neutral');
	});
});
