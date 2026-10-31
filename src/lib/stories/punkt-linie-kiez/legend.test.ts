import { afterEach, describe, expect, it } from 'vitest';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import { legendRows } from './legend';
import type { Kennzahlen } from './types';

const fk: Kennzahlen = {
	slug: 'friedrichshain-kreuzberg',
	gruen: 0.4444,
	altbauAnteil: 0.5363,
	laermDb: 49.3,
	bewohnerProKm2: 14344,
	haltestelle400mAnteil: 0.994,
	clubs: 46
};

afterEach(() => overwriteGetLocale(() => 'de'));

describe('legendRows', () => {
	it('nennt Form, Bedeutung und Wert auf Deutsch, klein geschrieben', () => {
		overwriteGetLocale(() => 'de');
		const rows = legendRows(fk);
		expect(rows.map((r) => r.key)).toEqual([
			'circle',
			'square',
			'triangle',
			'bar',
			'lines',
			'donut'
		]);
		expect(rows.map((r) => r.label)).toEqual([
			'kreis: grünversorgung',
			'quadrat: altbau vor 1949',
			'dreieck: lärm',
			'balken: bewohner pro km²',
			'linien: haltestelle in 400 m',
			'donut: clubs'
		]);
		expect(rows.map((r) => r.value)).toEqual([
			'44 / 100',
			'54 %',
			'49,3 dB',
			'14.344',
			'99,4 % der Menschen',
			'46'
		]);
	});

	it('nennt dieselben Werte auf Englisch', () => {
		overwriteGetLocale(() => 'en');
		const rows = legendRows(fk);
		expect(rows[0]!.label).toBe('circle: green space');
		expect(rows.map((r) => r.value)).toEqual([
			'44 / 100',
			'54%',
			'49.3 dB',
			'14,344',
			'99.4% of residents',
			'46'
		]);
	});

	it('schreibt bei null "keine Daten" und markiert die Zeile', () => {
		const rows = legendRows({ ...fk, laermDb: null, haltestelle400mAnteil: null });
		const triangle = rows.find((r) => r.key === 'triangle')!;
		expect(triangle.value).toBe('keine Daten');
		expect(triangle.hasData).toBe(false);
		expect(rows.find((r) => r.key === 'lines')!.value).toBe('keine Daten');
		expect(rows.find((r) => r.key === 'circle')!.hasData).toBe(true);
	});

	it('schreibt ohne Clubs "0" und behält die Zeile', () => {
		const donut = legendRows({ ...fk, clubs: 0 }).find((r) => r.key === 'donut')!;
		expect(donut.value).toBe('0');
		expect(donut.hasData).toBe(true);
	});

	it('zeichnet die Linien in Tinte wie die Form', () => {
		expect(legendRows(fk).find((r) => r.key === 'lines')!.color).toBe('#26221e');
	});

	it('nimmt die Farben aus den Tokens', () => {
		const rows = legendRows(fk);
		expect(rows.find((r) => r.key === 'circle')!.color).toBe('#3a8a55');
		expect(rows.find((r) => r.key === 'donut')!.color).toBe('#24579e');
	});

	it('nimmt eine explizite Locale statt der Laufzeit-Locale', () => {
		overwriteGetLocale(() => 'de');
		const rows = legendRows(fk, 'en');
		expect(rows[0]!.label).toBe('circle: green space');
		expect(rows[2]!.value).toBe('49.3 dB');
		expect(rows[4]!.value).toBe('99.4% of residents');
	});
});
