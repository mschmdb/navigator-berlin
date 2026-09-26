import { describe, it, expect } from 'vitest';
import { basePathname } from './base-path.js';

describe('basePathname', () => {
	it('returns the DE pathname unchanged (no prefix)', () => {
		expect(basePathname(new URL('https://navigator.berlin/explore'))).toBe('/explore');
		expect(basePathname(new URL('https://navigator.berlin/kiez/mitte'))).toBe('/kiez/mitte');
	});

	it('strips the en locale prefix', () => {
		expect(basePathname(new URL('https://navigator.berlin/en/explore'))).toBe('/explore');
		expect(basePathname(new URL('https://navigator.berlin/en/kiez/mitte'))).toBe('/kiez/mitte');
	});

	it('strips a bare /en root to /', () => {
		expect(basePathname(new URL('https://navigator.berlin/en'))).toBe('/');
		expect(basePathname(new URL('https://navigator.berlin/en/'))).toBe('/');
	});

	it('/api/* stays /api/* regardless of locale prefix (X-Robots-Tag guard)', () => {
		expect(basePathname(new URL('https://navigator.berlin/api/geocode'))).toBe('/api/geocode');
		expect(basePathname(new URL('https://navigator.berlin/en/api/geocode'))).toBe('/api/geocode');
	});
});
