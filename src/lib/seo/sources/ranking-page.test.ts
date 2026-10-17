import { describe, expect, it } from 'vitest';
import { buildRankingSitemapEntry, RANKING_PAGE_SOURCE } from './ranking-page.js';
import type { SitemapSourceContext } from '../sitemap-builder.js';
import type { Manifest } from '$lib/data/types.js';

const ORIGIN = 'https://navigator.berlin';

function fixtureContext(overrides: Partial<SitemapSourceContext> = {}): SitemapSourceContext {
	const manifest: Manifest = {
		schemaVersion: 1,
		generatedAt: '2026-05-16T07:03:25.286Z',
		layers: []
	};
	return {
		origin: ORIGIN,
		locale: 'de',
		manifest,
		...overrides
	};
}

describe('buildRankingSitemapEntry', () => {
	it('rendert eine Entry für die deutsche Ranking-Page mit priority 0.7 / monthly', () => {
		const entry = buildRankingSitemapEntry({ origin: ORIGIN });
		expect(entry.loc).toBe('https://navigator.berlin/kiez-score');
		expect(entry.changefreq).toBe('monthly');
		expect(entry.priority).toBe(0.7);
		expect(entry.lastmod).toBeUndefined();
	});

	it('strippt trailing slash vom origin', () => {
		const entry = buildRankingSitemapEntry({
			origin: 'https://navigator.berlin/'
		});
		expect(entry.loc).toBe('https://navigator.berlin/kiez-score');
	});
});

describe('RANKING_PAGE_SOURCE', () => {
	it('liefert für locale=de eine Entry ohne lastmod', () => {
		const entries = RANKING_PAGE_SOURCE(fixtureContext());
		expect(entries).toHaveLength(1);
		expect(entries[0].loc).toBe('https://navigator.berlin/kiez-score');
		expect(entries[0].lastmod).toBeUndefined();
		expect(entries[0]).not.toHaveProperty('lastmod');
	});

	it('i18n Block D1: liefert für locale=en die /en-URL', () => {
		const entries = RANKING_PAGE_SOURCE(fixtureContext({ locale: 'en' }));
		expect(entries.map((e) => e.loc)).toEqual(['https://navigator.berlin/en/kiez-score']);
	});
});
