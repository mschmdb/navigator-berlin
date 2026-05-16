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
		buildTimestamp: '2026-05-16T08:00:00.000Z',
		...overrides
	};
}

describe('buildRankingSitemapEntry', () => {
	it('rendert eine Entry für die deutsche Ranking-Page mit priority 0.7 / monthly', () => {
		const entry = buildRankingSitemapEntry({
			origin: ORIGIN,
			lastmod: '2026-05-16T08:00:00.000Z'
		});
		expect(entry.loc).toBe('https://navigator.berlin/wo-lebt-es-sich-gut');
		expect(entry.changefreq).toBe('monthly');
		expect(entry.priority).toBe(0.7);
		expect(entry.lastmod).toBe('2026-05-16T08:00:00.000Z');
	});

	it('strippt trailing slash vom origin', () => {
		const entry = buildRankingSitemapEntry({
			origin: 'https://navigator.berlin/',
			lastmod: '2026-05-16T08:00:00.000Z'
		});
		expect(entry.loc).toBe('https://navigator.berlin/wo-lebt-es-sich-gut');
	});
});

describe('RANKING_PAGE_SOURCE', () => {
	it('liefert für locale=de eine Entry mit buildTimestamp als lastmod', () => {
		const entries = RANKING_PAGE_SOURCE(fixtureContext());
		expect(entries).toHaveLength(1);
		expect(entries[0].loc).toBe('https://navigator.berlin/wo-lebt-es-sich-gut');
		expect(entries[0].lastmod).toBe('2026-05-16T08:00:00.000Z');
	});

	it('liefert für locale=en einen leeren Array (Phase-1 DE-only)', () => {
		expect(RANKING_PAGE_SOURCE(fixtureContext({ locale: 'en' }))).toEqual([]);
	});
});
