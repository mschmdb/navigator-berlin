import { describe, expect, it } from 'vitest';
import { load as loadIndex, prerender } from './+page.server.js';

describe('stories/+page.server', () => {
	it('ist nicht prerendert, damit die Subdomain-Wurzel per reroute funktioniert', () => {
		expect(prerender).toBe(false);
	});

	it('liefert den ersten Beitrag ohne Body', async () => {
		const result = (await (loadIndex as never as () => Promise<unknown>)()) as {
			entries: { slug: string; body: string }[];
		};
		expect(result.entries.map((e) => e.slug)).toContain('berlin-data-stories');
		expect(result.entries.every((e) => e.body === '')).toBe(true);
	});

	it('liefert die Vorschau-Daten nur als ersten Bezirk alphabetisch', async () => {
		const result = (await (loadIndex as never as () => Promise<unknown>)()) as {
			entries: { slug: string; frontmatter: { preview?: string } }[];
			preview: { slug: string; name: string } | null;
		};
		const previews = result.entries.map((e) => e.frontmatter.preview).filter(Boolean);
		expect(previews.length).toBeGreaterThan(0);
		expect(previews).toContain('punkt-linie-kiez-bezirke');
		expect(result.preview?.slug).toBe('charlottenburg-wilmersdorf');
	});

	it('liefert das Quadrat für die Miniatur von „Berlin in Quadraten“', async () => {
		const result = (await (loadIndex as never as () => Promise<unknown>)()) as {
			entries: { slug: string; frontmatter: { preview?: string } }[];
			quadrat: number[] | null;
		};
		const bq = result.entries.find((e) => e.slug === 'berlin-in-quadraten');
		expect(bq?.frontmatter.preview).toBe('berlin-in-quadraten');
		expect(result.quadrat).toHaveLength(9);
	});
});
