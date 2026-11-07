import { describe, expect, it } from 'vitest';
import { placeLabels, shareTexts, type Measure } from './labels';
import { checkLabels } from './label-check';
import { layout, orderOf, SIDE } from './layout';
import { derive, sharesOf } from './grau';
import { ORDER } from './parteien';
import { STORY_INK, STORY_PAPER } from '../tokens';
import fixtures from './fixtures/wahlen.json';

/**
 * Näherung an Jost 900 für Tests, Werte je Schriftgröße 1. Die echte Messung kommt
 * im Browser aus Canvas, auf dem Server aus den Font-Metriken.
 */
const ADV: Record<string, number> = { '%': 0.85, '<': 0.6, ' ': 0.25 };
const measure: Measure = (t) => {
	const adv = [...t].reduce((s, c) => s + (ADV[c] ?? 0.6), 0);
	return { abl: -0.02, w: adv - 0.04, asc: 0.7, h: 0.72, adv };
};

const COLORS: Record<string, string> = {
	afd: '#009EE0',
	bsw: '#722282',
	cdu: '#3b3936',
	fdp: '#FFEF00',
	gruene: '#1AA037',
	linke: '#BE3075',
	piraten: '#FF820A',
	spd: '#E3000F',
	rest: '#8d887d'
};
const FILLS = ORDER.map((k) => COLORS[k]);

interface Variant {
	thr: number;
	order: 'fixed' | 'size';
	paper: boolean;
	nogrey: boolean;
}
const VARIANTS: Variant[] = [];
for (const thr of [0, 0.05])
	for (const order of ['fixed', 'size'] as const)
		for (const paper of [false, true])
			for (const nogrey of [false, true]) VARIANTS.push({ thr, order, paper, nogrey });

function run(
	sizePx: number,
	insideOnly: boolean
): { problems: string[]; inside: number; outside: number } {
	const scale = sizePx / SIDE;
	const problems: string[] = [];
	let inside = 0,
		outside = 0;
	for (const f of fixtures)
		for (const v of VARIANTS) {
			const d = derive(f, v.thr);
			const shares = sharesOf(d);
			const blocks = layout(shares, {
				turnout: v.paper ? f.turnout : null,
				order: orderOf(shares, v.order)
			});
			const fills = FILLS.map((c, i) => (v.nogrey && ORDER[i] === 'rest' ? null : c));
			const labels = placeLabels(blocks, shareTexts(shares, 'de'), {
				scale,
				measure,
				fills,
				insideOnly
			});
			inside += labels.inside.length;
			outside += labels.outside.length;
			for (const p of checkLabels(blocks, labels, scale, fills, insideOnly))
				problems.push(`${f.bezirk} ${f.wahl} ${f.jahr} ${JSON.stringify(v)} b${p.i} ${p.kind}`);
		}
	return { problems, inside, outside };
}

describe('placeLabels: Prüfungen aus check.mjs über alle Fixtures', () => {
	it.each([100, 150, 200, 230, 400])(
		'Quadrat %i px: jede Zahl innen oder außen, keine Kreuzung',
		(size) => {
			const r = run(size, false);
			expect(r.problems.slice(0, 10)).toEqual([]);
			expect(r.inside).toBeGreaterThan(0);
			expect(r.outside).toBeGreaterThan(0);
		}
	);

	it.each([50, 70])('schmale Ansicht %i px (insideOnly): nur innen, nichts läuft über', (size) => {
		const r = run(size, true);
		expect(r.problems.slice(0, 10)).toEqual([]);
		expect(r.outside).toBe(0);
	});
});

