import { describe, expect, it } from 'vitest';
import { ease, HOLD, MORPH, zeitpunkt } from './zeitleiste';

const CYCLE = HOLD + MORPH;

describe('ease', () => {
	it('läuft von 0 nach 1, symmetrisch um die Mitte', () => {
		expect(ease(0)).toBe(0);
		expect(ease(1)).toBe(1);
		expect(ease(0.5)).toBe(0.5);
		expect(ease(0.25) + ease(0.75)).toBeCloseTo(1, 10);
	});
});

describe('zeitpunkt', () => {
	it('steht während der Haltezeit still auf der ersten Wahl', () => {
		expect(zeitpunkt(0, 5)).toEqual({ from: 0, to: 1, t: 0, shown: 0 });
		expect(zeitpunkt(HOLD - 0.01, 5)).toMatchObject({ from: 0, t: 0, shown: 0 });
	});

	it('wechselt die gezeigte Wahl hart zur Mitte des Übergangs', () => {
		const before = zeitpunkt(HOLD + MORPH * 0.49, 5);
		const after = zeitpunkt(HOLD + MORPH * 0.51, 5);
		expect(before.shown).toBe(0);
		expect(after.shown).toBe(1);
		expect(zeitpunkt(HOLD + MORPH / 2, 5).t).toBeCloseTo(0.5, 10);
	});

	it('springt nach der letzten Wahl zurück auf die erste', () => {
		expect(zeitpunkt(4 * CYCLE + HOLD + MORPH * 0.9, 5)).toMatchObject({
			from: 4,
			to: 0,
			shown: 0
		});
		expect(zeitpunkt(5 * CYCLE, 5)).toEqual(zeitpunkt(0, 5));
	});

	it('verträgt negative Zeit und eine einzige Wahl', () => {
		expect(zeitpunkt(-CYCLE, 4)).toMatchObject({ from: 3 });
		expect(zeitpunkt(HOLD + 0.5, 1)).toMatchObject({ from: 0, to: 0, shown: 0 });
	});
});
