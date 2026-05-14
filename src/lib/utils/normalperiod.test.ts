import { describe, expect, it } from 'vitest';
import type { YearValue } from '$lib/data';
import {
	NORMAL_OLD,
	NORMAL_NEW,
	getNormalperiodMean,
	yearValuesToNumeric,
	type NumericYearPoint
} from './normalperiod.js';

describe('normalperiod constants', () => {
	it('NORMAL_OLD ist WMO Referenz-Normalperiode 1961-1990', () => {
		expect(NORMAL_OLD).toEqual({ from: 1961, to: 1990 });
	});

	it('NORMAL_NEW ist WMO aktuelle Normalperiode 1991-2020', () => {
		expect(NORMAL_NEW).toEqual({ from: 1991, to: 2020 });
	});
});

describe('getNormalperiodMean', () => {
	const points: NumericYearPoint[] = [
		{ year: 1960, value: 4 },
		{ year: 1970, value: 6 },
		{ year: 1980, value: 8 },
		{ year: 1990, value: 10 },
		{ year: 2000, value: 12 },
		{ year: 2010, value: 14 },
		{ year: 2020, value: 16 }
	];

	it('berechnet Mittel über inklusiven Year-Range', () => {
		const mean = getNormalperiodMean(points, 1961, 1990);
		expect(mean).toBe((6 + 8 + 10) / 3);
	});

	it('inklusiv bei `from` und `to` (Grenze 1990 zählt zu NORMAL_OLD)', () => {
		const mean = getNormalperiodMean(points, NORMAL_OLD.from, NORMAL_OLD.to);
		expect(mean).toBeCloseTo(8, 5);
	});

	it('berechnet NORMAL_NEW 1991-2020 korrekt', () => {
		const mean = getNormalperiodMean(points, NORMAL_NEW.from, NORMAL_NEW.to);
		expect(mean).toBe((12 + 14 + 16) / 3);
	});

	it('liefert null wenn keine Punkte im Range', () => {
		const sparse: NumericYearPoint[] = [
			{ year: 1900, value: 1 },
			{ year: 2025, value: 2 }
		];
		expect(getNormalperiodMean(sparse, 1961, 1990)).toBeNull();
	});

	it('Tempelhof-Szenario: Stations-Start 1919, Mittel 1961-1990 voll, nicht aus 1919-1960', () => {
		const tempelhof: NumericYearPoint[] = [
			{ year: 1919, value: 1 },
			{ year: 1950, value: 3 },
			{ year: 1961, value: 5 },
			{ year: 1975, value: 6 },
			{ year: 1990, value: 7 }
		];
		const mean = getNormalperiodMean(tempelhof, NORMAL_OLD.from, NORMAL_OLD.to);
		expect(mean).toBe((5 + 6 + 7) / 3);
	});

	it('Teil-Coverage liefert Mean aus vorhandenen Jahren statt 0', () => {
		const partial: NumericYearPoint[] = [
			{ year: 2015, value: 10 },
			{ year: 2020, value: 14 }
		];
		const mean = getNormalperiodMean(partial, 1991, 2020);
		expect(mean).toBe(12);
	});

	it('leere Punkt-Liste liefert null', () => {
		expect(getNormalperiodMean([], 1961, 1990)).toBeNull();
	});

	it('einzelner Punkt im Range liefert dessen Wert', () => {
		const single: NumericYearPoint[] = [{ year: 1975, value: 9.5 }];
		expect(getNormalperiodMean(single, 1961, 1990)).toBe(9.5);
	});
});

describe('yearValuesToNumeric', () => {
	it('extrahiert `count`-Field zu NumericYearPoints', () => {
		const yv: YearValue[] = [
			{ year: 2000, count: 5 },
			{ year: 2001, count: 7 }
		];
		expect(yearValuesToNumeric(yv, 'count')).toEqual([
			{ year: 2000, value: 5 },
			{ year: 2001, value: 7 }
		]);
	});

	it('extrahiert `temp`-Field zu NumericYearPoints', () => {
		const yv: YearValue[] = [
			{ year: 2000, temp: 9.5 },
			{ year: 2001, temp: 10.1 }
		];
		expect(yearValuesToNumeric(yv, 'temp')).toEqual([
			{ year: 2000, value: 9.5 },
			{ year: 2001, value: 10.1 }
		]);
	});

	it('überspringt Einträge ohne das gewählte Feld', () => {
		const yv: YearValue[] = [
			{ year: 2000, count: 5 },
			{ year: 2001 },
			{ year: 2002, count: 7 }
		];
		expect(yearValuesToNumeric(yv, 'count')).toEqual([
			{ year: 2000, value: 5 },
			{ year: 2002, value: 7 }
		]);
	});

	it('überspringt NaN/Infinity', () => {
		const yv: YearValue[] = [
			{ year: 2000, count: Number.NaN },
			{ year: 2001, count: Number.POSITIVE_INFINITY },
			{ year: 2002, count: 3 }
		];
		expect(yearValuesToNumeric(yv, 'count')).toEqual([{ year: 2002, value: 3 }]);
	});

	it('handles undefined Input als leeres Array', () => {
		expect(yearValuesToNumeric(undefined, 'count')).toEqual([]);
	});
});
