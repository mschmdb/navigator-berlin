import { describe, expect, it } from 'vitest';
import { loadStoryTeaser } from './story-teaser.server';

describe('loadStoryTeaser', () => {
	it('liefert höchstens so viele Beiträge wie das Limit, ohne Body, neueste zuerst', () => {
		const { entries } = loadStoryTeaser(3);
		expect(entries.length).toBeGreaterThan(0);
		expect(entries.length).toBeLessThanOrEqual(3);
		expect(entries.every((e) => e.body === '')).toBe(true);
		const dates = entries.map((e) => e.frontmatter.date);
		expect(dates).toEqual([...dates].sort().reverse());
		expect(loadStoryTeaser(1).entries).toHaveLength(1);
	});

	it('liefert genau einen Bezirk für die Miniatur: den ersten alphabetisch', () => {
		expect(loadStoryTeaser().preview?.slug).toBe('charlottenburg-wilmersdorf');
	});
});
