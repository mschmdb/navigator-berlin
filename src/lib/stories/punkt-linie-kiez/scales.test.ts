import { describe, expect, it } from 'vitest';
import { scaleMarks } from './scales';
import type { Kennzahlen } from './types';

const base: Kennzahlen = {
	slug: 'x',
	gruen: 0.5,
	altbauAnteil: 0.5,
	laermDb: 53.5,
	bewohnerProKm2: 2000,
	haltestelle400mAnteil: 0.9,
	clubs: 25
};

describe('scaleMarks', () => {
	it('rechnet Anteile in Größen um', () => {
		const m = scaleMarks(base);
		expect(m.circleR).toBeCloseTo(12 + 0.5 * 32);
		expect(m.squareSize).toBeCloseTo(14 + 0.5 * 80);
		expect(m.triangleSize).toBeCloseTo(16 + 0.5 * 80);
		expect(m.lineCount).toBe(3);
		expect(m.donutR).toBeCloseTo(9 + Math.sqrt(0.5) * 30);
	});

	it('setzt Grenzwerte der absoluten Skalen', () => {
		const lo = scaleMarks({ ...base, laermDb: 40, bewohnerProKm2: 10, haltestelle400mAnteil: 0.5 });
		expect(lo.triangleSize).toBe(16);
		expect(lo.barLength).toBe(20);
		expect(lo.lineCount).toBe(1);
		const hi = scaleMarks({
			...base,
			laermDb: 70,
			bewohnerProKm2: 99999,
			haltestelle400mAnteil: 1
		});
		expect(hi.triangleSize).toBe(96);
		expect(hi.barLength).toBe(170);
		expect(hi.lineCount).toBe(6);
	});

	it('lässt Formen bei null weg und erfindet keinen Ersatzwert', () => {
		const m = scaleMarks({
			...base,
			gruen: null,
			altbauAnteil: null,
			laermDb: null,
			bewohnerProKm2: null,
			haltestelle400mAnteil: null,
			clubs: null
		});
		expect(m.circleR).toBeNull();
		expect(m.squareSize).toBeNull();
		expect(m.triangleSize).toBeNull();
		expect(m.barLength).toBeNull();
		expect(m.lineCount).toBe(0);
		expect(m.donutR).toBe(0);
	});

	it('zeichnet ohne Clubs keinen Donut und deckelt bei 50 Clubs', () => {
		expect(scaleMarks({ ...base, clubs: 0 }).donutR).toBe(0);
		expect(scaleMarks({ ...base, clubs: 500 }).donutR).toBeCloseTo(
			scaleMarks({ ...base, clubs: 50 }).donutR
		);
	});

	it('lässt den Donut mit der Wurzel der Clubzahl wachsen', () => {
		const a = scaleMarks({ ...base, clubs: 1 }).donutR - 9;
		const b = scaleMarks({ ...base, clubs: 4 }).donutR - 9;
		expect(b / a).toBeCloseTo(2);
	});

	it('zeichnet bei vorhandenem Wert immer die Form, auch unter der Skala', () => {
		const m = scaleMarks({ ...base, haltestelle400mAnteil: 0.75, laermDb: 30 });
		expect(m.lineCount).toBe(1);
		expect(m.triangleSize).toBeGreaterThan(0);
		expect(scaleMarks({ ...base, gruen: 0 }).circleR).toBeGreaterThan(0);
		expect(scaleMarks({ ...base, altbauAnteil: 0 }).squareSize).toBeGreaterThan(0);
	});

	it('klemmt unplausible Werte', () => {
		const m = scaleMarks({ ...base, gruen: 7, altbauAnteil: -3, clubs: -5, bewohnerProKm2: -10 });
		expect(m.circleR).toBe(44);
		expect(m.squareSize).toBe(14);
		expect(m.donutR).toBe(0);
		expect(m.barLength).toBe(20);
	});
});
