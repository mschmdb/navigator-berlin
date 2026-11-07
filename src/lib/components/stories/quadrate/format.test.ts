import { afterEach, describe, expect, it } from 'vitest';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import { aktuelleSprache, ganzeProzent } from './format';

afterEach(() => overwriteGetLocale(() => 'de'));

describe('format', () => {
	it('schreibt ganze Prozent auf Deutsch mit geschütztem Leerzeichen', () => {
		overwriteGetLocale(() => 'de');
		expect(aktuelleSprache()).toBe('de');
		expect(ganzeProzent(5)).toBe('5 %');
		expect(ganzeProzent(0)).toBe('0 %');
	});

	it('schreibt ganze Prozent auf Englisch ohne Leerzeichen', () => {
		overwriteGetLocale(() => 'en');
		expect(aktuelleSprache()).toBe('en');
		expect(ganzeProzent(12)).toBe('12%');
	});
});
