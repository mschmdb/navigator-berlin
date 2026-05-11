import { describe, expect, it } from 'vitest';
import { parseDwdKlCsv, aggregateYearly, type DailyRecord } from './dwd.js';

// Mini-Fixture: DWD KL-Tageswerte-Format (Semikolon-separiert, Pre-Whitespace, eor-Trailer)
// MESS_DATUM YYYYMMDD, TXK (Maximum-Tagestemp 2m), TNK (Minimum), TMK (Mittel).
// Sentinel -999 = missing.
const FIXTURE = `STATIONS_ID;MESS_DATUM;QN_3;FX;FM;QN_4;RSK;RSKF;SDK;SHK_TAG;NM;VPM;PM;TMK;UPM;TXK;TNK;TGK;eor
        403;19500101;    1;-999; 4.2;    1; 0.0;   0;-999;   0;  6.7;-999;-999; -2.1; 87.0;  2.3; -6.8; -999;eor
        403;19500102;    1;-999; 3.1;    1; 0.1;   0;-999;   0;  7.0;-999;-999; -1.0; 88.0;  1.5; -3.5; -999;eor
        403;19500703;    1;-999; 2.0;    1; 0.0;   0; 9.0;   0;  3.0;-999;-999; 22.0; 60.0; 28.5; 15.0; -999;eor
        403;19500704;    1;-999; 2.0;    1; 0.0;   0; 9.0;   0;  3.0;-999;-999; 25.0; 55.0; 32.4; 18.0; -999;eor
        403;19500705;    1;-999; 2.0;    1; 0.0;   0; 9.0;   0;  3.0;-999;-999; 26.0; 55.0; 30.0; 20.0; -999;eor
        403;19510715;    1;-999; 2.0;    1; 0.0;   0; 9.0;   0;  3.0;-999;-999; 22.0; 55.0; 26.0; 17.0; -999;eor
`;

describe('parseDwdKlCsv', () => {
	it('parsed Fixture mit 6 records', () => {
		const records = parseDwdKlCsv(FIXTURE);
		expect(records).toHaveLength(6);
		expect(records[0].date).toBe('1950-01-01');
		expect(records[0].txk).toBe(2.3);
		expect(records[0].tnk).toBe(-6.8);
		expect(records[0].tmk).toBe(-2.1);
	});

	it('mappt Sentinel -999 zu null', () => {
		const lines = `STATIONS_ID;MESS_DATUM;QN_3;FX;FM;QN_4;RSK;RSKF;SDK;SHK_TAG;NM;VPM;PM;TMK;UPM;TXK;TNK;TGK;eor
        403;19500101;    1;-999; 4.2;    1; 0.0;   0;-999;   0;  6.7;-999;-999;-999.0;87.0;-999.0;-999.0;-999;eor
`;
		const records = parseDwdKlCsv(lines);
		expect(records[0].txk).toBeNull();
		expect(records[0].tnk).toBeNull();
		expect(records[0].tmk).toBeNull();
	});

	it('ueberspringt empty + non-data lines', () => {
		const lines = `STATIONS_ID;MESS_DATUM;QN_3;FX;FM;QN_4;RSK;RSKF;SDK;SHK_TAG;NM;VPM;PM;TMK;UPM;TXK;TNK;TGK;eor

        403;19500101;    1;-999; 4.2;    1; 0.0;   0;-999;   0;  6.7;-999;-999; -2.1; 87.0;  2.3; -6.8; -999;eor
`;
		expect(parseDwdKlCsv(lines)).toHaveLength(1);
	});
});

describe('aggregateYearly', () => {
	const records: DailyRecord[] = [
		{ date: '1950-01-01', txk: 2.3, tnk: -6.8, tmk: -2.1 },
		{ date: '1950-01-02', txk: 1.5, tnk: -3.5, tmk: -1.0 },
		{ date: '1950-07-03', txk: 28.5, tnk: 15.0, tmk: 22.0 },
		{ date: '1950-07-04', txk: 32.4, tnk: 18.0, tmk: 25.0 },
		{ date: '1950-07-05', txk: 30.0, tnk: 20.0, tmk: 26.0 },
		{ date: '1951-07-15', txk: 26.0, tnk: 17.0, tmk: 22.0 }
	];

	it('summerDays >= 25C TXK pro Jahr', () => {
		const agg = aggregateYearly(records);
		expect(agg.summerDays).toEqual([
			{ year: 1950, count: 3 },
			{ year: 1951, count: 1 }
		]);
	});

	it('frostDays < 0C TNK pro Jahr', () => {
		const agg = aggregateYearly(records);
		expect(agg.frostDays).toEqual([
			{ year: 1950, count: 2 },
			{ year: 1951, count: 0 }
		]);
	});

	it('hotDays >= 30C TXK pro Jahr', () => {
		const agg = aggregateYearly(records);
		expect(agg.hotDays).toEqual([
			{ year: 1950, count: 2 },
			{ year: 1951, count: 0 }
		]);
	});

	it('ignoriert null-Werte', () => {
		const recs: DailyRecord[] = [
			{ date: '1950-07-03', txk: null, tnk: null, tmk: null },
			{ date: '1950-07-04', txk: 32.0, tnk: 18.0, tmk: 25.0 }
		];
		const agg = aggregateYearly(recs);
		expect(agg.summerDays).toEqual([{ year: 1950, count: 1 }]);
		expect(agg.hotDays).toEqual([{ year: 1950, count: 1 }]);
	});

	it('mehrere Jahre sortiert', () => {
		const recs: DailyRecord[] = [
			{ date: '1952-01-01', txk: 5, tnk: -2, tmk: 1 },
			{ date: '1950-01-01', txk: 5, tnk: -2, tmk: 1 },
			{ date: '1951-01-01', txk: 5, tnk: -2, tmk: 1 }
		];
		const agg = aggregateYearly(recs);
		expect(agg.summerDays.map((d) => d.year)).toEqual([1950, 1951, 1952]);
	});
});
