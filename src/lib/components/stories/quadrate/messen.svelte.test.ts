import { describe, expect, it } from 'vitest';
import { canvasMeasure, SQUARE_FONT } from './messen';

const ctx = (): CanvasRenderingContext2D => document.createElement('canvas').getContext('2d')!;

describe('canvasMeasure', () => {
	it('misst die Tinten-Box bei Schriftgröße 1 mit Jost 900', () => {
		expect(SQUARE_FONT).toMatch(/^900 100px .*Jost/);
		const m = canvasMeasure(ctx())('28 %');
		expect(m.w).toBeGreaterThan(0.5);
		expect(m.w).toBeLessThan(5);
		expect(m.h).toBeGreaterThan(0.3);
		expect(m.asc).toBeGreaterThan(0);
		expect(m.adv).toBeGreaterThanOrEqual(m.w * 0.8);
	});

	it('misst längere Texte breiter', () => {
		const measure = canvasMeasure(ctx());
		expect(measure('100 %').w).toBeGreaterThan(measure('5 %').w);
	});

	it('cacht je Text und leert den Cache auf Wunsch', () => {
		const measure = canvasMeasure(ctx());
		const a = measure('7 %');
		expect(measure('7 %')).toBe(a);
		measure.clear();
		expect(measure('7 %')).not.toBe(a);
		expect(measure('7 %')).toEqual(a);
	});
});
