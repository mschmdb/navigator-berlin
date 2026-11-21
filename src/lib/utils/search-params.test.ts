import { describe, expect, it } from 'vitest';
import { applySearchParamUpdates } from './search-params.js';

describe('applySearchParamUpdates', () => {
	it('setzt und überschreibt Werte', () => {
		expect(applySearchParamUpdates('a=1&b=2', { b: '3', c: '4' })).toBe('a=1&b=3&c=4');
	});

	it('entfernt Schlüssel mit null', () => {
		expect(applySearchParamUpdates('a=1&b=2', { a: null })).toBe('b=2');
	});

	it('liefert leeren String, wenn nichts übrig bleibt', () => {
		expect(applySearchParamUpdates('a=1', { a: null })).toBe('');
	});

	it('kommt mit leerem Ausgangswert klar', () => {
		expect(applySearchParamUpdates('', { a: 'x y' })).toBe('a=x+y');
	});
});
