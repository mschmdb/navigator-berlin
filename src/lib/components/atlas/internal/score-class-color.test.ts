import { describe, expect, it } from 'vitest';
import { DIMENSION_RAMPS } from './dimension-ramps.js';
import {
	NO_SCORE_FILL,
	scoreClassFill,
	scoreClassIndex,
	scoreClassStops
} from './score-class-color.js';

describe('scoreClassIndex', () => {
	it('folgt den Klassengrenzen 0/26/51/76', () => {
		expect(scoreClassIndex(0)).toBe(0);
		expect(scoreClassIndex(25)).toBe(0);
		expect(scoreClassIndex(26)).toBe(1);
		expect(scoreClassIndex(50)).toBe(1);
		expect(scoreClassIndex(51)).toBe(2);
		expect(scoreClassIndex(75)).toBe(2);
		expect(scoreClassIndex(76)).toBe(3);
		expect(scoreClassIndex(100)).toBe(3);
	});

	it('klemmt Werte außerhalb von 0 bis 100', () => {
		expect(scoreClassIndex(-5)).toBe(0);
		expect(scoreClassIndex(140)).toBe(3);
	});
});

describe('scoreClassStops', () => {
	it('liefert Schwelle/Farbe-Paare mit den Stufen 1/2/4/5', () => {
		const ramp = DIMENSION_RAMPS.gesamt;
		expect(scoreClassStops(ramp)).toEqual([0, ramp[0], 26, ramp[1], 51, ramp[3], 76, ramp[4]]);
	});
});

describe('scoreClassFill', () => {
	it('nutzt Stufen 1, 2, 4, 5 der Gesamt-Rampe', () => {
		const ramp = DIMENSION_RAMPS.gesamt;
		expect(scoreClassFill(10)).toBe(ramp[0]);
		expect(scoreClassFill(30)).toBe(ramp[1]);
		expect(scoreClassFill(60)).toBe(ramp[3]);
		expect(scoreClassFill(90)).toBe(ramp[4]);
	});

	it('liefert Grau ohne Score', () => {
		expect(scoreClassFill(null)).toBe(NO_SCORE_FILL);
	});
});
