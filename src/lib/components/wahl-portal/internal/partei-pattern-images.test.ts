import { describe, expect, it } from 'vitest';
import {
	buildPatternImageData,
	patternImageId,
	PATTERN_TILE_SIZE
} from './partei-pattern-images.js';

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

	it('solid füllt jedes Pixel undurchsichtig in der Partei-Farbe', () => {
		const spec = buildPatternImageData('solid', '#A50C1A', 4);
		for (let y = 0; y < 4; y++) {
			for (let x = 0; x < 4; x++) {
				expect(pixelAlpha(spec.data, 4, x, y)).toBe(255);
				expect(pixelRgb(spec.data, 4, x, y)).toEqual([0xa5, 0x0c, 0x1a]);
			}
		}
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
