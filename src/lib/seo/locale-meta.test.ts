import { describe, it, expect } from 'vitest';
import { localeToBcp47, localeToOgLocale } from './locale-meta.js';

describe('localeToBcp47', () => {
	it('maps de to de-DE and en to en-US', () => {
		expect(localeToBcp47('de')).toBe('de-DE');
		expect(localeToBcp47('en')).toBe('en-US');
	});
});

describe('localeToOgLocale', () => {
	it('maps de to de_DE and en to en_US (underscore, og:locale format)', () => {
		expect(localeToOgLocale('de')).toBe('de_DE');
		expect(localeToOgLocale('en')).toBe('en_US');
	});
});
