import { describe, it, expect } from 'vitest';
import { buildCanonical } from './canonical.js';

describe('buildCanonical', () => {
	it('joins origin and pathname', () => {
		expect(buildCanonical('https://navigator.berlin', '/methodik')).toBe(
			'https://navigator.berlin/methodik'
		);
	});

	it('strips query string from pathname-with-search input', () => {
		expect(buildCanonical('https://navigator.berlin', '/?bbox=13.3,52.5,13.5,52.6')).toBe(
			'https://navigator.berlin/'
		);
	});

	it('strips trailing slash except on root', () => {
		expect(buildCanonical('https://navigator.berlin', '/methodik/')).toBe(
			'https://navigator.berlin/methodik'
		);
		expect(buildCanonical('https://navigator.berlin', '/')).toBe('https://navigator.berlin/');
	});

	it('keeps root pathname as "/"', () => {
		expect(buildCanonical('https://navigator.berlin', '/')).toBe('https://navigator.berlin/');
	});

	it('removes trailing slash from origin to avoid doubles', () => {
		expect(buildCanonical('https://navigator.berlin/', '/methodik')).toBe(
			'https://navigator.berlin/methodik'
		);
	});

	it('normalizes pathname without leading slash', () => {
		expect(buildCanonical('https://navigator.berlin', 'methodik')).toBe(
			'https://navigator.berlin/methodik'
		);
	});

	it('handles nested path', () => {
		expect(buildCanonical('https://navigator.berlin', '/layer/bezirke')).toBe(
			'https://navigator.berlin/layer/bezirke'
		);
	});

	it('strips hash fragments', () => {
		expect(buildCanonical('https://navigator.berlin', '/methodik#daten')).toBe(
			'https://navigator.berlin/methodik'
		);
	});
});
