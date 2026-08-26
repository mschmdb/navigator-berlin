import { describe, it, expect } from 'vitest';
import { staleLocaleRedirectTarget } from './stale-locale-redirect.js';

describe('staleLocaleRedirectTarget', () => {
	it('strips a stale non-base locale prefix from a deep path', () => {
		expect(staleLocaleRedirectTarget('/es/kiez/koellnische-vorstadt-spindlersfeld')).toBe(
			'/kiez/koellnische-vorstadt-spindlersfeld'
		);
		expect(staleLocaleRedirectTarget('/fr/layer/radverkehrsnetz-2025')).toBe(
			'/layer/radverkehrsnetz-2025'
		);
		expect(staleLocaleRedirectTarget('/ar/kiez/neu-lichtenberg')).toBe('/kiez/neu-lichtenberg');
	});

	it('strips the base-locale prefix (de has no prefix in DE-only mode)', () => {
		expect(staleLocaleRedirectTarget('/de/kiez/altstadt-koepenick')).toBe(
			'/kiez/altstadt-koepenick'
		);
	});

	it('redirects a bare locale root to site root', () => {
		expect(staleLocaleRedirectTarget('/de')).toBe('/');
		expect(staleLocaleRedirectTarget('/fr')).toBe('/');
		expect(staleLocaleRedirectTarget('/de/')).toBe('/');
		expect(staleLocaleRedirectTarget('/it/')).toBe('/');
	});

	it('returns null for paths without a stale locale prefix', () => {
		expect(staleLocaleRedirectTarget('/kiez/marzahn-mitte')).toBeNull();
		expect(staleLocaleRedirectTarget('/')).toBeNull();
		expect(staleLocaleRedirectTarget('/explore')).toBeNull();
		expect(staleLocaleRedirectTarget('/wo-lebt-es-sich-gut')).toBeNull();
		expect(staleLocaleRedirectTarget('/api/geocode')).toBeNull();
	});

	it('does not treat real route segments that merely start with locale letters as locales', () => {
		// "explore" starts with no locale; guard against accidental 2-char-prefix matching
		expect(staleLocaleRedirectTarget('/architektur')).toBeNull();
		expect(staleLocaleRedirectTarget('/impressum')).toBeNull();
	});

	it('matches the locale segment case-insensitively', () => {
		expect(staleLocaleRedirectTarget('/DE/kiez/heerstrasse')).toBe('/kiez/heerstrasse');
		expect(staleLocaleRedirectTarget('/Es/kiez/heerstrasse')).toBe('/kiez/heerstrasse');
	});

	it('never returns an off-site target (scheme-relative remainder)', () => {
		// /de//evil.com would otherwise yield //evil.com, an absolute redirect off-origin
		expect(staleLocaleRedirectTarget('/de//evil.com/login')).toBe('/evil.com/login');
		expect(staleLocaleRedirectTarget('/en//attacker.example')).toBe('/attacker.example');
		expect(staleLocaleRedirectTarget('/fr///triple.example')).toBe('/triple.example');
	});

	it('collapses backslash and mixed-slash tricks to a single leading slash', () => {
		// browsers treat \ as / in URLs; /de/\evil.com must not escape the origin
		expect(staleLocaleRedirectTarget('/de/\\evil.com')).toBe('/evil.com');
		expect(staleLocaleRedirectTarget('/de/\\\\evil.com')).toBe('/evil.com');
		expect(staleLocaleRedirectTarget('/de//\\evil.com')).toBe('/evil.com');
	});

	it('keeps a normal single-slash deep path intact', () => {
		expect(staleLocaleRedirectTarget('/de/kiez/alt-treptow')).toBe('/kiez/alt-treptow');
	});
});
