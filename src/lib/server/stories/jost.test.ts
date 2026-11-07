import { describe, expect, it } from 'vitest';
import { jostFile, jostMeasure } from './jost';

describe('jostMeasure (Jost 900, Font-Metriken)', () => {
	const measure = jostMeasure();

	it('liefert die Tinten-Box bei Schriftgröße 1', () => {
		const m = measure('28 %');
		expect(m.w).toBeGreaterThan(1);
		expect(m.w).toBeLessThan(3);
		expect(m.asc).toBeGreaterThan(0.6);
		expect(m.asc).toBeLessThan(0.8);
		expect(m.h).toBeGreaterThanOrEqual(m.asc);
		expect(m.adv).toBeGreaterThanOrEqual(m.w - 0.1);
		expect(Math.abs(m.abl)).toBeLessThan(0.1);
	});

	it('längerer Text ist breiter, gleicher Text gleich', () => {
		expect(measure('100 %').w).toBeGreaterThan(measure('1 %').w);
		expect(measure('<1 %')).toEqual(measure('<1 %'));
	});

	it('leerer Text hat keine Tinte', () => {
		expect(measure('')).toEqual({ abl: 0, w: 0, asc: 0, h: 0, adv: 0 });
	});

	it('Gewicht 400 ist schmaler als 900', () => {
		expect(jostMeasure(400)('Mitte').adv).toBeLessThan(measure('Mitte').adv);
	});

	it('findet die woff-Dateien aus @fontsource/jost', () => {
		expect(jostFile(900)).toMatch(/jost-latin-900-normal\.woff$/);
	});
});