describe('placeLabels: Einzelregeln', () => {
	const blocks = layout([0.3, 0, 0.3, 0, 0.2, 0.002, 0, 0.17, 0.028]);
	const texts = shareTexts([0.3, 0, 0.3, 0, 0.2, 0.002, 0, 0.17, 0.028], 'de');

	it('Textfarbe nach Kontrast zum Block', () => {
		const l = placeLabels(blocks, texts, { scale: 2, measure, fills: FILLS });
		const cdu = l.inside.find((x) => x.i === 2);
		expect(cdu?.fill).toBe(STORY_PAPER);
		const spd = l.inside.find((x) => x.i === 7);
		expect(spd?.fill).toBe(STORY_PAPER);
		const faded = placeLabels(blocks, texts, {
			scale: 2,
			measure,
			fills: FILLS.map(() => '#f4ede0')
		});
		expect(faded.inside.every((x) => x.fill === STORY_INK)).toBe(true);
	});

	it('kleiner Block steht außen, ab Mindestgröße 10 px', () => {
		const l = placeLabels(blocks, texts, { scale: 2, measure, fills: FILLS });
		expect(l.outside.map((x) => x.i)).toContain(5);
		for (const x of l.inside) expect(x.fontSize * 2).toBeGreaterThanOrEqual(10);
	});

	it('Export verlangt 17 px innen und setzt außen 17 px', () => {
		const l = placeLabels(blocks, texts, { scale: 2, measure, fills: FILLS, exportMode: true });
		for (const x of l.inside) expect(x.fontSize * 2).toBeGreaterThanOrEqual(17);
		for (const x of l.outside) expect(x.fontSize * 2).toBeCloseTo(17, 9);
	});

	it('Spalten-Blöcke unten mittig, Streifen-Blöcke rechts', () => {
		const tall = layout([0.002, 0.3, 0.3, 0.003, 0.2, 0, 0, 0.17, 0.025]);
		const l = placeLabels(
			tall,
			shareTexts([0.002, 0.3, 0.3, 0.003, 0.2, 0, 0, 0.17, 0.025], 'de'),
			{
				scale: 2,
				measure,
				fills: FILLS
			}
		);
		const a = l.outside.find((x) => x.i === 0);
		expect(a?.anchor).toBe('middle');
		expect(a!.box.y).toBeGreaterThan(SIDE);
		const d = l.outside.find((x) => x.i === 3);
		expect(d?.anchor).toBe('start');
		expect(d!.box.x).toBeGreaterThan(SIDE);
	});

	it('Streifen-Zahlen unten im Quadrat rücken nach oben und bleiben neben dem Quadrat', () => {
		const shares = [0.5, 0.45, 0.02, 0.003, 0.01, 0.003, 0.01, 0.003, 0.001];
		const l = placeLabels(layout(shares), shareTexts(shares, 'de'), {
			scale: 2,
			measure,
			fills: FILLS
		});
		const slabs = l.outside.filter((x) => x.anchor === 'start');
		expect(slabs.length).toBe(3);
		for (const s of slabs) expect(s.box.y + s.box.h).toBeLessThanOrEqual(SIDE);
	});

	it('gedreht nur, wenn die Zahl mehr als 1,5-mal so groß wird', () => {
		const strip = layout([0.12, 0, 0.88, 0, 0, 0, 0, 0, 0]);
		const l = placeLabels(strip, shareTexts([0.12, 0, 0.88, 0, 0, 0, 0, 0, 0], 'de'), {
			scale: 4,
			measure,
			fills: FILLS
		});
		expect(l.inside.find((x) => x.i === 0)?.rotate).toBe(-90);
		expect(l.inside.find((x) => x.i === 2)?.rotate).toBe(0);
	});

	it('ohne Anteil keine Zahl, verborgene Blöcke ohne Zahl', () => {
		const fills = FILLS.map((c, i) => (i === 8 ? null : c));
		const l = placeLabels(blocks, texts, { scale: 2, measure, fills });
		const all = [...l.inside, ...l.outside].map((x) => x.i);
		expect(all).not.toContain(1);
		expect(all).not.toContain(8);
	});

	it('verlangt eine positive Skalierung', () => {
		expect(() => placeLabels(blocks, texts, { scale: 0, measure, fills: FILLS })).toThrow(
			RangeError
		);
	});
});

describe('shareTexts', () => {
	it('ganzzahlig, unter 1 % als <1, ohne Anteil null', () => {
		expect(shareTexts([0.284, 0.004, 0, 0.005], 'de')).toEqual(['28 %', '<1 %', null, '1 %']);
		expect(shareTexts([0.284, 0.004], 'en')).toEqual(['28%', '<1%']);
	});
});
