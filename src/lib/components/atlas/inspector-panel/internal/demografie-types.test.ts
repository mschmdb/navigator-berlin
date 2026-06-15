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
});
