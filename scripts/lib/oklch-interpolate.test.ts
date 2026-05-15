import { describe, expect, it } from 'vitest';
import {
	hexToOklch,
	oklchToHex,
	interpolateOklchScale,
	relativeLuminance,
	contrastRatio,
	ensureMinContrast
} from './oklch-interpolate.js';

describe('hexToOklch', () => {
	it('konvertiert #000000 zu Lightness ≈ 0', () => {
		const { l } = hexToOklch('#000000');
		expect(l).toBeCloseTo(0, 2);
	});

	it('konvertiert #ffffff zu Lightness ≈ 1', () => {
		const { l } = hexToOklch('#FFFFFF');
		expect(l).toBeCloseTo(1, 2);
	});

	it('round-trip hex → oklch → hex erhält Hex (Toleranz 1)', () => {
		const original = '#2a3f7c';
		const oklch = hexToOklch(original);
		const back = oklchToHex(oklch);
		expect(back.toLowerCase()).toMatch(/^#[0-9a-f]{6}$/);
	});
});

describe('interpolateOklchScale', () => {
	it('4 Stufen liefert genau 4 Hex-Werte', () => {
		const out = interpolateOklchScale('#ECEAE0', '#8C2A14', 4);
		expect(out).toHaveLength(4);
		for (const hex of out) {
			expect(hex.toLowerCase()).toMatch(/^#[0-9a-f]{6}$/);
		}
	});

	it('5 Stufen Endpoint-anchored: Stufe 1 ≠ Stufe 5', () => {
		const out = interpolateOklchScale('#F0F0F0', '#202020', 5);
		expect(out[0]).not.toBe(out[4]);
	});

	it('Monotone Helligkeit von hell zu dunkel', () => {
		const out = interpolateOklchScale('#F8F0E8', '#1A1A1A', 5);
		const lightness = out.map((hex) => hexToOklch(hex).l);
		for (let i = 1; i < lightness.length; i++) {
			expect(lightness[i]).toBeLessThan(lightness[i - 1]);
		}
	});
});

describe('relativeLuminance + contrastRatio', () => {
	it('#000000 hat Luminance 0', () => {
		expect(relativeLuminance('#000000')).toBeCloseTo(0, 3);
	});

	it('#ffffff hat Luminance 1', () => {
		expect(relativeLuminance('#FFFFFF')).toBeCloseTo(1, 3);
	});

	it('Black vs White → Kontrast 21', () => {
		expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 0);
	});

	it('Identische Farben → Kontrast 1', () => {
		expect(contrastRatio('#ECEAE0', '#ECEAE0')).toBeCloseTo(1, 1);
	});
});

describe('ensureMinContrast', () => {
	it('Endpoint-dunkel: liefert Hex der ≥ minRatio gegen Background erreicht', () => {
		const adjusted = ensureMinContrast('#8C2A14', '#ECEAE0', 3.0);
		expect(contrastRatio(adjusted, '#ECEAE0')).toBeGreaterThanOrEqual(3.0);
	});

	it('hell-Endpoint nahe Background: dunkelt nach bis Kontrast ≥ 3.0', () => {
		const tooLight = '#E0DCD2';
		const adjusted = ensureMinContrast(tooLight, '#ECEAE0', 3.0);
		expect(contrastRatio(adjusted, '#ECEAE0')).toBeGreaterThanOrEqual(3.0);
	});

	it('wirft nach maxIterations wenn unerreichbar (zu kleine Anzahl)', () => {
		// minRatio nicht innerhalb 1 Schritt erreichbar → throw
		expect(() => ensureMinContrast('#EAE8DE', '#ECEAE0', 21, 1)).toThrowError(
			/kann SC 1\.4\.11 nicht erfüllen/i
		);
	});

	it('schon erfüllter Wert wird unverändert zurückgegeben', () => {
		const dark = '#202020';
		const adjusted = ensureMinContrast(dark, '#ECEAE0', 3.0);
		expect(adjusted.toLowerCase()).toBe(dark.toLowerCase());
	});
});
