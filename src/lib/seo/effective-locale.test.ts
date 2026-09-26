import { describe, it, expect, afterEach } from 'vitest';
import { overwriteGetLocale } from '$lib/paraglide/runtime';
import { resolveEffectiveLocale } from './effective-locale.js';
import type { TranslationRegisterEntry } from './translation-register.js';

afterEach(() => {
	overwriteGetLocale(() => 'de');
});

describe('resolveEffectiveLocale', () => {
	it('DE pages always render DE content', () => {
		expect(resolveEffectiveLocale('/kiez/mitte', 'de')).toBe('de');
	});

	it('an unregistered EN page falls back to DE content', () => {
		expect(resolveEffectiveLocale('/kiez/mitte', 'en')).toBe('de');
	});

	// i18n Block B2: die Startseite ist registriert -- eine EN-Homepage zeigt
	// jetzt tatsächlich EN-Content, kein Fallback mehr.
	it('Block B2: die registrierte Startseite behält ihre eigene Locale (kein Fallback mehr)', () => {
		expect(resolveEffectiveLocale('/', 'en')).toBe('en');
	});

	// Positive case: an injected register entry (no module-mocking) proves the
	// EN page keeps its own locale once the path IS registered as translated,
	// for both the base-path and the already-locale-prefixed form.
	it('a registered path keeps pageLocale (injected entries, positive case)', () => {
		const entries: readonly TranslationRegisterEntry[] = [{ pathname: '/methodik', locale: 'en' }];
		expect(resolveEffectiveLocale('/methodik', 'en', entries)).toBe('en');
		expect(resolveEffectiveLocale('/en/methodik', 'en', entries)).toBe('en');
	});

	it('an unregistered path still falls back to DE even with a non-matching entry present', () => {
		const entries: readonly TranslationRegisterEntry[] = [{ pathname: '/methodik', locale: 'en' }];
		expect(resolveEffectiveLocale('/kiez/mitte', 'en', entries)).toBe('de');
	});

	it('defaults pageLocale to getLocale() when omitted', () => {
		overwriteGetLocale(() => 'en');
		expect(resolveEffectiveLocale('/kiez/mitte')).toBe('de');

		overwriteGetLocale(() => 'de');
		expect(resolveEffectiveLocale('/kiez/mitte')).toBe('de');
	});
});
