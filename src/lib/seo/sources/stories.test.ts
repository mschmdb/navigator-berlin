import { describe, expect, it } from 'vitest';
import { buildStoriesSitemapEntries, STORIES_PAGES_SOURCE } from './stories.js';
import type { StoryEntry } from '$lib/content/stories/types.js';

const story = (slug: string, date: string): StoryEntry => ({
	slug,
	filePath: `/_content/stories/${date}-${slug}.md`,
	frontmatter: { title: slug, summary: `Summary ${slug}.`, date },
	body: 'Body'
});

const ORIGIN = 'https://navigator.berlin';

describe('buildStoriesSitemapEntries', () => {
	it('leere Liste ergibt keine Einträge', () => {
		expect(buildStoriesSitemapEntries({ entries: [], origin: ORIGIN })).toEqual([]);
	});

	it('liefert Index und Beiträge, neueste zuerst', () => {
		const out = buildStoriesSitemapEntries({
			entries: [story('alt', '2026-10-01'), story('neu', '2026-10-31')],
			origin: `${ORIGIN}/`
		});
		expect(out.map((e) => e.loc)).toEqual([
			'https://navigator.berlin/stories',
			'https://navigator.berlin/stories/neu',
			'https://navigator.berlin/stories/alt'
		]);
		expect(out[0]).toMatchObject({ priority: 0.6, lastmod: '2026-10-31' });
		expect(out[1]).toMatchObject({ priority: 0.7, lastmod: '2026-10-31' });
	});

	it('locale=en liefert /en-Pfade', () => {
		const out = buildStoriesSitemapEntries({
			entries: [story('x', '2026-10-31')],
			origin: ORIGIN,
			locale: 'en'
		});
		expect(out.map((e) => e.loc)).toEqual([
			'https://navigator.berlin/en/stories',
			'https://navigator.berlin/en/stories/x'
		]);
	});

	it('lässt ungültige Daten als lastmod weg', () => {
		const out = buildStoriesSitemapEntries({
			entries: [story('x', 'kaputt')],
			origin: ORIGIN
		});
		expect(out[1]).not.toHaveProperty('lastmod');
	});
});

describe('STORIES_PAGES_SOURCE', () => {
	it('liest den ersten Beitrag aus _content/stories', async () => {
		const out = await STORIES_PAGES_SOURCE({ origin: ORIGIN, locale: 'de' } as never);
		expect(out.map((e) => e.loc)).toContain('https://navigator.berlin/stories/berlin-data-stories');
	});
});
