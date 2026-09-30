import { describe, it, expect } from 'vitest';
import { toSegments, countsText } from './steckbrief-extras.js';

describe('toSegments', () => {
	it('sortiert absteigend, kapitalisiert, filtert 0', () => {
		const out = toSegments({ gut: 0.17, mittel: 0.67, schlecht: 0.16, leer: 0 });
		expect(out.map((s) => s.label)).toEqual(['Mittel', 'Gut', 'Schlecht']);
		expect(out[0].share).toBeCloseTo(0.67);
	});
	it('null/leeres Objekt → []', () => {
		expect(toSegments(null)).toEqual([]);
		expect(toSegments({})).toEqual([]);
	});
});

describe('toSegments (i18n Block D1: Seiten-Locale)', () => {
	it('Lärm EN: niedrig/mittel/hoch → Low/Medium/High', () => {
		const out = toSegments(
			{ niedrig: 0.17, mittel: 0.67, hoch: 0.16 },
			{ locale: 'en', kind: 'laerm' }
		);
		expect(out.map((s) => s.label)).toEqual(['Medium', 'Low', 'High']);
		expect(out.every((s) => s.lang === undefined)).toBe(true);
	});
	it('Lärm EN: unbekannter Wert bleibt Rohwert mit lang="de"', () => {
		const out = toSegments({ mittel: 0.5, unbekannt: 0.5 }, { locale: 'en', kind: 'laerm' });
		expect(out.find((s) => s.label === 'Unbekannt')?.lang).toBe('de');
	});
	it('Lärm EN: Wohnlage-Wörter (gut, einfach) und "sehr niedrig" nach Skala', () => {
		const out = toSegments(
			{ gut: 0.4, einfach: 0.3, 'sehr niedrig': 0.3 },
			{ locale: 'en', kind: 'laerm' }
		);
		expect(
			out
				.filter((s) => s.lang === 'de')
				.map((s) => s.label)
				.sort()
		).toEqual(['Einfach', 'Gut']);
		expect(out.find((s) => s.lang === undefined)?.label).toBe('Very low');
	});
	it('EN: synonyme Rohwerte werden zu einem Segment mit summiertem Anteil zusammengeführt', () => {
		const gruen = toSegments(
			{ schlecht: 0.2, niedrig: 0.1, gering: 0.1, gut: 0.6 },
			{ locale: 'en', kind: 'gruen' }
		);
		expect(gruen.map((s) => s.label)).toEqual(['High', 'Low']);
		expect(gruen[1].share).toBeCloseTo(0.4);
		const laerm = toSegments(
			{ niedrig: 0.3, gering: 0.2, hoch: 0.5 },
			{ locale: 'en', kind: 'laerm' }
		);
		expect(laerm.map((s) => s.label)).toEqual(['High', 'Low']);
		expect(laerm[0].share).toBeCloseTo(0.5);
		expect(laerm[1].share).toBeCloseTo(0.5);
	});
	it('EN: Groß-/Leerzeichen-Varianten und ausgeschriebene Wohnlagen', () => {
		expect(
			toSegments({ ' Mittel ': 0.5, HOCH: 0.5 }, { locale: 'en', kind: 'laerm' })
				.map((s) => s.label)
				.sort()
		).toEqual(['High', 'Medium']);
		const w = toSegments(
			{ 'gute Wohnlage': 0.5, ' Einfache Wohnlage ': 0.5 },
			{ locale: 'en', kind: 'wohnlage' }
		);
		expect(w.map((s) => s.label).sort()).toEqual([
			'Good residential area',
			'Simple residential area'
		]);
		expect(w.every((s) => s.lang === undefined)).toBe(true);
	});
	it('Grün EN: gut/mittel/schlecht → High/Medium/Low (Story 1.22 harmonisiert)', () => {
		const out = toSegments(
			{ gut: 0.5, mittel: 0.3, schlecht: 0.2 },
			{ locale: 'en', kind: 'gruen' }
		);
		expect(out.map((s) => s.label)).toEqual(['High', 'Medium', 'Low']);
	});
	it('Wohnlage EN: einfach/mittel/gut → residential-area-Wörter', () => {
		const out = toSegments(
			{ mittel: 0.6, gut: 0.3, einfach: 0.1 },
			{ locale: 'en', kind: 'wohnlage' }
		);
		expect(out.map((s) => s.label)).toEqual([
			'Medium residential area',
			'Good residential area',
			'Simple residential area'
		]);
	});
	it('Wohnlage EN: unbekannte Kategorie bleibt Rohwert mit lang="de"', () => {
		const out = toSegments({ sonderlage: 1 }, { locale: 'en', kind: 'wohnlage' });
		expect(out).toEqual([{ label: 'Sonderlage', share: 1, lang: 'de' }]);
	});
	it('DE bleibt unverändert, mit und ohne opts', () => {
		const dist = { gut: 0.17, mittel: 0.67, schlecht: 0.16 };
		const expected = ['Mittel', 'Gut', 'Schlecht'];
		expect(toSegments(dist).map((s) => s.label)).toEqual(expected);
		expect(toSegments(dist, { locale: 'de', kind: 'gruen' }).map((s) => s.label)).toEqual(expected);
	});
});

describe('countsText', () => {
	it('filtert null/0, formatiert', () => {
		expect(
			countsText([
				['U', 3],
				['S', 0],
				['Tram', null],
				['Bus', 12]
			])
		).toBe('U 3 · Bus 12');
	});
	it('leer wenn nichts > 0', () => {
		expect(countsText([['U', 0]])).toBe('');
	});

	// i18n Block B4a
	it('formatiert die Zahl englisch mit opts.locale', () => {
		expect(countsText([['U', 1234]], { locale: 'en' })).toBe('U 1,234');
	});
	it('bleibt ohne opts deutsch (Boundary: geteilter Helfer ohne opts.locale)', () => {
		expect(countsText([['U', 1234]])).toBe('U 1.234');
	});
});
