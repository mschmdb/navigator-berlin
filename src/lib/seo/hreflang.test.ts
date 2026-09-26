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

	// Block A (i18n): once a path is marked translated, callers pass ['de', 'en']
	// and the cluster gets a real /en/... alternate via Paraglide's localizeHref.
	it('builds a de + en + x-default cluster for a translated path', () => {
		const cluster = buildHreflangCluster({
			origin: 'https://navigator.berlin',
			pathname: '/methodik',
			locales: ['de', 'en']
		});
		expect(cluster).toEqual([
			{ hreflang: 'de', href: 'https://navigator.berlin/methodik' },
			{ hreflang: 'en', href: 'https://navigator.berlin/en/methodik' },
			{ hreflang: 'x-default', href: 'https://navigator.berlin/methodik' }
		]);
	});

	it('resolves the en href correctly even when pathname arrives already locale-prefixed', () => {
		const cluster = buildHreflangCluster({
			origin: 'https://navigator.berlin',
			pathname: '/en/methodik',
			locales: ['de', 'en']
		});
		expect(cluster.find((c) => c.hreflang === 'de')?.href).toBe(
			'https://navigator.berlin/methodik'
		);
		expect(cluster.find((c) => c.hreflang === 'en')?.href).toBe(
			'https://navigator.berlin/en/methodik'
		);
	});
});

// Note: the end-to-end proof that a real (injected) translation-register
// entry drives SeoHead's own `locales` derivation into this exact
// de+en+x-default triple lives in `seo-head.svelte.test.ts` (renders SeoHead
// itself with a `registerEntries` prop, under both `de` and `en`) -- this
// file only covers `buildHreflangCluster` as a pure function.
