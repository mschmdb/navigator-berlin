import { describe, it, expect } from 'vitest';
import {
	ogTargetTypes,
	buildOgFilename,
	buildOgPath,
	buildOgPublicUrl,
	type OgTargetType
} from './filename-resolver.js';

describe('ogTargetTypes', () => {
	it('enumerates exactly the four supported page types', () => {
		expect(ogTargetTypes).toEqual(['bezirk', 'kiez', 'layer', 'page']);
	});
});

describe('buildOgFilename', () => {
	it('returns {slug}.png (DE-only Phase 1, no locale suffix, no hash)', () => {
		expect(buildOgFilename('mitte')).toBe('mitte.png');
		expect(buildOgFilename('boxhagener-kiez')).toBe('boxhagener-kiez.png');
	});

	it('rejects empty slug', () => {
		expect(() => buildOgFilename('')).toThrow(/empty slug/i);
	});

	it('rejects slugs with path separators', () => {
		expect(() => buildOgFilename('foo/bar')).toThrow(/invalid slug/i);
		expect(() => buildOgFilename('foo\\bar')).toThrow(/invalid slug/i);
	});

	it('rejects slugs starting with dot (no hidden filenames)', () => {
		expect(() => buildOgFilename('.hidden')).toThrow(/invalid slug/i);
	});
});

describe('buildOgPath', () => {
	it('returns absolute filesystem path under static/og/{type}/{slug}.png', () => {
		const path = buildOgPath('/repo', 'bezirk', 'mitte');
		expect(path).toBe('/repo/static/og/bezirk/mitte.png');
	});

	it('handles all three types', () => {
		const types: readonly OgTargetType[] = ['bezirk', 'kiez', 'layer'];
		for (const t of types) {
			expect(buildOgPath('/r', t, 'x')).toBe(`/r/static/og/${t}/x.png`);
		}
	});
});

describe('buildOgPublicUrl', () => {
	it('returns absolute URL for og:image meta (requires origin without trailing slash)', () => {
		expect(buildOgPublicUrl('https://navigator.berlin', 'bezirk', 'mitte')).toBe(
			'https://navigator.berlin/og/bezirk/mitte.png'
		);
	});

	it('strips trailing slash from origin', () => {
		expect(buildOgPublicUrl('https://navigator.berlin/', 'kiez', 'boxhagener-kiez')).toBe(
			'https://navigator.berlin/og/kiez/boxhagener-kiez.png'
		);
	});

	it('rejects non-absolute origin', () => {
		expect(() => buildOgPublicUrl('/local', 'bezirk', 'mitte')).toThrow(/absolute origin/i);
	});
});
