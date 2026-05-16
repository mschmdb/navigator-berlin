import { describe, expect, it } from 'vitest';
import { buildJsonFeed } from './build-json-feed.js';
import type { UpdateEntry } from '$lib/content/updates/types.js';

const entry: UpdateEntry = {
	slug: 'launch',
	filePath: '/_content/updates/2026-05-15-launch.md',
	frontmatter: {
		title_de: 'Launch · Test',
		summary_de: 'Erster Eintrag im Feed.',
		date: '2026-05-15',
		category: 'feature',
		tags: ['launch', 'demo'],
		lang: 'de'
	},
	body: 'Hallo **Welt**.'
};

const origin = 'https://navigator.berlin';

describe('buildJsonFeed', () => {
	it('hat version 1.1', () => {
		const feed = buildJsonFeed({ entries: [entry], origin });
		expect(feed.version).toBe('https://jsonfeed.org/version/1.1');
	});

	it('hat Feed-Meta', () => {
		const feed = buildJsonFeed({ entries: [entry], origin });
		expect(feed.title).toBe('Navigator Berlin · Updates');
		expect(feed.home_page_url).toBe('https://navigator.berlin/updates');
		expect(feed.feed_url).toBe('https://navigator.berlin/updates/feed.json');
		expect(feed.language).toBe('de');
	});

	it('rendert Item mit id, url, title, content, summary, date_published, tags', () => {
		const feed = buildJsonFeed({ entries: [entry], origin });
		expect(feed.items).toHaveLength(1);
		const item = feed.items[0]!;
		expect(item.id).toBe('https://navigator.berlin/updates/launch');
		expect(item.url).toBe('https://navigator.berlin/updates/launch');
		expect(item.title).toBe('Launch · Test');
		expect(item.content_text).toBe('Erster Eintrag im Feed.');
		expect(item.summary).toBe('Erster Eintrag im Feed.');
		expect(item.date_published).toBe('2026-05-15T00:00:00.000Z');
		expect(item.tags).toEqual(['launch', 'demo']);
		expect(item.content_html).toContain('<strong>Welt</strong>');
	});

	it('cap auf 50 items', () => {
		const many: UpdateEntry[] = Array.from({ length: 60 }, (_, i) => ({
			...entry,
			slug: `e${i}`,
			frontmatter: {
				...entry.frontmatter,
				date: `2026-05-${String((i % 28) + 1).padStart(2, '0')}`
			}
		}));
		const feed = buildJsonFeed({ entries: many, origin });
		expect(feed.items).toHaveLength(50);
	});
});
