import { describe, it, expect } from 'vitest';
import { linearRegression } from './regression.js';

describe('linearRegression', () => {
	it('fits a perfect upward line y = 2x + 1', () => {
		const data = [
			{ year: 1, value: 3 },
			{ year: 2, value: 5 },
			{ year: 3, value: 7 },
			{ year: 4, value: 9 }
		];
		const fit = linearRegression(data, (d) => d.year, (d) => d.value);
		expect(fit.slope).toBeCloseTo(2, 6);
		expect(fit.intercept).toBeCloseTo(1, 6);
		expect(fit.predict(5)).toBeCloseTo(11, 6);
	});

	it('fits a flat series with slope ~0', () => {
		const data = [
			{ year: 2000, value: 5 },
			{ year: 2001, value: 5 },
			{ year: 2002, value: 5 }
		];
		const fit = linearRegression(data, (d) => d.year, (d) => d.value);
		expect(fit.slope).toBeCloseTo(0, 6);
		expect(fit.intercept).toBeCloseTo(5, 6);
	});

	it('returns zero slope on empty input without throwing', () => {
		const fit = linearRegression([] as { year: number; value: number }[], (d) => d.year, (d) => d.value);
		expect(fit.slope).toBe(0);
		expect(fit.intercept).toBe(0);
		expect(fit.predict(2000)).toBe(0);
	});

	it('returns slope 0 on single point and intercept equal to its value', () => {
		const fit = linearRegression(
			[{ year: 2020, value: 7 }],
			(d) => d.year,
			(d) => d.value
		);
		expect(fit.slope).toBe(0);
		expect(fit.intercept).toBe(7);
	});

	it('reports trend direction via slope sign for descending data', () => {
		const data = [
			{ year: 1950, value: 100 },
			{ year: 1960, value: 80 },
			{ year: 1970, value: 60 },
			{ year: 1980, value: 40 }
		];
		const fit = linearRegression(data, (d) => d.year, (d) => d.value);
		expect(fit.slope).toBeLessThan(0);
	});
});
