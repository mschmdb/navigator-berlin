import { describe, expect, it } from 'vitest';
import { load } from './+page.server.js';

type Stories = {
	entries: { slug: string; body: string; frontmatter: { date: string } }[];
	preview: { slug: string } | null;
};

describe('(with-header)/+page.server load', () => {
	it('liefert höchstens drei Beiträge, neueste zuerst, ohne Body', async () => {
		const { stories } = (await load({} as never)) as { stories: Stories };
		expect(stories.entries.length).toBeGreaterThan(0);
		expect(stories.entries.length).toBeLessThanOrEqual(3);
		expect(stories.entries.every((e) => e.body === '')).toBe(true);
		const dates = stories.entries.map((e) => e.frontmatter.date);
		expect(dates).toEqual([...dates].sort().reverse());
		expect(stories.entries.map((e) => e.slug)).toContain('punkt-linie-kiez-bezirke');
	});

	it('liefert genau einen Bezirk für die Miniaturen', async () => {
		const { stories } = (await load({} as never)) as { stories: Stories };
		expect(stories.preview?.slug).toBe('charlottenburg-wilmersdorf');
	});
});
