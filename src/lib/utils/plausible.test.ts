import { afterEach, describe, expect, it, vi } from 'vitest';
import { trackPageview, trackEvent } from './plausible.js';

afterEach(() => vi.unstubAllGlobals());

function stubPlausible() {
	const fn = vi.fn();
	vi.stubGlobal('window', {
		plausible: fn,
		location: { origin: 'https://hitze.navigator.berlin', search: '' }
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

describe('trackEvent', () => {
	it('feuert Event mit Props', () => {
		const fn = stubPlausible();
		trackEvent('Search', { q: 'x' });
		expect(fn).toHaveBeenCalledWith('Search', { props: { q: 'x' } });
	});
});
