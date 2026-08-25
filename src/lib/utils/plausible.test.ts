import { afterEach, describe, expect, it, vi } from 'vitest';
import { trackPageview, trackEvent } from './plausible.js';

afterEach(() => vi.unstubAllGlobals());

function stubPlausible(overrides: Record<string, unknown> = {}) {
	const fn = vi.fn();
	vi.stubGlobal('window', {
		plausible: fn,
		location: { origin: 'https://hitze.navigator.berlin', search: '' },
		...overrides
	});
	return fn;
}

describe('trackPageview', () => {
	it('ohne Pfad: einfacher pageview-Call', () => {
		const fn = stubPlausible();
		trackPageview();
		expect(fn).toHaveBeenCalledWith('pageview');
	});

	it('mit Pfad: u + url Override auf origin+path (Hitze-Subdomain → /hitze)', () => {
		const fn = stubPlausible();
		trackPageview('/hitze');
		expect(fn).toHaveBeenCalledWith('pageview', {
			u: 'https://hitze.navigator.berlin/hitze',
			url: 'https://hitze.navigator.berlin/hitze'
		});
	});

	it('bricht nicht, wenn window.plausible fehlt', () => {
		vi.stubGlobal('window', {});
		expect(() => trackPageview('/hitze')).not.toThrow();
	});
});

// Embed-Guard (25.08.): das Talk-Deck bettet /explore als iframe ein,
// jeder Proben-Durchlauf zählte als Besuch. Eingebettet = self !== top.
describe('eingebettet im iframe', () => {
	it('trackPageview feuert nicht, wenn self !== top', () => {
		const fn = stubPlausible({ self: {}, top: {} });
		trackPageview('/explore');
		expect(fn).not.toHaveBeenCalled();
	});

	it('trackEvent feuert nicht, wenn self !== top', () => {
		const fn = stubPlausible({ self: {}, top: {} });
		trackEvent('Search', { q: 'x' });
		expect(fn).not.toHaveBeenCalled();
	});

	it('trackt weiter, wenn self === top', () => {
		const selbst = {};
		const fn = stubPlausible({ self: selbst, top: selbst });
		trackPageview();
		expect(fn).toHaveBeenCalledWith('pageview');
	});
});

describe('trackEvent', () => {
	it('feuert Event mit Props', () => {
		const fn = stubPlausible();
		trackEvent('Search', { q: 'x' });
		expect(fn).toHaveBeenCalledWith('Search', { props: { q: 'x' } });
	});
});
