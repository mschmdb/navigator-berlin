import { describe, expect, it } from 'vitest';
import { createPlexMarker } from './map-markers.js';

describe('createPlexMarker', () => {
	it('erzeugt DIV mit plex-marker class', () => {
		const el = createPlexMarker();
		expect(el.tagName).toBe('DIV');
		expect(el.className).toContain('plex-marker');
	});

	it('hat aria-hidden=true', () => {
		const el = createPlexMarker();
		expect(el.getAttribute('aria-hidden')).toBe('true');
	});

	it('Visual: 12x12, border-radius round, Token-Hex', () => {
		const el = createPlexMarker();
		expect(el.style.width).toBe('12px');
		expect(el.style.height).toBe('12px');
		expect(el.style.borderRadius).toBe('50%');
		expect(el.style.background.toLowerCase()).toMatch(/(#2a3f7c|rgb\(42,\s*63,\s*124\))/);
	});
});
