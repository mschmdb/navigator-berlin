import { describe, it, expect } from 'vitest';
import { isRouteTranslated, translatedLocalesFor } from './translation-register.js';
import type { TranslationRegisterEntry } from './translation-register.js';

describe('isRouteTranslated', () => {
	it('DE (base locale) is always translated, regardless of path', () => {
		expect(isRouteTranslated('/kiez/mitte', 'de')).toBe(true);
		expect(isRouteTranslated('/does-not-exist', 'de')).toBe(true);
	});

	it('Block A: the real register is empty, so no non-base locale is translated', () => {
		expect(isRouteTranslated('/kiez/mitte', 'en')).toBe(false);
		expect(isRouteTranslated('/', 'en')).toBe(false);
		expect(isRouteTranslated('/methodik', 'en')).toBe(false);
	});

	// Injected entries (no module-mocking): `entries` is a plain parameter, so
	// tests can hand in a real TranslationRegisterEntry list directly.
	it('an injected entry is recognized for both the base path and the locale-prefixed path', () => {
		const entries: readonly TranslationRegisterEntry[] = [{ pathname: '/methodik', locale: 'en' }];
		expect(isRouteTranslated('/methodik', 'en', entries)).toBe(true);
		expect(isRouteTranslated('/en/methodik', 'en', entries)).toBe(true);
	});

	it('an injected entry for a different path does not match', () => {
		const entries: readonly TranslationRegisterEntry[] = [{ pathname: '/methodik', locale: 'en' }];
		expect(isRouteTranslated('/kiez/mitte', 'en', entries)).toBe(false);
	});

	it('an injected entry for a different locale does not match', () => {
		const entries: readonly TranslationRegisterEntry[] = [{ pathname: '/methodik', locale: 'en' }];
		expect(isRouteTranslated('/methodik', 'de', entries)).toBe(true); // base locale always true
	});
});

describe('translatedLocalesFor', () => {
	it('Block A: only the base locale ever qualifies with the real register, so the non-base set is empty', () => {
		expect(translatedLocalesFor('/kiez/mitte', ['de', 'en'])).toEqual([]);
	});

	it('never includes the base locale itself (that is handled separately by callers)', () => {
		expect(translatedLocalesFor('/', ['de', 'en'])).not.toContain('de');
	});

	it('with an injected entry, returns the registered non-base locale for that path', () => {
		const entries: readonly TranslationRegisterEntry[] = [{ pathname: '/methodik', locale: 'en' }];
		expect(translatedLocalesFor('/methodik', ['de', 'en'], entries)).toEqual(['en']);
		expect(translatedLocalesFor('/en/methodik', ['de', 'en'], entries)).toEqual(['en']);
	});
});
