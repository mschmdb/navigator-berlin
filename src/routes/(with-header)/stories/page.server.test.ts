import { describe, expect, it } from 'vitest';
import { load as loadIndex } from './+page.server.js';

describe('stories/+page.server', () => {
	it('liefert den ersten Beitrag ohne Body', async () => {
		const result = (await (loadIndex as never as () => Promise<unknown>)()) as {
			entries: { slug: string; body: string }[];
		};
		expect(result.entries.map((e) => e.slug)).toContain('berlin-data-stories');
		expect(result.entries.every((e) => e.body === '')).toBe(true);
	});
});
