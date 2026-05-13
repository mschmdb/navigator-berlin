import { describe, it, expect } from 'vitest';
import { rollingMean } from './rolling-mean.js';

describe('rollingMean', () => {
	it('computes a 3-window mean over a flat series', () => {
		const series = [
			{ year: 2000, count: 10 },
			{ year: 2001, count: 10 },
			{ year: 2002, count: 10 },
			{ year: 2003, count: 10 },
			{ year: 2004, count: 10 }
		];
		const out = rollingMean(series, 3, 'count');
		expect(out).toHaveLength(3);
		expect(out[0]).toEqual({ year: 2002, count: 10 });
		expect(out[2]).toEqual({ year: 2004, count: 10 });
	});

	it('computes correct mean for ascending series with window 2', () => {
		const series = [
			{ year: 2000, count: 1 },
			{ year: 2001, count: 2 },
			{ year: 2002, count: 3 },
			{ year: 2003, count: 4 }
		];
		const out = rollingMean(series, 2, 'count');
		expect(out).toHaveLength(3);
		expect(out[0]).toEqual({ year: 2001, count: 1.5 });
		expect(out[1]).toEqual({ year: 2002, count: 2.5 });
		expect(out[2]).toEqual({ year: 2003, count: 3.5 });
	});

	it('returns empty if window larger than series length', () => {
		const series = [
			{ year: 2000, count: 1 },
			{ year: 2001, count: 2 }
		];
		expect(rollingMean(series, 5, 'count')).toEqual([]);
	});

	it('works on temp field for long-view data', () => {
		const series = [
			{ year: 1700, temp: 8 },
			{ year: 1701, temp: 9 },
			{ year: 1702, temp: 10 }
		];
		const out = rollingMean(series, 3, 'temp');
		expect(out).toHaveLength(1);
		expect(out[0]).toEqual({ year: 1702, temp: 9 });
	});

	it('throws on window <= 0', () => {
		const series = [{ year: 2000, count: 1 }];
		expect(() => rollingMean(series, 0, 'count')).toThrow();
		expect(() => rollingMean(series, -3, 'count')).toThrow();
	});
});
