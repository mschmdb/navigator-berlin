import { describe, it, expect } from 'vitest';
import { describeOepnvDichte, oepnvErklaerungDe, formatStopsPerKm2 } from './oepnv.js';

describe('describeOepnvDichte', () => {
	it('kategorisiert nach Schwellen (Alt-Verhalten)', () => {
		expect(describeOepnvDichte(25)).toBe('sehr dicht');
		expect(describeOepnvDichte(15)).toBe('dicht');
		expect(describeOepnvDichte(8)).toBe('mittel');
		expect(describeOepnvDichte(2)).toBe('dünn');
		expect(describeOepnvDichte(null)).toBe('unbekannt');
	});

	// i18n Block B4a
	it('liefert EN mit opts.locale', () => {
		expect(describeOepnvDichte(25, { locale: 'en' })).toBe('very dense');
		expect(describeOepnvDichte(15, { locale: 'en' })).toBe('dense');
		expect(describeOepnvDichte(8, { locale: 'en' })).toBe('moderate');
		expect(describeOepnvDichte(2, { locale: 'en' })).toBe('sparse');
		expect(describeOepnvDichte(null, { locale: 'en' })).toBe('unknown');
	});
});

describe('oepnvErklaerungDe', () => {
	it('bleibt DE ohne opts (Server-FAQ-Boundary)', () => {
		expect(oepnvErklaerungDe(25)).toMatch(/innerstädtischer Bezirke/);
	});
	it('liefert EN mit opts.locale', () => {
		expect(oepnvErklaerungDe(25, { locale: 'en' })).toBe(
			'That matches the level of inner-city Bezirke, with tram and bus stops within short walking distance.'
		);
	});
});

describe('formatStopsPerKm2', () => {
	it('formatiert de mit Komma (Alt-Verhalten)', () => {
		expect(formatStopsPerKm2(12.34)).toBe('12,3');
	});
	it('formatiert en mit Punkt', () => {
		expect(formatStopsPerKm2(12.34, { locale: 'en' })).toBe('12.3');
	});
});
