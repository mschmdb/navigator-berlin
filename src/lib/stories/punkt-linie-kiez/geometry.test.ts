import { describe, expect, it } from 'vitest';
import data from '../../../../static/data/stories-kennzahlen.json';
import { geometry, seededRandom } from './geometry';
import { BAR_HEIGHT, VIEW, type Geometrie, type Kennzahlen } from './types';

const bezirke = data.bezirke as unknown as Kennzahlen[];
const kieze = data.kieze as unknown as Kennzahlen[];
const fk = bezirke.find((b) => b.slug === 'friedrichshain-kreuzberg')!;

function barCorners(bar: NonNullable<Geometrie['bar']>): [number, number][] {
	const a = (bar.rot * Math.PI) / 180;
	const c = VIEW / 2;
	return [
		[bar.x, bar.y],
		[bar.x + bar.w, bar.y],
		[bar.x + bar.w, bar.y + BAR_HEIGHT],
		[bar.x, bar.y + BAR_HEIGHT]
	].map(([px, py]) => {
		const dx = px! - c;
		const dy = py! - c;
		return [c + dx * Math.cos(a) - dy * Math.sin(a), c + dx * Math.sin(a) + dy * Math.cos(a)];
	});
}

describe('seededRandom', () => {
	it('liefert pro Seed dieselbe Folge in [0, 1)', () => {
		const a = seededRandom('mitte');
		const b = seededRandom('mitte');
		const seq = [a(), a(), a()];
		expect(seq).toEqual([b(), b(), b()]);
		for (const v of seq) {
			expect(v).toBeGreaterThanOrEqual(0);
			expect(v).toBeLessThan(1);
		}
		expect(seededRandom('pankow')()).not.toBe(seq[0]);
	});
});

describe('geometry', () => {
	it('liefert für Friedrichshain-Kreuzberg alle sechs Zeichen', () => {
		const g = geometry(fk);
		expect(g.circle).not.toBeNull();
		expect(g.square).not.toBeNull();
		expect(g.triangle).not.toBeNull();
		expect(g.bar).not.toBeNull();
		expect(g.donut).not.toBeNull();
		expect(g.lines.length).toBeGreaterThan(0);
	});

	it('ist pro Slug deterministisch', () => {
		expect(geometry(fk)).toEqual(geometry({ ...fk }));
	});

	it('platziert verschiedene Slugs verschieden', () => {
		expect(geometry(fk).circle).not.toEqual(geometry({ ...fk, slug: 'mitte' }).circle);
	});

	it('lässt den Donut ohne Clubs weg', () => {
		expect(geometry({ ...fk, clubs: 0 }).donut).toBeNull();
	});

	it('lässt bei null die Form weg und verschiebt Kreis, Quadrat und Dreieck nicht', () => {
		const full = geometry(fk);
		const g = geometry({ ...fk, laermDb: null });
		expect(g.triangle).toBeNull();
		expect(g.circle).toEqual(full.circle);
		expect(g.square).toEqual(full.square);
		const noSquare = geometry({ ...fk, altbauAnteil: null });
		expect(noSquare.circle).toEqual(full.circle);
		expect(noSquare.triangle).toEqual(full.triangle);
		expect(geometry({ ...fk, bewohnerProKm2: null }).bar).toBeNull();
		expect(geometry({ ...fk, gruen: null }).circle).toBeNull();
		expect(geometry({ ...fk, altbauAnteil: null }).square).toBeNull();
		expect(geometry({ ...fk, haltestelle400mAnteil: null }).lines).toEqual([]);
	});

	it('lässt den Donut mit der Clubzahl wachsen', () => {
		expect(geometry({ ...fk, clubs: 40 }).donut!.r).toBeGreaterThan(
			geometry({ ...fk, clubs: 4 }).donut!.r
		);
	});

	it('hält die Zeichen im Feld, wo sie nicht angeschnitten werden dürfen', () => {
		for (const g of [geometry(fk)]) {
			expect(g.circle!.cx).toBeGreaterThan(0);
			expect(g.donut!.cx - g.donut!.r).toBeGreaterThanOrEqual(0);
			expect(g.donut!.cx + g.donut!.r).toBeLessThanOrEqual(VIEW);
			expect(g.donut!.cy - g.donut!.r).toBeGreaterThanOrEqual(0);
			expect(g.donut!.cy + g.donut!.r).toBeLessThanOrEqual(VIEW);
		}
	});

	it('schneidet den Balken nie an: alle 12 Bezirke und 143 Kieze', () => {
		const units = [...bezirke, ...kieze];
		expect(units).toHaveLength(155);
		for (const k of units) {
			{
				const bar = geometry(k).bar;
				if (!bar) continue;
				for (const [x, y] of barCorners(bar)) {
					expect(x, `${k.slug} x`).toBeGreaterThanOrEqual(0);
					expect(x, `${k.slug} x`).toBeLessThanOrEqual(VIEW);
					expect(y, `${k.slug} y`).toBeGreaterThanOrEqual(0);
					expect(y, `${k.slug} y`).toBeLessThanOrEqual(VIEW);
				}
			}
		}
	});

	it('hält jede Form in allen 155 Einheiten vollständig im Feld', () => {
		const units = [...bezirke, ...kieze];
		for (const k of units) {
			{
				const g = geometry(k);
				const where = k.slug;
				const inside = (v: number, label: string): void => {
					expect(v, `${where} ${label}`).toBeGreaterThanOrEqual(0);
					expect(v, `${where} ${label}`).toBeLessThanOrEqual(VIEW);
				};
				if (g.circle) {
					inside(g.circle.cx - g.circle.r, 'circle left');
					inside(g.circle.cx + g.circle.r, 'circle right');
					inside(g.circle.cy - g.circle.r, 'circle top');
					inside(g.circle.cy + g.circle.r, 'circle bottom');
				}
				if (g.square) {
					inside(g.square.x, 'square left');
					inside(g.square.x + g.square.size, 'square right');
					inside(g.square.y, 'square top');
					inside(g.square.y + g.square.size, 'square bottom');
				}
				if (g.triangle) {
					inside(g.triangle.x, 'triangle left');
					inside(g.triangle.x + g.triangle.size, 'triangle right');
					inside(g.triangle.y - g.triangle.size * 0.87, 'triangle top');
					inside(g.triangle.y, 'triangle bottom');
				}
				if (g.donut) {
					inside(g.donut.cx - g.donut.r, 'donut left');
					inside(g.donut.cx + g.donut.r, 'donut right');
					inside(g.donut.cy - g.donut.r, 'donut top');
					inside(g.donut.cy + g.donut.r, 'donut bottom');
				}
			}
		}
	});
});
