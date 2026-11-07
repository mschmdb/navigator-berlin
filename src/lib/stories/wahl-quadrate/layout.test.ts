import { describe, expect, it } from 'vitest';
import { layout, orderOf, SIDE, type Block } from './layout';
import { ORDER } from './parteien';
import fixtures from './fixtures/wahlen.json';

const EPS = 1e-6;
const area = (b: Block): number => b.w * b.h;
const overlap = (a: Block, b: Block): number =>
	Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) *
	Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));

/** Anteile in fester Reihenfolge, Grau = alles ohne eigene Partei. */
function sharesOf(raw: Partial<Record<string, number>>, sonst: number, fw: number): number[] {
	return ORDER.map((k) => (k === 'rest' ? sonst + fw : (raw[k] ?? 0)));
}

const cases = fixtures.map((f) => ({
	name: `${f.bezirk} ${f.wahl} ${f.jahr}`,
	shares: sharesOf(f.raw, f.sonst, f.fw),
	turnout: f.turnout
}));

describe('layout tree', () => {
	it.each(cases)('$name: Fläche = Anteil exakt, Summe 100 %', ({ shares }) => {
		for (const mode of ['fixed', 'size'] as const) {
			const blocks = layout(shares, { order: orderOf(shares, mode) });
			const tot = shares.reduce((s, v) => s + v, 0);
			blocks.forEach((b, i) => expect(area(b)).toBeCloseTo((shares[i] / tot) * SIDE * SIDE, 6));
			expect(blocks.reduce((s, b) => s + area(b), 0)).toBeCloseTo(SIDE * SIDE, 6);
		}
	});

	it.each(cases)('$name: Blöcke überlappen nicht und bleiben im Quadrat', ({ shares }) => {
		const blocks = layout(shares);
		for (const b of blocks) {
			expect(b.x).toBeGreaterThanOrEqual(-EPS);
			expect(b.y).toBeGreaterThanOrEqual(-EPS);
			expect(b.x + b.w).toBeLessThanOrEqual(SIDE + EPS);
			expect(b.y + b.h).toBeLessThanOrEqual(SIDE + EPS);
		}
		for (let a = 0; a < blocks.length; a++)
			for (let c = a + 1; c < blocks.length; c++)
				expect(overlap(blocks[a], blocks[c])).toBeLessThan(EPS);
	});

	it('schneidet abwechselnd senkrecht und waagerecht nach Position', () => {
		const shares = [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.2];
		const blocks = layout(shares);
		expect(blocks[0]).toMatchObject({ x: 0, y: 0, h: SIDE, col: true });
		expect(blocks[0].w).toBeCloseTo(10, 9);
		expect(blocks[1]).toMatchObject({ x: blocks[0].w, y: 0, col: false });
		expect(blocks[1].w).toBeCloseTo(90, 9);
		blocks.forEach((b, i) => expect(b.col).toBe(i % 2 === 0));
	});

	it('Reihenfolge nach Größe bestimmt die Schnittrichtung über die Position', () => {
		const shares = [0.05, 0, 0.4, 0, 0.1, 0.15, 0, 0.2, 0.1];
		const ord = orderOf(shares, 'size');
		const blocks = layout(shares, { order: ord });
		expect(blocks[2]).toMatchObject({ x: 0, y: 0, h: SIDE, col: true });
		expect(blocks[2].w).toBeCloseTo(40, 9);
		expect(blocks[7].col).toBe(false);
	});

	it('der letzte Block füllt den Rest, auch bei Rundungsresten', () => {
		const shares = [0.3, 0.3, 0.3, 0, 0, 0, 0, 0, 0.1 + 1e-9];
		const blocks = layout(shares);
		const last = blocks[8];
		expect(last.x + last.w).toBeCloseTo(SIDE, 9);
		expect(last.y + last.h).toBeCloseTo(SIDE, 9);
	});

	it('Nullanteile ergeben Blöcke ohne Fläche', () => {
		const blocks = layout([0, 0.5, 0, 0, 0, 0, 0, 0.5, 0]);
		expect(area(blocks[0])).toBe(0);
		expect(area(blocks[8])).toBeCloseTo(0, 9);
	});

	it('alles null bricht nicht', () => {
		const blocks = layout(new Array(ORDER.length).fill(0));
		blocks.forEach((b) => expect(Number.isFinite(b.x + b.y + b.w + b.h)).toBe(true));
	});

	it('verlangt einen Anteil pro Partei', () => {
		expect(() => layout([0.5, 0.5])).toThrow(RangeError);
	});
});

