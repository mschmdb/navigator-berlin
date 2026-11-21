import { describe, it, expect } from 'vitest';
import { localizedHref } from './localized-href.js';

describe('localizedHref', () => {
	it('keeps concrete DE paths as they are', () => {
		expect(localizedHref('/kiez/mitte', 'de')).toBe('/kiez/mitte');
		expect(localizedHref('/explore', 'de')).toBe('/explore');
	});

	it('adds the en prefix', () => {
		expect(localizedHref('/kiez/mitte', 'en')).toBe('/en/kiez/mitte');
	});

	it('resolves the root path', () => {
		expect(localizedHref('/', 'de')).toBe('/');
	});

	it('keeps path segments that look like route groups', () => {
		expect(localizedHref('/stories/(entwurf)', 'de')).toBe('/stories/(entwurf)');
	});

	it('keeps query and hash', () => {
		expect(localizedHref('/explore?kiez=mitte#karte', 'de')).toBe('/explore?kiez=mitte#karte');
	});
});
