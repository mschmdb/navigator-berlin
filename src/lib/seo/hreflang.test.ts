import { describe, it, expect } from 'vitest';
import { buildHreflangCluster } from './hreflang.js';

describe('buildHreflangCluster', () => {
	it('returns de-link + x-default for DE-only phase 1', () => {
		const cluster = buildHreflangCluster({
			origin: 'https://navigator.berlin',
			pathname: '/methodik',
			locales: ['de']
		});
		expect(cluster).toEqual([
			{ hreflang: 'de', href: 'https://navigator.berlin/methodik' },
			{ hreflang: 'x-default', href: 'https://navigator.berlin/methodik' }
		]);
	});

	it('strips query and hash from input pathname', () => {
		const cluster = buildHreflangCluster({
			origin: 'https://navigator.berlin',
			pathname: '/?bbox=13,52,14,53',
			locales: ['de']
		});
		expect(cluster).toEqual([
			{ hreflang: 'de', href: 'https://navigator.berlin/' },
			{ hreflang: 'x-default', href: 'https://navigator.berlin/' }
		]);
	});

	it('uses de path for x-default even when current pathname is already de-localized', () => {
		const cluster = buildHreflangCluster({
			origin: 'https://navigator.berlin',
			pathname: '/lizenzen',
			locales: ['de']
		});
		expect(cluster.find((c) => c.hreflang === 'x-default')?.href).toBe(
			'https://navigator.berlin/lizenzen'
		);
	});

	it('strips localized path prefix to compute canonical de pathname', () => {
		// If pathname comes in localized (e.g. "/en/methodik"), we still want de cluster
		// rendered against the de-canonical path "/methodik".
		const cluster = buildHreflangCluster({
			origin: 'https://navigator.berlin',
			pathname: '/methodik',
			locales: ['de']
		});
		const de = cluster.find((c) => c.hreflang === 'de');
		expect(de?.href).toBe('https://navigator.berlin/methodik');
	});
});
