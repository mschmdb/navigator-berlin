import { describe, expect, it } from 'vitest';
import {
	shortenSource,
	shortenLicense,
	isOutdated,
	formatYearMonth
} from './source-shortener.js';

describe('shortenSource', () => {
	it('FIS-Broker-URL → "FIS-Broker"', () => {
		expect(shortenSource('https://fbinter.stadt-berlin.de/foo/bar')).toBe('FIS-Broker');
	});
	it('ODIS-URL → "ODIS Berlin"', () => {
		expect(shortenSource('https://daten.odis-berlin.de/x.geojson')).toBe('ODIS Berlin');
	});
	it('DWD-URL → "DWD"', () => {
		expect(shortenSource('https://opendata.dwd.de/cdc/data')).toBe('DWD');
	});
	it('Overpass-URL → "OpenStreetMap"', () => {
		expect(shortenSource('https://overpass-api.de/api/interpreter')).toBe('OpenStreetMap');
	});
	it('Unknown URL → hostname', () => {
		expect(shortenSource('https://example.org/foo')).toBe('example.org');
	});
	it('Invalid URL → Input as-is', () => {
		expect(shortenSource('not-a-url')).toBe('not-a-url');
	});
});

describe('shortenLicense', () => {
	it('dl-de/zero-2-0 → "dl-de/zero"', () => {
		expect(shortenLicense('dl-de/zero-2-0')).toBe('dl-de/zero');
	});
	it('dl-de/by-2-0 → "dl-de/by"', () => {
		expect(shortenLicense('dl-de/by-2-0')).toBe('dl-de/by');
	});
	it('CC BY 4.0 → "CC BY"', () => {
		expect(shortenLicense('CC BY 4.0')).toBe('CC BY');
	});
	it('ODbL 1.0 → "ODbL"', () => {
		expect(shortenLicense('ODbL 1.0')).toBe('ODbL');
	});
	it('Geodatenzugangsgesetz → "GeoZG"', () => {
		expect(shortenLicense('Geodatenzugangsgesetz')).toBe('GeoZG');
	});
});

describe('isOutdated', () => {
	const now = new Date('2026-05-12T00:00:00Z');

	it('Datum <2 Jahre → false', () => {
		expect(isOutdated('2025-01-01T00:00:00Z', now)).toBe(false);
	});

	it('Datum >2 Jahre → true', () => {
		expect(isOutdated('2023-01-01T00:00:00Z', now)).toBe(true);
	});

	it('Grenze: knapp <2 Jahre → false', () => {
		expect(isOutdated('2024-06-01T00:00:00Z', now)).toBe(false);
	});

	it('Invalid date → false (kein false-positive)', () => {
		expect(isOutdated('nicht-ein-datum', now)).toBe(false);
	});
});

describe('formatYearMonth', () => {
	it('ISO mit Zeit → YYYY-MM', () => {
		expect(formatYearMonth('2024-03-15T12:34:56Z')).toBe('2024-03');
	});
	it('Date-only ISO → YYYY-MM', () => {
		expect(formatYearMonth('2025-09-01')).toBe('2025-09');
	});
	it('Invalid date → Input unverändert', () => {
		expect(formatYearMonth('invalid')).toBe('invalid');
	});
});
