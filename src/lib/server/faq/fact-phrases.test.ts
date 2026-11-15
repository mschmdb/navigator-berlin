import { describe, it, expect } from 'vitest';
import { gruenEinstufung, gruenVerteilung, oepnvModiSatz } from './fact-phrases.js';

const counts = (u: number | null, s: number | null, t: number | null, b: number | null) => ({
	uBahnCount: u,
	sBahnCount: s,
	tramCount: t,
	busCount: b
});

describe('oepnvModiSatz', () => {
	it('nennt vorhandene Verkehrsmittel mit Zahl und verneint fehlende', () => {
		expect(oepnvModiSatz(counts(2, 0, 0, 32), 'de')).toBe(
			'Der Datensatz zählt hier 2 U-Bahnhöfe und 32 Bushaltestellen. Es gibt keinen S-Bahnhof und keine Tramhaltestelle.'
		);
		expect(oepnvModiSatz(counts(2, 0, 0, 32), 'en')).toBe(
			'The dataset counts 2 U-Bahn stations and 32 bus stops here. There is no S-Bahn station and no tram stop.'
		);
	});

	it('nutzt Einzahl und Listen mit drei Einträgen', () => {
		expect(oepnvModiSatz(counts(1, 1, 3, 1), 'de')).toBe(
			'Der Datensatz zählt hier 1 U-Bahnhof, 1 S-Bahnhof, 3 Tramhaltestellen und 1 Bushaltestelle.'
		);
		expect(oepnvModiSatz(counts(1, 1, 3, 1), 'en')).toBe(
			'The dataset counts 1 U-Bahn station, 1 S-Bahn station, 3 tram stops and 1 bus stop here.'
		);
	});

	it('formatiert große Zahlen nach Locale', () => {
		expect(oepnvModiSatz(counts(0, 0, 0, 1234), 'de')).toContain('1.234 Bushaltestellen');
		expect(oepnvModiSatz(counts(0, 0, 0, 1234), 'en')).toContain('1,234 bus stops');
	});

	it('liefert einen leeren Text ohne Zähldaten', () => {
		expect(oepnvModiSatz(counts(null, null, null, null), 'de')).toBe('');
	});

	it('meldet einen Ort ganz ohne Halte', () => {
		expect(oepnvModiSatz(counts(0, 0, 0, 0), 'de')).toBe('Der Datensatz zählt hier keine Halte.');
	});
});

describe('gruenEinstufung / gruenVerteilung', () => {
	it('überwiegend bei Mehrheit, Anteile absteigend', () => {
		const dist = { mittel: 0.2, schlecht: 0.8 };
		expect(gruenEinstufung(dist, 'de')).toBe('überwiegend als „schlecht“');
		expect(gruenVerteilung(dist, 'de')).toBe('„schlecht“ 80 %, „mittel“ 20 %');
		expect(gruenEinstufung(dist, 'en')).toBe('mostly as “poor”');
		expect(gruenVerteilung(dist, 'en')).toBe('“poor” 80%, “medium” 20%');
	});

	it('durchgehend bei 100 %', () => {
		expect(gruenEinstufung({ gut: 1 }, 'de')).toBe('durchgehend als „gut“');
		expect(gruenEinstufung({ gut: 1 }, 'en')).toBe('throughout as “good”');
	});

	it('am häufigsten ohne Mehrheit, beide Klassen bei Gleichstand', () => {
		expect(gruenEinstufung({ gut: 0.4, mittel: 0.3, schlecht: 0.3 }, 'de')).toBe(
			'am häufigsten als „gut“'
		);
		expect(gruenEinstufung({ gut: 0.5, schlecht: 0.5 }, 'de')).toBe(
			'je zur Hälfte als „gut“ und „schlecht“'
		);
	});

	it('unbekannte Rohwerte bleiben, wie sie sind', () => {
		expect(gruenVerteilung({ 'sehr gut': 1 }, 'en')).toBe('“sehr gut” 100%');
	});
});
