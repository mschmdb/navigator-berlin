import { describe, it, expect } from 'vitest';
import { buildCanonical, localizedPathname } from './canonical.js';

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

describe('localizedPathname', () => {
	it('keeps a de path unprefixed', () => {
		expect(localizedPathname('/methodik', 'de')).toBe('/methodik');
	});

	it('adds the en prefix', () => {
		expect(localizedPathname('/methodik', 'en')).toBe('/en/methodik');
	});

	it('resolves the de path correctly even when input already carries the en prefix', () => {
		expect(localizedPathname('/en/methodik', 'de')).toBe('/methodik');
	});

	it('resolves the en path correctly even when input already carries the en prefix', () => {
		expect(localizedPathname('/en/methodik', 'en')).toBe('/en/methodik');
	});

	// Security: a "//"-prefixed pathname must never make localizeHref resolve
	// against a foreign origin (code review, 2026-09-26).
	it('collapses a leading "//" so the result never becomes an off-origin/protocol-relative path', () => {
		const de = localizedPathname('//evil.example', 'de');
		const en = localizedPathname('//evil.example', 'en');
		expect(de.startsWith('//')).toBe(false);
		expect(en.startsWith('//')).toBe(false);
		expect(de.startsWith('/')).toBe(true);
		expect(en.startsWith('/')).toBe(true);
	});

	it('collapses a leading backslash trick the same way', () => {
		const result = localizedPathname('/\\evil.example', 'en');
		expect(result.startsWith('//')).toBe(false);
		expect(result.startsWith('/')).toBe(true);
	});
});
