import { describe, it, expect } from 'vitest';
import {
	isRouteTranslated,
	translatedLocalesFor,
	TRANSLATION_REGISTER
} from './translation-register.js';
import type { TranslationRegisterEntry } from './translation-register.js';

describe('isRouteTranslated', () => {
	it('DE (base locale) is always translated, regardless of path', () => {
		expect(isRouteTranslated('/kiez/mitte', 'de')).toBe(true);
		expect(isRouteTranslated('/does-not-exist', 'de')).toBe(true);
	});

	it('a path not registered for EN stays untranslated (register is NOT a catch-all)', () => {
		expect(isRouteTranslated('/kiez/mitte', 'en')).toBe(false);
		expect(isRouteTranslated('/methodik', 'en')).toBe(false);
	});

	// Review-Fund (i18n Block B): der Register-Eintrag ist ein PRAEFIX
	// (`prefix: true`), keine feste 23-Slug-Liste mehr -- deckt damit auch
	// Wahlen ab, die NACH diesem Commit ins System kommen, ohne dass diese
	// Datei je wieder angefasst werden muss.
	it('Block B: der reale Eintrag ist ein Praefix, deckt /berlin-wahlen + jede beliebige (auch zukuenftige) Detailseite ab', () => {
		expect(TRANSLATION_REGISTER).toEqual([
			{ pathname: '/berlin-wahlen', locale: 'en', prefix: true },
			{ pathname: '/', locale: 'en' }
		]);
		expect(isRouteTranslated('/berlin-wahlen', 'en')).toBe(true);
		expect(isRouteTranslated('/en/berlin-wahlen', 'en')).toBe(true);
		// ein Beispiel-Slug, der zum Zeitpunkt dieses Commits nicht existiert.
		expect(isRouteTranslated('/berlin-wahlen/2099-agh-zweitstimme', 'en')).toBe(true);
		expect(isRouteTranslated('/en/berlin-wahlen/2099-agh-zweitstimme', 'en')).toBe(true);
	});

	// Block B2 (`spec-i18n-b2-shell.md`, Entscheidung Matze 26.09. 2A):
	// Startseite ist als übersetzt registriert, exakter Match ohne `prefix`
	// (kein anderer Pfad unter `/` soll dadurch mit-registriert werden).
	it('Block B2: die Startseite ist registriert, exakt, ohne Praefix-Ausbreitung', () => {
		expect(isRouteTranslated('/', 'en')).toBe(true);
		expect(isRouteTranslated('/en', 'en')).toBe(true);
		expect(isRouteTranslated('/kiez/mitte', 'en')).toBe(false);
	});

	it('ein Praefix-Eintrag matcht NICHT einen aehnlich benannten, aber andersartigen Pfad (kein Segment-Grenzen-Bug)', () => {
		const entries: readonly TranslationRegisterEntry[] = [
			{ pathname: '/berlin-wahlen', locale: 'en', prefix: true }
		];
		expect(isRouteTranslated('/berlin-wahlen-archiv', 'en', entries)).toBe(false);
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
	it('a not-yet-translated path has an empty non-base set', () => {
		expect(translatedLocalesFor('/kiez/mitte', ['de', 'en'])).toEqual([]);
	});

	it('Block B: /berlin-wahlen has en in its non-base set', () => {
		expect(translatedLocalesFor('/berlin-wahlen', ['de', 'en'])).toEqual(['en']);
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
