import { describe, expect, it } from 'vitest';
import { demografieBezugLabel } from './demografie-types.js';

describe('demografieBezugLabel', () => {
	it('standort nennt Umgebung + Planungsraum', () => {
		expect(demografieBezugLabel('standort', null)).toBe('Umgebung · statistischer Planungsraum');
	});

	it('kiez/bezirk mit Namen', () => {
		expect(demografieBezugLabel('kiez', 'Beispielkiez')).toBe('Kiez Beispielkiez');
		expect(demografieBezugLabel('bezirk', 'Mitte')).toBe('Bezirk Mitte');
	});

	it('kiez/bezirk ohne Namen fällt auf das blanke Label zurück', () => {
		expect(demografieBezugLabel('kiez', null)).toBe('Kiez');
		expect(demografieBezugLabel('bezirk', null)).toBe('Bezirk');
	});

	// i18n Block B3b: ohne `opts.locale` bleibt die Funktion DE (Boundary,
	// vom KI-Export ohne `opts` genutzt).
	it('ohne opts bleibt DE', () => {
		expect(demografieBezugLabel('standort', null)).toBe('Umgebung · statistischer Planungsraum');
	});

	it('opts.locale "en" übersetzt Umgebung, "Kiez"/"Bezirk" bleiben deutsch', () => {
		expect(demografieBezugLabel('standort', null, { locale: 'en' })).toBe(
			'Surrounding area · statistical planning zone'
		);
		expect(demografieBezugLabel('kiez', 'Beispielkiez', { locale: 'en' })).toBe(
			'Kiez Beispielkiez'
		);
		expect(demografieBezugLabel('bezirk', 'Mitte', { locale: 'en' })).toBe('Bezirk Mitte');
	});
});
