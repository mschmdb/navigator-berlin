import { describe, it, expect } from 'vitest';
import { klimaSatz, oepnvModiSatz, oepnvUrteil, rangLage, vergleich } from './fact-phrases.js';

const counts = (u: number | null, s: number | null, t: number | null, b: number | null) => ({
	uBahnCount: u,
	sBahnCount: s,
	tramCount: t,
	busCount: b
});

describe('oepnvModiSatz', () => {
	it('nennt vorhandene Verkehrsmittel und verneint fehlende (Reuterstraße)', () => {
		expect(oepnvModiSatz(counts(2, 0, 0, 32), 'kiez', 'de')).toBe(
			'Im Kiez liegen 2 U-Bahnhöfe und 32 Bushaltestellen, aber kein S-Bahnhof und keine Tramhaltestelle.'
		);
		expect(oepnvModiSatz(counts(2, 0, 0, 32), 'kiez', 'en')).toBe(
			'The Kiez has 2 U-Bahn stations and 32 bus stops, but no S-Bahn station and no tram stop.'
		);
	});

	it('Kiez ohne Bahnhof, nur Bus, Einzahl', () => {
		expect(oepnvModiSatz(counts(0, 0, 0, 1), 'kiez', 'de')).toBe(
			'Im Kiez liegt eine Bushaltestelle, aber kein U-Bahnhof, kein S-Bahnhof und keine Tramhaltestelle.'
		);
	});

	it('zwei Bahnhöfe mit Zahlwort (sehr kleiner Kiez)', () => {
		expect(oepnvModiSatz(counts(1, 1, 0, 0), 'kiez', 'de')).toBe(
			'Im Kiez liegen ein U-Bahnhof und ein S-Bahnhof, aber keine Tramhaltestelle und keine Bushaltestelle.'
		);
		expect(oepnvModiSatz(counts(1, 1, 0, 0), 'kiez', 'en')).toBe(
			'The Kiez has one U-Bahn station and one S-Bahn station, but no tram stop and no bus stop.'
		);
	});

	it('formatiert große Zahlen nach Locale (Bezirk)', () => {
		expect(oepnvModiSatz(counts(0, 0, 0, 1234), 'bezirk', 'de')).toContain(
			'Im Bezirk liegen 1.234 Bushaltestellen'
		);
		expect(oepnvModiSatz(counts(0, 0, 0, 1234), 'bezirk', 'en')).toContain('1,234 bus stops');
	});

	it('ohne Zähldaten leer, bei Teil-Nullen nur diese verneinen', () => {
		expect(oepnvModiSatz(counts(null, null, null, null), 'kiez', 'de')).toBe('');
		expect(oepnvModiSatz(counts(0, null, null, null), 'kiez', 'de')).toBe(
			'Im Kiez liegt kein U-Bahnhof.'
		);
		expect(oepnvModiSatz(counts(0, null, null, null), 'kiez', 'en')).toBe(
			'The Kiez has no U-Bahn station.'
		);
	});

	it('ganz ohne Halte', () => {
		expect(oepnvModiSatz(counts(0, 0, 0, 0), 'kiez', 'de')).toBe(
			'Im Kiez liegt keine Haltestelle.'
		);
	});
});

describe('oepnvUrteil / klimaSatz', () => {
	it('Urteil folgt den Dichte-Schwellen', () => {
		expect(oepnvUrteil(23.9, 'de')).toMatch(/sehr dicht/);
		expect(oepnvUrteil(11.9, 'de')).toMatch(/mittel dicht/);
		expect(oepnvUrteil(2, 'en')).toMatch(/sparse/);
	});

	it('gefühlte Temperatur mit Urteil zuerst', () => {
		expect(klimaSatz(35.3, 'de')).toBe(
			'An heißen Tagen wird es hier warm, aber nicht extrem: Die gefühlte Temperatur liegt im Schnitt bei 35,3 Grad.'
		);
		expect(klimaSatz(34.2, 'en')).toBe(
			'On hot days it stays comparatively bearable here: the perceived temperature averages 34.2 degrees.'
		);
	});
});

describe('rangLage / vergleich', () => {
	it('Platz, geteilter Platz, unteres Viertel', () => {
		expect(rangLage({ rang: 55, quartil: 2, total: 143 }, 'kiez', 'de')).toBe(
			'Platz 55 von 143 Kiezen'
		);
		expect(rangLage({ rang: 7, quartil: 1, total: 143, geteiltMit: 2 }, 'kiez', 'de')).toBe(
			'geteilter Platz 7 von 143 Kiezen'
		);
		expect(rangLage({ rang: 7, quartil: 1, total: 143, geteiltMit: 2 }, 'kiez', 'en')).toBe(
			'joint rank 7 of 143 Kieze'
		);
		expect(rangLage({ rang: 140, quartil: 4, total: 143 }, 'kiez', 'de')).toBe(
			'im unteren Viertel der 143 Kieze'
		);
		expect(rangLage({ rang: 9, quartil: 3, total: 12 }, 'bezirk', 'de')).toBe(
			'Platz 9 von 12 Bezirken'
		);
		expect(rangLage({ rang: null, quartil: null, total: 143 }, 'kiez', 'de')).toBeNull();
	});

	it('Vergleich mit Ein-Punkt-Toleranz', () => {
		expect(vergleich(30, 25, 'bezirk', 'de')).toBe('mehr als im Schnitt der Kieze im Bezirk');
		expect(vergleich(22, 22.3, 'berlin', 'de')).toBe(
			'etwa so viel wie beim mittleren Berliner Bezirk'
		);
		expect(vergleich(10, 20, 'berlin', 'en')).toBe('less than the median Berlin Bezirk');
		expect(vergleich(null, 20, 'berlin', 'en')).toBeNull();
	});
});