describe('layout Nichtwähler', () => {
	it.each(cases)(
		'$name: Quadrat = Wahlberechtigte, Füllung links mit Breite = Beteiligung',
		({ shares, turnout }) => {
			for (const rule of ['tree', 'cols'] as const) {
				const blocks = layout(shares, { rule, turnout });
				const tot = shares.reduce((s, v) => s + v, 0);
				blocks.forEach((b, i) => {
					expect(area(b)).toBeCloseTo((shares[i] / tot) * turnout * SIDE * SIDE, 6);
					expect(b.x + b.w).toBeLessThanOrEqual(SIDE * turnout + EPS);
				});
			}
		}
	);

	it('Bänder mit Nichtwählern: kleineres Quadrat unten links, Seite = Wurzel der Beteiligung', () => {
		const blocks = layout([0.2, 0, 0.2, 0, 0.2, 0.2, 0, 0.1, 0.1], {
			rule: 'bands',
			turnout: 0.64
		});
		expect(blocks[0]).toMatchObject({ x: 0, w: 80, h: 80 });
		expect(blocks[0].y).toBeCloseTo(20, 9);
	});

	it('lehnt Beteiligung außerhalb von 0 bis 1 ab', () => {
		expect(() => layout(new Array(ORDER.length).fill(0.1), { turnout: 1.2 })).toThrow(RangeError);
		expect(() => layout(new Array(ORDER.length).fill(0.1), { turnout: -0.1 })).toThrow(RangeError);
	});
});

describe('layout Spalten und Bänder', () => {
	it.each(cases)('$name: Spalten volle Höhe, nebeneinander, Fläche = Anteil', ({ shares }) => {
		const blocks = layout(shares, { rule: 'cols' });
		const tot = shares.reduce((s, v) => s + v, 0);
		let x = 0;
		blocks.forEach((b, i) => {
			expect(b).toMatchObject({ y: 0, h: SIDE, col: true });
			expect(b.x).toBeCloseTo(x, 9);
			expect(area(b)).toBeCloseTo((shares[i] / tot) * SIDE * SIDE, 6);
			x += b.w;
		});
		expect(x).toBeCloseTo(SIDE, 9);
	});

	it.each(cases)('$name: Bänder ineinander, sichtbarer Ring = Anteil', ({ shares }) => {
		const blocks = layout(shares, { rule: 'bands' });
		const tot = shares.reduce((s, v) => s + v, 0);
		expect(blocks[0]).toMatchObject({ w: SIDE, h: SIDE });
		blocks.forEach((b, i) => {
			const inner = i + 1 < blocks.length ? area(blocks[i + 1]) : 0;
			expect(area(b) - inner).toBeCloseTo((shares[i] / tot) * SIDE * SIDE, 6);
			expect(b.x + b.w / 2).toBeCloseTo(SIDE / 2, 9);
			expect(b.y + b.h / 2).toBeCloseTo(SIDE / 2, 9);
		});
	});
});

describe('orderOf', () => {
	it('fest: Index-Reihenfolge', () => {
		expect(orderOf(new Array(ORDER.length).fill(0.1), 'fixed')).toEqual([
			0, 1, 2, 3, 4, 5, 6, 7, 8
		]);
	});

	it('nach Größe: absteigend, bei Gleichstand nach Index, Grau immer zuletzt', () => {
		expect(orderOf([0.1, 0, 0.3, 0.1, 0, 0.2, 0, 0.05, 0.9], 'size')).toEqual([
			2, 5, 0, 3, 7, 1, 4, 6, 8
		]);
	});
});
