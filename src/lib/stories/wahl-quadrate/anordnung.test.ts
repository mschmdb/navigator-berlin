import { describe, expect, it } from 'vitest';
import { fitSquareSize, labelExtent, placeSquare, type SquareSpec } from './anordnung';
import { checkPage } from './label-check';
import { shareTexts, type Measure } from './labels';
import { derive, sharesOf } from './grau';
import { colorsInOrder } from './farben';
import fixtures from './fixtures/wahlen.json';

const ADV: Record<string, number> = { '%': 0.85, '<': 0.6, ' ': 0.25 };
const measure: Measure = (t) => {
	const adv = [...t].reduce((s, c) => s + (ADV[c] ?? 0.6), 0);
	return { abl: -0.02, w: adv - 0.04, asc: 0.7, h: 0.72, adv };
};
const fills = colorsInOrder();
const specs: SquareSpec[] = fixtures.map((f) => {
	const shares = sharesOf(derive(f));
	return { shares, texts: shareTexts(shares, 'de'), title: `${f.bezirk} ${f.jahr}` };
});
const opts = { density: 1.6, measure, fills };

describe('labelExtent', () => {
	it('ohne Außenzahlen kein Überstand', () => {
		const p = placeSquare({ ...specs[0], texts: null }, 0, 0, 60, opts);
		expect(labelExtent(p)).toEqual({ left: 0, top: 0, right: 0, bottom: 0 });
	});

	it('misst Außenzahlen in Seiteneinheiten', () => {
		const shares = [0.5, 0.45, 0.02, 0.003, 0.01, 0.003, 0.01, 0.003, 0.001];
		const p = placeSquare(
			{ shares, texts: shareTexts(shares, 'de'), title: 't' },
			10,
			20,
			60,
			opts
		);
		const e = labelExtent(p);
		expect(e.right + e.bottom).toBeGreaterThan(0);
		expect(e.top).toBe(0);
	});
});

describe('fitSquareSize', () => {
	it('größtes Quadrat, dessen Zahlen in die Zelle passen', () => {
		const { size: s, inset } = fitSquareSize(specs, 90, 80, opts);
		expect(s).toBeGreaterThan(30);
		expect(s).toBeLessThanOrEqual(80);
		for (const spec of specs) {
			const e = labelExtent(placeSquare(spec, 0, 0, s, opts));
			expect(e.left).toBeLessThanOrEqual(inset);
			expect(inset + s + e.right).toBeLessThanOrEqual(90);
			expect(s + e.bottom).toBeLessThanOrEqual(80);
		}
	});

	it('ohne Zahlen füllt das Quadrat die kleinere Kante', () => {
		const plain = specs.map((s) => ({ ...s, texts: null }));
		expect(fitSquareSize(plain, 90, 70.6, opts)).toEqual({ size: 70, inset: 0 });
	});

	it('wirft, wenn nichts passt', () => {
		expect(() => fitSquareSize(specs, 3, 3, opts)).toThrow(RangeError);
	});
});

describe('checkPage', () => {
	it('ein Raster aus allen Fixtures ohne Kollision', () => {
		const cols = 5,
			cw = 90,
			ch = 80;
		const { size, inset } = fitSquareSize(specs, cw, ch, opts);
		const placed = specs.map((spec, i) =>
			placeSquare(spec, (i % cols) * cw + inset, Math.floor(i / cols) * ch, size, opts)
		);
		expect(checkPage(placed)).toEqual([]);
	});

	it('meldet Quadrate, die sich mit Zahlen überdecken', () => {
		const shares = [0.5, 0.45, 0.02, 0.003, 0.01, 0.003, 0.01, 0.003, 0.001];
		const spec = { shares, texts: shareTexts(shares, 'de'), title: 'dicht' };
		const a = placeSquare(spec, 0, 0, 60, opts);
		const b = placeSquare(spec, 62, 0, 60, opts);
		expect(checkPage([a, b]).length).toBeGreaterThan(0);
	});
});
